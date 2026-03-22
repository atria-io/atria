import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDatabaseConnection } from "@atria/db";
import {
  ATRIA_CONFIG_FILE,
  ATRIA_RUNTIME_DIR,
  DEFAULT_ADMIN_PORT,
  DEFAULT_PUBLIC_PORT,
  PUBLIC_OUTPUT_DIR,
  type OwnerSetupState
} from "@atria/shared";
import { createAuthRuntime } from "./auth/runtime.js";
import { DEV_PUBLIC_HOST, ENABLE_LIVE_PUBLISH_TRANSITION } from "./dev/constants.js";
import { closeServer } from "./dev/lifecycle.js";
import { respondWithInternalServerError } from "./dev/http/errors.js";
import { isPublicOutputPublished } from "./dev/static/publish.js";
import { resolveAdminDistDir } from "./dev/admin/assets.js";
import { handleAdminRequest } from "./dev/admin/request.js";
import { handlePublicRequest } from "./dev/public/request.js";
import {
  handleSetupStatusRequest,
  isSetupStatusRequest
} from "./dev/setup/request.js";
import {
  handleHealthRequest,
  isHealthRequest,
} from "./dev/health/request.js";
import { readDatabaseHealthState } from "./dev/health/state.js";
import type { DatabaseHealthState } from "./dev/health/state.js";
import type { SiteTarget } from "./dev/types.js";

const SQLITE_RUNTIME_GUARD_THROTTLE_MS = 1500;

const BASE_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
};

const applyBaseSecurityHeaders = (response: ServerResponse): void => {
  for (const [headerName, headerValue] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.setHeader(headerName, headerValue);
  }
};

export interface StartDevServerOptions {
  projectRoot: string;
  adminPort?: number;
  publicPort?: number;
  port?: number;
  host?: string;
}

const createProjectIdentifier = (): string => {
  const raw = randomBytes(6).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return (raw + "00000000").slice(0, 8);
};

const readOrCreateProjectId = async (projectRoot: string): Promise<string> => {
  const configPath = path.join(projectRoot, ATRIA_CONFIG_FILE);
  const rawConfig = await fs.readFile(configPath, "utf-8");

  let parsedConfig: Record<string, unknown>;
  try {
    const value = JSON.parse(rawConfig);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("Config must be a JSON object.");
    }
    parsedConfig = value as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${ATRIA_CONFIG_FILE}: ${message}`);
  }

  const projectId =
    typeof parsedConfig.projectId === "string" ? parsedConfig.projectId.trim() : "";
  if (projectId) {
    return projectId;
  }

  const generatedProjectId = createProjectIdentifier();
  await fs.writeFile(
    configPath,
    `${JSON.stringify({ ...parsedConfig, projectId: generatedProjectId }, null, 2)}\n`,
    "utf-8"
  );

  return generatedProjectId;
};

/**
 * Handle returned by the local development server.
 */
export interface DevServerHandle {
  url: string;
  publicUrl: string;
  adminUrl: string;
  servingPublicDir: string;
  servingAdminDir: string;
  publicOutputPublished: boolean;
  close: () => Promise<void>;
}

/**
 * Starts local admin/public HTTP servers used by `atria dev`.
 *
 * @param {StartDevServerOptions} options
 * @returns {Promise<DevServerHandle>}
 */
export const startDevServer = async (
  options: StartDevServerOptions
): Promise<DevServerHandle> => {
  const { projectRoot } = options;
  const host = options.host ?? DEV_PUBLIC_HOST;
  const adminPort = options.adminPort ?? options.port ?? DEFAULT_ADMIN_PORT;
  const publicPort = options.publicPort ?? DEFAULT_PUBLIC_PORT;
  if (adminPort === publicPort) {
    throw new Error("Admin and public ports must be different.");
  }

  const projectId = await readOrCreateProjectId(projectRoot);
  const runtimeDir = path.join(projectRoot, ATRIA_RUNTIME_DIR);
  const publicDir = path.join(projectRoot, PUBLIC_OUTPUT_DIR);
  const adminDistDir = resolveAdminDistDir();
  const authRuntime = createAuthRuntime({
    projectRoot,
    adminPort,
    projectId
  });
  const connection = resolveDatabaseConnection(projectRoot);
  const sqliteRuntimeFilePath =
    connection.driver === "sqlite" &&
    connection.sqliteFilePath !== null &&
    connection.sqliteFilePath !== ":memory:"
      ? connection.sqliteFilePath
      : null;

  await fs.access(runtimeDir);
  await fs.access(path.join(adminDistDir, "app.js"));

  let publicOutputPublished = false;
  let ownerSetupState: OwnerSetupState;
  let databaseHealthState: DatabaseHealthState;
  let databaseRuntimeFlag: "sqlite_file_missing" | null = null;
  let lastRuntimeGuardCheckAt = 0;

  const refresh = async (key: "public" | "owner" | "database"): Promise<void> => {
    if (key === "public") {
      publicOutputPublished = await isPublicOutputPublished(publicDir);
      return;
    }

    if (key === "owner") {
      ownerSetupState = await authRuntime.getOwnerSetupState();
      return;
    }

    databaseHealthState = await readDatabaseHealthState(projectRoot);
  };

  const respondWithRuntimeFlag = (response: ServerResponse, requestUrl: URL): void => {
    if (requestUrl.pathname.startsWith("/api/")) {
      response.writeHead(503, { "content-type": "application/json; charset=utf-8" });
      response.end(
        JSON.stringify({
          ok: false,
          error: "Back Office data store is unavailable.",
          reason: databaseRuntimeFlag
        })
      );
      return;
    }

    response.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    response.end("503: Back Office data store is unavailable.");
  };

  const refreshRuntimeDatabaseFlag = async (): Promise<void> => {
    if (databaseRuntimeFlag || ownerSetupState.pending || !sqliteRuntimeFilePath) {
      return;
    }

    const now = Date.now();
    if (now - lastRuntimeGuardCheckAt < SQLITE_RUNTIME_GUARD_THROTTLE_MS) {
      return;
    }

    lastRuntimeGuardCheckAt = now;

    try {
      await fs.access(sqliteRuntimeFilePath);
    } catch {
      databaseRuntimeFlag = "sqlite_file_missing";
      console.error(
        `[atria/server] SQLite file missing at runtime (${sqliteRuntimeFilePath}). Admin routes are now locked.`
      );
    }
  };

  await Promise.all([refresh("public"), refresh("owner"), refresh("database")]);

  const handleSiteRequest = async (
    siteTarget: SiteTarget,
    requestPort: number,
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      applyBaseSecurityHeaders(response);
      const requestUrl = new URL(request.url ?? "/", `http://${DEV_PUBLIC_HOST}:${requestPort}`);
      const healthRequest = isHealthRequest(requestUrl);
      const setupStatusRequest = isSetupStatusRequest(requestUrl);

      if (ENABLE_LIVE_PUBLISH_TRANSITION && (siteTarget === "public" || healthRequest)) {
        await refresh("public");
      }

      if (siteTarget === "admin" || setupStatusRequest) {
        await refresh("owner");
        await refreshRuntimeDatabaseFlag();
        if (databaseRuntimeFlag) {
          respondWithRuntimeFlag(response, requestUrl);
          return;
        }
      }

      if (healthRequest) {
        await refresh("database");

        handleHealthRequest({
          response,
          siteTarget,
          publicOutputPublished,
          ownerSetupState,
          databaseHealthState
        });
        return;
      }

      if (handleSetupStatusRequest(requestUrl, response, siteTarget, ownerSetupState)) {
        return;
      }

      if (siteTarget === "admin") {
        await handleAdminRequest({
          request,
          response,
          requestUrl,
          runtimeDir,
          adminDistDir,
          ownerSetupState,
          authRuntime
        });
        return;
      }

      await handlePublicRequest({
        requestUrl,
        response,
        publicDir,
        publicOutputPublished
      });
    } catch (error) {
      console.error(
        `[atria/server] Unexpected request error (${request.method ?? "GET"} ${request.url ?? "/"})`,
        error
      );

      if (response.writableEnded) {
        return;
      }

      if (response.headersSent) {
        response.end();
        return;
      }

      respondWithInternalServerError(response);
    }
  };

  const adminServer = createServer((request, response) => {
    void handleSiteRequest("admin", adminPort, request, response);
  });

  const publicServer = createServer((request, response) => {
    void handleSiteRequest("public", publicPort, request, response);
  });

  const listen = async (server: Server, port: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, () => {
        server.off("error", reject);
        resolve();
      });
    });

  try {
    await Promise.all([listen(adminServer, adminPort), listen(publicServer, publicPort)]);
  } catch (error) {
    await Promise.allSettled([closeServer(adminServer), closeServer(publicServer)]);
    await authRuntime.close();
    throw error;
  }

  return {
    url: `http://${DEV_PUBLIC_HOST}:${publicPort}`,
    publicUrl: `http://${DEV_PUBLIC_HOST}:${publicPort}`,
    adminUrl: `http://${DEV_PUBLIC_HOST}:${adminPort}`,
    servingPublicDir: publicDir,
    servingAdminDir: runtimeDir,
    get publicOutputPublished() {
      return publicOutputPublished;
    },
    close: async () => {
      await Promise.all([closeServer(adminServer), closeServer(publicServer)]);
      await authRuntime.close();
    }
  };
};

import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ATRIA_RUNTIME_DIR, PUBLIC_OUTPUT_DIR } from "@atria/shared";
import { createAuthRuntime } from "./auth/runtime.js";
import {
  DEV_PUBLIC_HOST,
  DEV_STUDIO_HOST,
  ENABLE_LIVE_PUBLISH_TRANSITION
} from "./dev/constants.js";
import { closeServer } from "./dev/lifecycle.js";
import {
  respondWithDefaultNotFound,
  respondWithInternalServerError
} from "./dev/http/errors.js";
import { parseRequestHostname, resolveSiteTarget } from "./dev/http/routing.js";
import { isPublicOutputPublished } from "./dev/static/publish.js";
import { resolveAdminDistDir } from "./dev/admin/assets.js";
import { handleAdminRequest } from "./dev/admin/request.js";
import { handlePublicRequest } from "./dev/public/request.js";
import {
  handleSetupStatusRequest,
  isSetupStatusRequest
} from "./dev/setup/request.js";
import type { OwnerSetupState } from "./dev/setup/types.js";
import {
  handleHealthRequest,
  isHealthRequest,
} from "./dev/health/request.js";
import { readDatabaseHealthState } from "./dev/health/state.js";
import type { DatabaseHealthState } from "./dev/health/state.js";

export interface StartDevServerOptions {
  projectRoot: string;
  port: number;
  host?: string;
}

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
 * Starts the single local HTTP server used by `atria dev`.
 *
 * @param {StartDevServerOptions} options
 * @returns {Promise<DevServerHandle>}
 */
export const startDevServer = async (
  options: StartDevServerOptions
): Promise<DevServerHandle> => {
  const { projectRoot, port } = options;
  const host = options.host ?? DEV_PUBLIC_HOST;
  const runtimeDir = path.join(projectRoot, ATRIA_RUNTIME_DIR);
  const publicDir = path.join(projectRoot, PUBLIC_OUTPUT_DIR);
  const adminDistDir = resolveAdminDistDir();
  const authRuntime = createAuthRuntime({
    projectRoot,
    port
  });

  await fs.access(runtimeDir);
  await fs.access(path.join(adminDistDir, "app.js"));

  let publicOutputPublished = false;
  let ownerSetupState: OwnerSetupState;
  let databaseHealthState: DatabaseHealthState;

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

  await Promise.all([refresh("public"), refresh("owner"), refresh("database")]);

  const server = createServer(async (request, response) => {
    try {
      const hostname = parseRequestHostname(request.headers.host);
      const siteTarget = resolveSiteTarget(hostname);
      if (!siteTarget) {
        respondWithDefaultNotFound(response);
        return;
      }

      const requestHost = hostname ?? DEV_PUBLIC_HOST;
      const requestUrl = new URL(request.url ?? "/", `http://${requestHost}:${port}`);
      const healthRequest = isHealthRequest(requestUrl);
      const setupStatusRequest = isSetupStatusRequest(requestUrl);

      if (ENABLE_LIVE_PUBLISH_TRANSITION && (siteTarget === "public" || healthRequest)) {
        await refresh("public");
      }

      if (siteTarget === "admin" || setupStatusRequest) {
        await refresh("owner");
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
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    url: `http://${DEV_PUBLIC_HOST}:${port}`,
    publicUrl: `http://${DEV_PUBLIC_HOST}:${port}`,
    adminUrl: `http://${DEV_STUDIO_HOST}:${port}`,
    servingPublicDir: publicDir,
    servingAdminDir: runtimeDir,
    get publicOutputPublished() {
      return publicOutputPublished;
    },
    close: async () => {
      await closeServer(server);
      await authRuntime.close();
    }
  };
};

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
import { respondWithDefaultNotFound } from "./dev/http/errors.js";
import { parseRequestHostname, resolveSiteTarget } from "./dev/http/routing.js";
import { isPublicOutputPublished } from "./dev/static/index.js";
import { handleAdminRequest, resolveAdminDistDir } from "./dev/admin/index.js";
import { handlePublicRequest } from "./dev/public/index.js";
import {
  handleSetupStatusRequest,
  isSetupStatusRequest,
  type OwnerSetupState
} from "./dev/setup/index.js";
import {
  handleHealthRequest,
  isHealthRequest,
  readDatabaseHealthState,
  type DatabaseHealthState
} from "./dev/health/index.js";

export interface StartDevServerOptions {
  projectRoot: string;
  port: number;
  host?: string;
}

export interface DevServerHandle {
  url: string;
  publicUrl: string;
  adminUrl: string;
  servingPublicDir: string;
  servingAdminDir: string;
  publicOutputPublished: boolean;
  close: () => Promise<void>;
}

export const startDevServer = async (
  options: StartDevServerOptions
): Promise<DevServerHandle> => {
  const host = options.host ?? DEV_PUBLIC_HOST;
  const runtimeDir = path.join(options.projectRoot, ATRIA_RUNTIME_DIR);
  const publicDir = path.join(options.projectRoot, PUBLIC_OUTPUT_DIR);
  const adminDistDir = resolveAdminDistDir();
  const authRuntime = createAuthRuntime({
    projectRoot: options.projectRoot,
    port: options.port
  });

  await fs.access(runtimeDir);
  await fs.access(path.join(adminDistDir, "app.js"));

  let publicOutputPublished = await isPublicOutputPublished(publicDir);
  let ownerSetupState: OwnerSetupState = await authRuntime.getOwnerSetupState();
  let databaseHealthState: DatabaseHealthState = await readDatabaseHealthState(options.projectRoot);

  const refreshPublicPublishState = async (): Promise<void> => {
    publicOutputPublished = await isPublicOutputPublished(publicDir);
  };

  const refreshOwnerSetupState = async (): Promise<void> => {
    ownerSetupState = await authRuntime.getOwnerSetupState();
  };

  const refreshDatabaseHealthState = async (): Promise<void> => {
    databaseHealthState = await readDatabaseHealthState(options.projectRoot);
  };

  const server = createServer(async (request, response) => {
    try {
      const hostname = parseRequestHostname(request.headers.host);
      const siteTarget = resolveSiteTarget(hostname);
      if (!siteTarget) {
        respondWithDefaultNotFound(response);
        return;
      }

      const requestHost = hostname ?? DEV_PUBLIC_HOST;
      const requestUrl = new URL(request.url ?? "/", `http://${requestHost}:${options.port}`);

      if (ENABLE_LIVE_PUBLISH_TRANSITION && (siteTarget === "public" || isHealthRequest(requestUrl))) {
        await refreshPublicPublishState();
      }

      if (siteTarget === "admin" || isSetupStatusRequest(requestUrl)) {
        await refreshOwnerSetupState();
      }

      if (isHealthRequest(requestUrl)) {
        await refreshDatabaseHealthState();

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
    } catch {
      respondWithDefaultNotFound(response);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return {
    url: `http://${DEV_PUBLIC_HOST}:${options.port}`,
    publicUrl: `http://${DEV_PUBLIC_HOST}:${options.port}`,
    adminUrl: `http://${DEV_STUDIO_HOST}:${options.port}`,
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

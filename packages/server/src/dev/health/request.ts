import type { ServerResponse } from "node:http";
import { MIME_TYPES } from "../constants.js";
import type { SiteTarget } from "../types.js";
import type { OwnerSetupState } from "../setup/types.js";
import type { DatabaseHealthState } from "./state.js";

const HEALTH_PATH = "/api/health";

interface HandleHealthRequestOptions {
  response: ServerResponse;
  siteTarget: SiteTarget;
  publicOutputPublished: boolean;
  ownerSetupState: OwnerSetupState;
  databaseHealthState: DatabaseHealthState;
}

export const isHealthRequest = (requestUrl: URL): boolean => requestUrl.pathname === HEALTH_PATH;

export const handleHealthRequest = (options: HandleHealthRequestOptions): void => {
  const { response, siteTarget, publicOutputPublished, ownerSetupState, databaseHealthState } = options;

  response.writeHead(200, { "content-type": MIME_TYPES[".json"] });
  response.end(
    JSON.stringify({
      ok: databaseHealthState.reachable,
      status: databaseHealthState.reachable ? "operational" : "degraded",
      site: siteTarget,
      publicOutputPublished,
      ownerSetupPending: ownerSetupState.pending,
      database: {
        driver: databaseHealthState.driver,
        source: databaseHealthState.source,
        usesFallback: databaseHealthState.usesFallback,
        reachable: databaseHealthState.reachable,
        error: databaseHealthState.error
      }
    })
  );
};

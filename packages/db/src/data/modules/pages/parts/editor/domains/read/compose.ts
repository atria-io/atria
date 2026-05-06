import { sql } from "@/data/modules/pages/queriesApi.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";
import { mapPage, toVersionId } from "./mappers/mapPage.js";
import { getPageRoute } from "../../../routes/domains/get/service.js";
import type { PageRecord, WorkspaceRecord, VersionSnapshot } from "./types.js";
import type { PageById, PageDocument } from "@/data/modules/pages/types.js";

const loadVersionSnapshot = (
  db: scope.PagesDatabase,
  uuid: string,
  version: string | null
): VersionSnapshot | undefined => {
  if (!version) {
    return undefined;
  }

  return db.prepare(sql.read.selectVersionById).get(uuid, version) as
    | VersionSnapshot
    | undefined;
};

export const composePageByIdSync = (
  db: scope.PagesDatabase,
  uuid: string,
  input: PageById = {}
): PageDocument | null => {
  const pageRecord = db.prepare(sql.read.selectByUuid).get(uuid) as
    | PageRecord
    | undefined;

  if (!pageRecord) {
    return null;
  }

  const workspaceRecord = db.prepare(sql.read.selectWorkspace).get() as
    | WorkspaceRecord
    | undefined;

  const locale = scope.getLocale(input.locale);
  const route = getPageRoute(db, uuid, locale);

  const version = toVersionId(input.versionId);
  const workspace = scope.resolveFolders(support.parseJSON(workspaceRecord?.dataJson));
  const snapshot = loadVersionSnapshot(db, uuid, version);

  return mapPage(pageRecord, route, workspace, snapshot, version);
};

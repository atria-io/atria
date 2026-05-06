import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";

import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";
import * as routes from "../../../routes/domains/get/service.js";

import type * as readTypes from "../../../editor/domains/read/types.js";
import type * as pagesTypes from "@/data/modules/pages/types.js";

type BasePage = {
  uuid: string;
  title: string;
  status: pagesTypes.DocumentStatus;
  draftSlug: string;
  template: string;
  updatedAt: string;
  publishedSlug: string | null;
};

const toBasePage = (
  row: readTypes.PageRecord
): BasePage | null => {
  const uuid = support.toString(row.uuid);
  const title = support.toString(row.title);
  const status = support.toString(row.status) as pagesTypes.DocumentStatus;
  const draftSlug = support.toString(row.draftSlug);
  const template = support.toString(row.template);
  const updatedAt = support.toString(row.updatedAt);

  if (!uuid || !title || !status || !draftSlug || !template || !updatedAt) {
    return null;
  }

  return {
    uuid,
    title,
    status,
    draftSlug,
    template,
    updatedAt,
    publishedSlug: support.toStringOrNull(row.publishedSlug),
  };
};

export const listPages = async (
  input: pagesTypes.Catalog = {}
): Promise<pagesTypes.CatalogItem[]> => {
  return withDatabase<pagesTypes.CatalogItem[]>([], (db) => {
    try {
      const locale = scope.getLocale(input.locale);
      const rows = db
        .prepare(sql.catalog.listByLocale)
        .all() as
        | Array<readTypes.PageRecord>;
      const workspaceRecord = db
        .prepare(sql.catalog.selectWorkspace)
        .get() as
        | readTypes.WorkspaceRecord
        | undefined;
      const workspace = scope.resolveFolders(support.parseJSON(workspaceRecord?.dataJson));

      const pages: pagesTypes.CatalogItem[] = [];
      for (const row of rows) {
        const base = toBasePage(row);
        if (!base) {
          continue;
        }

        const folderId = scope.getFolderId(workspace, base.uuid);
        if (input.folderId && folderId !== input.folderId) {
          continue;
        }

        const route = routes.getPageRoute(db, base.uuid, locale) as
          | readTypes.PageListRoute
          | undefined;
        const publishedSlug = support.toBoolean(route?.isPublished)
          ? (support.toStringOrNull(route?.slug) ?? base.publishedSlug)
          : base.publishedSlug;

        pages.push({
          uuid: base.uuid,
          title: base.title,
          status: base.status,
          draftSlug: base.draftSlug,
          publishedSlug,
          template: base.template,
          folderId,
          updatedAt: base.updatedAt,
        });
      }

      return pages;
    } catch {
      return [];
    }
  });
};

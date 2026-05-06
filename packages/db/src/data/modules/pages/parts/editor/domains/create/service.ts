import { randomUUID } from "node:crypto";
import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";

import * as editorRead from "../../../editor/domains/read/compose.js";
import * as routesUpsert from "../../../routes/domains/upsert/service.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";

import type * as pagesTypes from "@/data/modules/pages/types.js";

const DEFAULT_TEMPLATE = "page.default";

const createDraftContent = (
  uuid: string,
  title: string,
  slug: string,
  template: string,
  timestamp: string
): string => {
  return JSON.stringify({
    _uuid: uuid,
    _status: "draft",
    _document: "page",
    _template: template,
    title,
    slug,
    meta: {
      title,
      description: "",
      robots: "index,follow",
      image: {
        src: "",
        alt: "",
      },
    },
    excerpt: "",
    content: "",
    timestamps: {
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: null,
    },
    sections: {},
    order: [],
  });
};

export const createPageDraft = async (
  input: pagesTypes.PageCreate
): Promise<pagesTypes.PageDocument | null> => {
  return withDatabase<pagesTypes.PageDocument | null>(null, (db) => {
    const slug = scope.normalizeSlug(input.slug);
    if (slug === "") {
      return null;
    }

    const now = support.getTimestamp();
    const uuid = randomUUID();
    const title = support.toString(input.title) ?? slug;
    const template = support.toString(input.template) ?? DEFAULT_TEMPLATE;
    const draft = createDraftContent(uuid, title, slug, template, now);
    const locale = scope.getLocale(input.locale);

    try {
      scope.runInTransaction(db, () => {
        db
          .prepare(sql.page.insert)
          .run(
            uuid,
            template,
            title,
            "draft",
            slug,
            null,
            draft,
            null,
            null,
            now,
            now,
            null
          );

        routesUpsert.upsertPageRoute(db, locale, uuid, slug, null, 0);

        if (input.folderId) {
          const workspaceRecord = db
            .prepare(sql.folder.selectWorkspace)
            .get() as
              | { dataJson?: unknown }
              | undefined;
          const workspace = scope.resolveFolders(
            support.parseJSON(workspaceRecord?.dataJson)
          );
          const assignments = workspace.assignments as Record<string, unknown>;
          assignments[uuid] = input.folderId;
          db
            .prepare(sql.folder.upsertWorkspace)
            .run(
              JSON.stringify(workspace),
              now
            );
        }
      });

      return editorRead.composePageByIdSync(db, uuid, { locale });
    } catch {
      return null;
    }
  });
};

import { randomUUID } from "node:crypto";
import { withDB } from "@/system/with.js";
import { getTimestamp } from "@/data/coerce.js";
import { toPageRecord } from "../serializer.js";
import { sql } from "../dml.api.js";

const vid = () => {
  return randomUUID().replace(/-/g, "").slice(0, 7);
};

const aid = () => {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

const normVid = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]{7}$/.test(normalized)) {
    return null;
  }
  return normalized;
};

const parseJson = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const sem = (page) => {
  if (!page || typeof page !== "object") {
    return null;
  }

  return {
    title: typeof page.title === "string" ? page.title.trim() : "",
    slug: typeof page.slug === "string" ? page.slug.trim() : "",
    content: typeof page.content === "string" ? page.content : "",
    status: page.status === "published" || page.status === "archived" ? page.status : "draft",
  };
};

const sameSem = (left, right) => {
  const a = sem(left);
  const b = sem(right);
  if (!a || !b) {
    return false;
  }

  return a.title === b.title
    && a.slug === b.slug
    && a.content === b.content
    && a.status === b.status;
};

export const updatePage = async (input) => {
  return withDB((db) => {
    const now = getTimestamp();
    const prev = db.prepare(sql.read.selectPageById).get(input.id);
    if (!prev) {
      return null;
    }

    const result = db.prepare(sql.update.updatePage).run(
      input.status,
      input.title,
      input.slug,
      input.content,
      input.status,
      now,
      now,
      input.id
    );
    if ((typeof result?.changes === "number" ? result.changes : 0) < 1) {
      return null;
    }
    const row = db.prepare(sql.read.selectPageById).get(input.id);
    if (!row) {
      return null;
    }
    const page = toPageRecord(row);
    const versionId = normVid(input.versionId);
    const prevStatus = prev.status;
    const actions = db.prepare(sql.read.selectPageActionsById).all(input.id);
    const liveVersionId = actions.find((action) =>
      action?.type === "document:published" && typeof action?.versionId === "string"
    )?.versionId ?? null;
    const isPublishTransition = input.status === "published"
      && (
        prevStatus !== "published"
        || (versionId !== null && versionId !== liveVersionId)
      );
    const kind =
      isPublishTransition
        ? "document:published"
        : input.status === "draft" && prevStatus === "published"
          ? "document:unpublished"
          : input.status === "archived" && prevStatus !== "archived"
            ? "document:archived"
            : "document:updated";

    db.prepare(sql.create.insertPageAction).run(
      aid(),
      "page",
      input.id,
      versionId,
      kind,
      JSON.stringify(page),
      now
    );

    if (!versionId) {
      return page;
    }

    db.prepare(sql.update.upsertPageVersion).run(
      "page",
      input.id,
      versionId,
      JSON.stringify(page),
      now
    );

    return page;
  });
};

export const savePageVersion = async (input) => {
  return withDB((db) => {
    const row = db.prepare(sql.read.selectPageById).get(input.id);
    if (!row) {
      return null;
    }

    const now = getTimestamp();
    const createdAt = typeof row.createdAt === "string" ? row.createdAt : now;
    const versionStatus = input.status === "archived" ? "archived" : "draft";
    const page = {
      id: input.id,
      type: "page",
      status: versionStatus,
      title: input.title,
      slug: input.slug,
      content: input.content,
      timestamps: {
        createdAt,
        publishedAt: null,
        updatedAt: now,
      },
    };

    const versionId = normVid(input.versionId) ?? vid();
    const prevRow = db.prepare(sql.read.selectPageVersionById).get(input.id, versionId);
    const prevPage = parseJson(prevRow?.snapshot);
    if (sameSem(prevPage, page)) {
      return { ...(prevPage ?? page), versionId };
    }

    db.prepare(sql.update.upsertPageVersion).run(
      "page",
      input.id,
      versionId,
      JSON.stringify(page),
      now
    );

    db.prepare(sql.create.insertPageAction).run(
      aid(),
      "page",
      input.id,
      versionId,
      input.versionId ? "version:updated" : "version:created",
      JSON.stringify(page),
      now
    );

    return { ...page, versionId };
  });
};

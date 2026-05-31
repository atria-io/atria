import { withDB } from "@/system/with.js";
import { sql } from "../dml.api.js";
import { toPageRecord } from "../serializer.js";

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

const toVersion = (row) => {
  const page = parseJson(row?.snapshot);
  if (!page || typeof page !== "object") {
    return null;
  }
  return { ...page, versionId: row.versionId };
};

export const listPages = async () => {
  return withDB((db) => {
    const rows = db.prepare(sql.read.selectPages).all();
    return rows.map(toPageRecord).filter((page) => page.id !== "");
  });
};

export const getPageById = async (id) => {
  return withDB((db) => {
    const row = db.prepare(sql.read.selectPageById).get(id);
    if (!row) {
      return null;
    }
    const page = toPageRecord(row);
    return page.id === "" ? null : page;
  });
};

export const getLatestPageVersionById = async (id) => {
  return withDB((db) => {
    let row;
    try {
      row = db.prepare(sql.read.selectLatestPageVersionById).get(id);
    } catch {
      return null;
    }

    return toVersion(row);
  });
};

export const getPageVersionById = async (id, versionId) => {
  return withDB((db) => {
    let row;
    try {
      row = db.prepare(sql.read.selectPageVersionById).get(id, versionId);
    } catch {
      return null;
    }

    return toVersion(row);
  });
};

export const getPageActionsById = async (id) => {
  return withDB((db) => {
    let rows;
    try {
      rows = db.prepare(sql.read.selectPageActionsById).all(id);
    } catch {
      return [];
    }

    return rows.map((row) => {
      const payload = parseJson(row.payload);

      return {
        id: row.id,
        documentType: row.documentType,
        documentId: row.documentId,
        versionId: row.versionId ?? null,
        type: row.type,
        payload,
        createdAt: row.createdAt,
      };
    });
  });
};

export const getPageActionById = async (id, versionId, actionId) => {
  return withDB((db) => {
    let row;
    try {
      row = db.prepare(sql.read.selectPageActionById).get(id, versionId, actionId);
    } catch {
      return null;
    }

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      documentType: row.documentType,
      documentId: row.documentId,
      versionId: row.versionId ?? null,
      type: row.type,
      payload: parseJson(row.payload),
      createdAt: row.createdAt,
    };
  });
};

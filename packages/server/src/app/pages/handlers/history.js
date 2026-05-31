import * as db from "@atria/db";

export const getPageHistory = async (id, res) => {
  const canonical = await db.pages.getPageById(id);
  if (!canonical) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  const actions = await db.pages.getPageActionsById(id);
  const liveVersionId = actions.find((action) =>
    action.type === "document:published" && typeof action.versionId === "string"
  )?.versionId ?? null;
  const versionsMap = new Map();

  for (const action of actions) {
    if (!action.versionId) {
      continue;
    }

    const current = versionsMap.get(action.versionId);
    if (current) {
      current.actions.push(action);
      continue;
    }

    versionsMap.set(action.versionId, {
      versionId: action.versionId,
      actions: [action],
    });
  }

  const versions = Array.from(versionsMap.values()).map((entry) => ({
    versionId: entry.versionId,
    actions: entry.actions,
    live: entry.versionId === liveVersionId,
  }));

  res.json({
    id: canonical.id,
    canonicalStatus: canonical.status,
    versions,
  });
};

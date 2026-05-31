import * as db from "@atria/db";

const isVersionPublishable = (canonical, version) => {
  return (
    canonical.title !== version.title
    || canonical.slug !== version.slug
    || canonical.content !== version.content
  );
};

export const getPage = async (id, versionId, actionId, isEditorMode, res) => {
  const canonical = await db.pages.getPageById(id);
  if (!canonical) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  if (versionId && actionId) {
    const action = await db.pages.getPageActionById(id, versionId, actionId);
    if (!action || !action.payload || typeof action.payload !== "object") {
      res.json({ error: "Not Found" }, 404);
      return;
    }
    const version = { ...action.payload, versionId };
    res.json({
      ...version,
      editorMode: isVersionPublishable(canonical, version),
      versionId,
      canonicalStatus: canonical.status,
    });
    return;
  }

  if (versionId) {
    const version = await db.pages.getPageVersionById(id, versionId);
    if (!version) {
      res.json({ error: "Not Found" }, 404);
      return;
    }
    res.json({
      ...version,
      editorMode: isVersionPublishable(canonical, version),
      versionId,
      canonicalStatus: canonical.status,
    });
    return;
  }

  if (isEditorMode) {
    const latestVersion = await db.pages.getLatestPageVersionById(id);
    if (latestVersion) {
      res.json({
        ...latestVersion,
        editorMode: isVersionPublishable(canonical, latestVersion),
        versionId: latestVersion.versionId,
        canonicalStatus: canonical.status,
      });
      return;
    }
  }

  const { versionId: _versionId, editorMode: _editorMode, canonicalStatus: _canonicalStatus, ...canonicalPage } = canonical;
  res.json(canonicalPage);
};

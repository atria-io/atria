import * as parse from "./parse.js";
import { createPage } from "./handlers/create.js";
import { getPage } from "./handlers/get.js";
import { getPageHistory } from "./handlers/history.js";
import { listPages } from "./handlers/list.js";
import { removePage } from "./handlers/remove.js";
import { updatePage } from "./handlers/update.js";

export const routes = (app) => {
  app.get("/api/pages", listPages);
  app.post("/api/pages", createPage);

  app.use(async (req, res, next) => {
    const parts = req.path.split("/").filter(Boolean);

    if (parts[0] !== "api") {
      await next();
      return;
    }

    const pageTarget = parts[1];
    if (!pageTarget?.startsWith("pages:")) {
      await next();
      return;
    }

    const [resource, rawId, rawMode, rawVersionId, rawActionId] = pageTarget.split(":");
    if (resource !== "pages") {
      await next();
      return;
    }

    const id = parse.uuid(rawId);
    const isHistoryMode = rawMode === "history";
    const isEditorMode = rawMode === "editor";
    const versionToken = isEditorMode ? rawVersionId : rawMode;
    const actionToken = isEditorMode ? rawActionId : null;
    const versionId = versionToken ? parse.version(versionToken) : null;
    const actionId = actionToken ? parse.action(actionToken) : null;

    if (isHistoryMode) {
      if (!id || rawVersionId || rawActionId || req.method !== "GET") {
        await next();
        return;
      }

      await getPageHistory(id, res);
      return;
    }

    if ((rawVersionId || rawActionId) && !isEditorMode) {
      await next();
      return;
    }

    if (versionToken && !versionId) {
      await next();
      return;
    }

    if (actionToken && !actionId) {
      await next();
      return;
    }

    if (actionToken && !versionId) {
      await next();
      return;
    }

    if (!id || parts.length !== 2) {
      await next();
      return;
    }

    if (req.method === "GET") {
      await getPage(id, versionId, actionId, isEditorMode, res);
      return;
    }

    if (req.method === "PATCH") {
      if (isEditorMode) {
        await next();
        return;
      }

      await updatePage(req, res, id, versionId);
      return;
    }

    if (req.method === "DELETE") {
      await removePage(id, res);
      return;
    }

    await next();
  });
};

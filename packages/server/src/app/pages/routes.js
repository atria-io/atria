import * as parse from "./parse.js";
import { createPage } from "./handlers/create.js";
import { getPage } from "./handlers/get.js";
import { listPages } from "./handlers/list.js";
import { removePage } from "./handlers/remove.js";
import { updatePage } from "./handlers/update.js";

export const routes = (app) => {
  app.get("/api/pages", listPages);
  app.post("/api/pages", createPage);

  app.use(async (req, res, next) => {
    const parts = req.path.split("/").filter(Boolean);

    if (parts[0] !== "api" || parts[1] !== "pages") {
      await next();
      return;
    }

    const id = parse.uuid(parts[2]);
    if (!id || parts.length !== 3) {
      await next();
      return;
    }

    if (req.method === "GET") {
      await getPage(id, res);
      return;
    }

    if (req.method === "PATCH") {
      await updatePage(req, res, id);
      return;
    }

    if (req.method === "DELETE") {
      await removePage(id, res);
      return;
    }

    await next();
  });
};

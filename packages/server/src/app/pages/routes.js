import * as db from "@atria/db";
import { readBody } from "@atria/server/body.js";
import { parseSlug, parseStatus, parseTitle, parseUuid } from "./shared.js";

export const routes = (app) => {
  app.get("/api/pages", async (req, res) => {
    res.json({ items: await db.pages.listPages() });
  });

  app.post("/api/pages", async (req, res) => {
    const payload = await readBody(req);
    const id = parseUuid(payload?.id);
    const title = parseTitle(payload?.title);
    const slug = parseSlug(payload?.slug);

    if (!id || !title || !slug) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const page = await db.pages.createPage(
      {
        id,
        title,
        slug
      }
    );
    if (!page) {
      res.statusCode = 409;
      res.end();
      return;
    }

    res.json(page, 201);
  });

  app.use(async (req, res, next) => {
    const readPathParts = (req) => {
      return req.path.split("/").filter(Boolean);
    };
    const parts = readPathParts(req);

    if (parts[0] !== "api" || parts[1] !== "pages") {
      await next();
      return;
    }

    const id = parseUuid(parts[2]);
    if (!id || parts.length !== 3) {
      await next();
      return;
    }

    if (req.method === "GET") {
      const page = await db.pages.getPageById(id);
      if (!page) {
        res.json({ error: "Not Found" }, 404);
        return;
      }

      res.json(page);
      return;
    }

    if (req.method === "PATCH") {
      const payload = await readBody(req);
      const title = parseTitle(payload?.title);
      const slug = parseSlug(payload?.slug);
      const status = parseStatus(payload?.status);

      if (!title || !slug || !status) {
        res.statusCode = 400;
        res.end();
        return;
      }

      const page = await db.pages.updatePage({ id, title, slug, status });
      if (!page) {
        res.json({ error: "Not Found" }, 404);
        return;
      }

      res.json(page);
      return;
    }

    if (req.method === "DELETE") {
      const deleted = await db.pages.deletePage(id);
      if (!deleted) {
        res.json({ error: "Not Found" }, 404);
        return;
      }

      res.statusCode = 204;
      res.end();
      return;
    }

    await next();
  });
};

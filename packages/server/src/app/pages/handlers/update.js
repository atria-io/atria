import * as db from "@atria/db";
import { json } from "@atria/server/json.js";
import * as parse from "../parse.js";

export const updatePage = async (req, res, id, versionId) => {
  const payload = await json(req);
  const title = parse.title(payload?.title);
  const slug = parse.slug(payload?.slug);
  const content = parse.content(payload?.content);
  const status = parse.status(payload?.status);
  const operation = payload?.operation === "version" ? "version" : "update";

  if (title === null || slug === null || content === null || !status) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const current = await db.pages.getPageById(id);
  if (!current) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  if (current.status === "archived" && status === "published") {
    res.json({ error: "Invalid Transition" }, 409);
    return;
  }

  const page = operation === "version"
    ? await db.pages.savePageVersion({
      id,
      title,
      slug,
      content,
      status,
      versionId,
    })
    : await db.pages.updatePage({
      id,
      title,
      slug,
      content,
      status,
      versionId,
    });

  if (!page) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  res.json(page);
};

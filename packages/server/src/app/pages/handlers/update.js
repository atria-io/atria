import * as db from "@atria/db";
import { json } from "@atria/server/json.js";
import * as parse from "../parse.js";

export const updatePage = async (req, res, id) => {
  const payload = await json(req);
  const title = parse.title(payload?.title);
  const slug = parse.slug(payload?.slug);
  const content = parse.content(payload?.content);
  const status = parse.status(payload?.status);

  if (title === null || slug === null || content === null || !status) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const page = await db.pages.updatePage({
    id,
    title,
    slug,
    content,
    status,
  });

  if (!page) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  res.json(page);
};

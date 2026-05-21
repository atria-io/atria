import * as db from "@atria/db";
import { json } from "@atria/server/json.js";
import * as parse from "../parse.js";

export const createPage = async (req, res) => {
  const payload = await json(req);
  const id = parse.uuid(payload?.id);
  const title = parse.title(payload?.title);
  const slug = parse.slug(payload?.slug);
  const content = parse.content(payload?.content);

  if (!id || title === null || slug === null || content === null) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const page = await db.pages.createPage({
    id,
    title,
    slug,
    content,
  });

  if (!page) {
    res.statusCode = 409;
    res.end();
    return;
  }

  res.json(page, 201);
};

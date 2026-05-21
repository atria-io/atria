import * as db from "@atria/db";

export const listPages = async (_req, res) => {
  res.json({ items: await db.pages.listPages() });
};

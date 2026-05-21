import * as db from "@atria/db";

export const getPage = async (id, res) => {
  const page = await db.pages.getPageById(id);
  if (!page) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  res.json(page);
};

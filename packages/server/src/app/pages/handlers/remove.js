import * as db from "@atria/db";

export const removePage = async (id, res) => {
  const deleted = await db.pages.deletePage(id);
  if (!deleted) {
    res.json({ error: "Not Found" }, 404);
    return;
  }

  res.statusCode = 204;
  res.end();
};

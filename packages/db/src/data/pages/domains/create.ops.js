import { withDB } from "@/system/with.js";
import { getTimestamp } from "@/data/coerce.js";
import { sql } from "../dml.api.js";

export const createPage = async (input) => {
  return withDB((db) => {
    const now = getTimestamp();
    db
      .prepare(sql.create.insertPage)
      .run(
        input.id,
        "page",
        "draft",
        input.title,
        input.slug,
        input.content,
        now,
        null,
        now
      );

    return {
      id: input.id,
      type: "page",
      status: "draft",
      title: input.title,
      slug: input.slug,
      content: input.content,
      timestamps: {
        createdAt: now,
        publishedAt: null,
        updatedAt: now,
      },
    };
  });
};

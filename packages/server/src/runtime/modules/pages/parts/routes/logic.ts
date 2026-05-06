import { getPageByUuid } from "./db.js";
import type { PageRouteRecord } from "./types.js";

export const resolvePageRouteRecord = async (
  uuid: string
): Promise<PageRouteRecord | null> => {
  const page = await getPageByUuid(uuid, {
    locale: "default",
    versionId: null,
  });
  if (!page) {
    return null;
  }

  return {
    pageUuid: page.uuid,
    slug: page.routeSlug ?? "",
    parentUuid: page.routeParentUuid,
    published: page.routePublished === true,
  };
};

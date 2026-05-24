import { setStatusById } from "./pages.draft.js";

export { sync } from "./pages.resolve.js";
export {
  setTitle,
  setSlug,
  setContent,
  applySlugFromTitle,
  deleteById,
  setStatusById,
  startCreate,
} from "./pages.draft.js";
export {
  publish,
  unpublish,
  archive,
} from "./pages.publish.js";

export const archiveById = (uuid: string): Promise<boolean> =>
  setStatusById(uuid, "archived");

export const publishById = (uuid: string): Promise<boolean> =>
  setStatusById(uuid, "published");

export const unpublishById = (uuid: string): Promise<boolean> =>
  setStatusById(uuid, "draft");

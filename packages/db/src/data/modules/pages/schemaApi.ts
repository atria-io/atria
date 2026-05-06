import { pageSchema } from "./parts/editor/domains/create/schema.js";
import { pageUpdateSchema } from "./parts/editor/domains/update/schema.js";
import { pageDeleteSchema } from "./parts/editor/domains/delete/schema.js";
import { pagePublishSchema } from "./parts/editor/domains/publish/schema.js";
import { pageUnpublishSchema } from "./parts/editor/domains/unpublish/schema.js";
import { listSchema } from "./parts/catalog/domains/list/schema.js";
import { versionSchema } from "./parts/editor/domains/version/schema.js";
import { folderSchema } from "./parts/folders/domains/get/schema.js";
import { folderUpdateSchema } from "./parts/folders/domains/update/schema.js";
import { routeSchema } from "./parts/routes/domains/get/schema.js";
import { routePublishSchema } from "./parts/routes/domains/publish/schema.js";
import { routeUpsertSchema } from "./parts/routes/domains/upsert/schema.js";

export const PAGES_SCHEMA = [
  ...pageSchema,
  ...pageUpdateSchema,
  ...pageDeleteSchema,
  ...pagePublishSchema,
  ...pageUnpublishSchema,
  ...versionSchema,
  ...routeSchema,
  ...routePublishSchema,
  ...routeUpsertSchema,
  ...listSchema,
  ...folderSchema,
  ...folderUpdateSchema,
] as const;

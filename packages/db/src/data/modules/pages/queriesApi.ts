import { catalogQueries } from "./parts/catalog/domains/list/queries.js";
import { readQueries } from "./parts/editor/domains/read/queries.js";
import { pageQueries } from "./parts/editor/domains/create/queries.js";
import { pageUpdateQueries } from "./parts/editor/domains/update/queries.js";
import { pageDeleteQueries } from "./parts/editor/domains/delete/queries.js";
import { pagePublishQueries } from "./parts/editor/domains/publish/queries.js";
import { pageUnpublishQueries } from "./parts/editor/domains/unpublish/queries.js";
import { versionQueries } from "./parts/editor/domains/version/queries.js";
import { folderQueries } from "./parts/folders/domains/get/queries.js";
import { folderUpdateQueries } from "./parts/folders/domains/update/queries.js";
import { routeQueries } from "./parts/routes/domains/get/queries.js";
import { routePublishQueries } from "./parts/routes/domains/publish/queries.js";
import { routeUpsertQueries } from "./parts/routes/domains/upsert/queries.js";

export const sql = {
  catalog: catalogQueries,
  read: readQueries,
  page: {
    ...pageQueries,
    ...pageUpdateQueries,
    ...pageDeleteQueries,
    ...pagePublishQueries,
    ...pageUnpublishQueries,
  },
  route: {
    ...routeQueries,
    ...routePublishQueries,
    ...routeUpsertQueries,
  },
  version: versionQueries,
  folder: {
    ...folderQueries,
    ...folderUpdateQueries,
  },
} as const;

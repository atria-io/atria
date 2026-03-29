import { runStyleBundle } from "./scripts/css.bundle.mjs";
import { runAdminBuild } from "./scripts/admin.mjs";

await runAdminBuild(import.meta.url);
await runStyleBundle(import.meta.url);

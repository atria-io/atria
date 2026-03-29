import { runStyleBundle } from "./scripts/css.bundle.mjs";
import { runAdminBuild } from "./scripts/admin.mjs";

await runStyleBundle(import.meta.url);
await runAdminBuild(import.meta.url);

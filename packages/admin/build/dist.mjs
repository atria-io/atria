import { runStyleBundle } from "./scripts/bundle.styles.mjs";
import { runSchemeBundle } from "./scripts/bundle.scheme.mjs";
import { runAdminBuild } from "./scripts/admin.mjs";

await runSchemeBundle(import.meta.url);
await runAdminBuild(import.meta.url);
await runStyleBundle(import.meta.url);

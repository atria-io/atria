import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStyleBundle } from "./scripts/bundle.styles.mjs";
import { runSchemeBundle } from "./scripts/bundle.scheme.mjs";
import { runAdminBuild } from "./scripts/admin.mjs";
import { transformRuntime } from "./scripts/transform.runtime.mjs";
import { renameAssets } from "./scripts/rename.assets.mjs";

const resolvePackageRoot = (entryUrl) => {
  const buildDir = path.dirname(fileURLToPath(entryUrl));
  return path.resolve(buildDir, "..");
};

await runSchemeBundle(import.meta.url);
await runAdminBuild(import.meta.url);
await transformRuntime(resolvePackageRoot(import.meta.url));
await renameAssets(import.meta.url);
await runStyleBundle(import.meta.url);

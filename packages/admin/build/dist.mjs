import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAdminBuild } from "./scripts/admin/build.admin.mjs";
import { runStyleBundle } from "./scripts/admin/build.styles.mjs";
import { runSchemeBundle } from "./scripts/admin/build.scheme.mjs";
import { hashAssets } from "./scripts/runtime/hash.assets.mjs";

const resolvePackageRoot = (entryUrl) => {
  const buildDir = path.dirname(fileURLToPath(entryUrl));
  return path.resolve(buildDir, "..");
};

const packageRoot = resolvePackageRoot(import.meta.url);

await runAdminBuild(packageRoot);
await runSchemeBundle(packageRoot);
await runStyleBundle(packageRoot);
await hashAssets(packageRoot);

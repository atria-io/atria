import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStyleBundle } from "./scripts/bundle.styles.mjs";
import { runAdminBuild } from "./scripts/admin.mjs";
import { runSchemeBundle } from "./scripts/bundle.scheme.mjs";
import { transformRuntime } from "./scripts/runtime.load.mjs";
import { convertRuntimeAssets } from "./scripts/convert.assets.mjs";
import { convertRuntimeIndex } from "./scripts/convert.index.mjs";

const resolvePackageRoot = (entryUrl) => {
  const buildDir = path.dirname(fileURLToPath(entryUrl));
  return path.resolve(buildDir, "..");
};

await runAdminBuild(import.meta.url);
await runSchemeBundle(import.meta.url);
await runStyleBundle(import.meta.url);
await transformRuntime(resolvePackageRoot(import.meta.url));
await convertRuntimeAssets(resolvePackageRoot(import.meta.url));
await convertRuntimeIndex(resolvePackageRoot(import.meta.url));

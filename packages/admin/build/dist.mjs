import path from "node:path";
import { syncDirectory, syncFile } from "./scripts/file.system.mjs";
import { syncStaticStyles } from "./scripts/styles.static.mjs";
import { syncScopedStyles } from "./scripts/styles.module.mjs";
import { composeRuntimeGlobalsStyles } from "./scripts/styles.globals.mjs";

const packageRoot = process.cwd();
const staticStylesSourceRoot = path.join(packageRoot, "src", "app", "static", "styles");
const staticStylesDistRoot = path.join(packageRoot, "dist", "styles");
const modulesRoot = path.join(packageRoot, "src", "app", "modules");
const modulesStylesDistRoot = path.join(packageRoot, "dist", "styles", "modules");
const layoutStyleSourceRoot = path.join(packageRoot, "src", "app", "kernel", "layout", "style");
const globalsStyleSourceFile = path.join(staticStylesSourceRoot, "globals.css");
const criticalStyleSourceFile = path.join(modulesRoot, "critical", "styles", "critical.css");
const globalsStyleDistFile = path.join(staticStylesDistRoot, "globals.css");

await syncStaticStyles(staticStylesSourceRoot, staticStylesDistRoot);
await syncDirectory(path.join(packageRoot, "src", "i18n", "locales"), path.join(packageRoot, "dist", "locales"));
await syncFile(path.join(packageRoot, "src", "app", "static", "favicon.ico"), path.join(packageRoot, "dist", "favicon.ico"));
await syncFile(path.join(packageRoot, "src", "app", "static", "favicon.svg"), path.join(packageRoot, "dist", "favicon.svg"));
await syncScopedStyles(modulesRoot, modulesStylesDistRoot);
await composeRuntimeGlobalsStyles({
  globalsStyleSourceFile,
  layoutStyleSourceRoot,
  criticalStyleSourceFile,
  globalsStyleDistFile
});

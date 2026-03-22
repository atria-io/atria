import path from "node:path";
import { rollup } from "rollup";
import { syncDirectory, syncFile } from "./scripts/file.system.mjs";
import appRollupConfig from "./scripts/rollup.config.mjs";
import { syncStaticStyles } from "./scripts/styles.static.mjs";
import { syncScopedStyles } from "./scripts/styles.module.mjs";
import { composeRuntimeGlobalsStyles } from "./scripts/styles.globals.mjs";
import { syncI18nLocales } from "./scripts/i18n.locales.mjs";

const packageRoot = process.cwd();
const staticStylesSourceRoot = path.join(packageRoot, "src", "app", "static", "styles");
const staticStylesDistRoot = path.join(packageRoot, "dist", "styles");
const modulesRoot = path.join(packageRoot, "src", "app", "modules");
const modulesStylesDistRoot = path.join(packageRoot, "dist", "styles", "modules");
const layoutStyleSourceRoot = path.join(packageRoot, "src", "app", "kernel", "layout", "style");
const globalsStyleSourceFile = path.join(staticStylesSourceRoot, "globals.css");
const criticalStyleSourceFile = path.join(modulesRoot, "critical", "styles", "critical.css");
const globalsStyleDistFile = path.join(staticStylesDistRoot, "globals.css");

const { output: appOutputOptions, ...appInputOptions } = appRollupConfig;
const appBundle = await rollup(appInputOptions);
await appBundle.write(appOutputOptions);
await appBundle.close();

await syncStaticStyles(staticStylesSourceRoot, staticStylesDistRoot);
await syncDirectory(path.join(packageRoot, "src", "app", "static", "fonts"), path.join(packageRoot, "dist", "fonts"));
await syncI18nLocales(packageRoot);
await syncFile(path.join(packageRoot, "src", "app", "static", "favicon.ico"), path.join(packageRoot, "dist", "favicon.ico"));
await syncFile(path.join(packageRoot, "src", "app", "static", "favicon.svg"), path.join(packageRoot, "dist", "favicon.svg"));
await syncScopedStyles(modulesRoot, modulesStylesDistRoot);
await composeRuntimeGlobalsStyles({
  globalsStyleSourceFile,
  layoutStyleSourceRoot,
  criticalStyleSourceFile,
  globalsStyleDistFile
});

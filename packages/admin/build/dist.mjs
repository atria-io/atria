import path from "node:path";
import { rollup } from "rollup";
import { syncDirectory, syncFile } from "./scripts/file.system.mjs";
import appRollupConfig from "./scripts/rollup.config.mjs";
import { syncStaticStyles } from "./scripts/styles.static.mjs";
import { syncScopedStyles } from "./scripts/styles.module.mjs";
import { composeRuntimeGlobalsStyles } from "./scripts/styles.globals.mjs";
import { syncI18nLocales } from "./scripts/i18n.locales.mjs";

const packageRoot = process.cwd();
const appRoot = path.join(packageRoot, "src", "app");
const shellRoot = path.join(appRoot, "shell");
const staticRoot = path.join(appRoot, "static");
const modulesRoot = path.join(shellRoot, "modules");

const staticStylesSourceRoot = path.join(staticRoot, "styles");
const staticStylesDistRoot = path.join(packageRoot, "dist", "styles");
const modulesStylesDistRoot = path.join(staticStylesDistRoot, "modules");
const globalsStyleSourceFile = path.join(staticStylesSourceRoot, "globals.css");
const globalsStyleDistFile = path.join(staticStylesDistRoot, "globals.css");

const { output: appOutputOptions, ...appInputOptions } = appRollupConfig;
const appBundle = await rollup(appInputOptions);
await appBundle.write(appOutputOptions);
await appBundle.close();

await syncStaticStyles(staticStylesSourceRoot, staticStylesDistRoot);
await syncDirectory(
  path.join(staticRoot, "fonts"),
  path.join(packageRoot, "dist", "fonts")
);
await syncI18nLocales(packageRoot);
await syncFile(
  path.join(staticRoot, "favicon.ico"),
  path.join(packageRoot, "dist", "favicon.ico")
);
await syncFile(
  path.join(staticRoot, "favicon.svg"),
  path.join(packageRoot, "dist", "favicon.svg")
);
await syncScopedStyles(modulesRoot, modulesStylesDistRoot);
await composeRuntimeGlobalsStyles({
  globalsStyleSourceFile,
  globalsStyleDistFile,
  shellRoot,
});

import { validateRuntimeFonts } from "./scripts/runtime.fonts.mjs";

const packageRoot = process.cwd();
await validateRuntimeFonts(packageRoot);
await import("./scripts/runtime.index.mjs");

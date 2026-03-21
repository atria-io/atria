import path from "node:path";
import { promises as fs } from "node:fs";
import { injectRuntimeSchemeMap } from "./runtime.scheme.mjs";

const packageRoot = process.cwd();
const sourceFile = path.join(packageRoot, "src", "runtime", "index.htm");
const targetFile = path.join(packageRoot, "dist", "runtime", "index.htm");

const runtimeTemplate = await fs.readFile(sourceFile, "utf-8");
const runtimeHtml = await injectRuntimeSchemeMap(packageRoot, runtimeTemplate);

await fs.mkdir(path.dirname(targetFile), { recursive: true });
await fs.writeFile(targetFile, runtimeHtml, "utf-8");

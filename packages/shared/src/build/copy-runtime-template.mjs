import path from "node:path";
import { promises as fs } from "node:fs";

const packageRoot = process.cwd();
const sourceFile = path.join(packageRoot, "src", "runtime", "index.htm");
const targetFile = path.join(packageRoot, "dist", "runtime", "index.htm");

await fs.mkdir(path.dirname(targetFile), { recursive: true });
await fs.copyFile(sourceFile, targetFile);

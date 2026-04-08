import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeSourceDir = path.join(packageRoot, "..", "admin", "boot");
const runtimeTargetDir = path.join(packageRoot, "dist", "runtime");

if (!existsSync(runtimeSourceDir)) {
  throw new Error(`Admin runtime source not found: ${runtimeSourceDir}`);
}

await fs.rm(runtimeTargetDir, { recursive: true, force: true });
await fs.mkdir(path.dirname(runtimeTargetDir), { recursive: true });
await fs.cp(runtimeSourceDir, runtimeTargetDir, { recursive: true });
await fs.rm(path.join(runtimeTargetDir, "static"), { recursive: true, force: true });

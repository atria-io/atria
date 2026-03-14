import path from "node:path";
import { promises as fs } from "node:fs";

const packageRoot = process.cwd();

const assetMappings = [
  {
    sourceDir: path.join(packageRoot, "src", "styles"),
    targetDir: path.join(packageRoot, "dist", "styles")
  },
  {
    sourceDir: path.join(packageRoot, "src", "i18n", "locales"),
    targetDir: path.join(packageRoot, "dist", "locales")
  }
];

const syncDirectory = async (sourceDir, targetDir) => {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
};

for (const mapping of assetMappings) {
  await syncDirectory(mapping.sourceDir, mapping.targetDir);
}

import path from "node:path";
import { fileURLToPath } from "node:url";

export const resolvePackageRootFromScript = (entryUrl) => {
  const scriptDir = path.dirname(fileURLToPath(entryUrl));
  return path.resolve(scriptDir, "..", "..", "..");
};

import path from "node:path";
import { ATRIA_RUNTIME_DIR, runtimeAppJs, runtimeIndexHtml } from "@atria/shared";
import { type WriteStatus, writeFile } from "../utils/fs.js";

interface RuntimeBootstrapWriteResult {
  indexStatus: WriteStatus;
  appStatus: WriteStatus;
}

export const writeRuntimeBootstrapFiles = async (
  projectRoot: string,
  force = false
): Promise<RuntimeBootstrapWriteResult> => {
  const runtimeIndexPath = path.join(projectRoot, ATRIA_RUNTIME_DIR, "index.html");
  const runtimeAppPath = path.join(projectRoot, ATRIA_RUNTIME_DIR, "app.js");

  const [indexStatus, appStatus] = await Promise.all([
    writeFile(runtimeIndexPath, runtimeIndexHtml, force),
    writeFile(runtimeAppPath, runtimeAppJs, force)
  ]);

  return {
    indexStatus,
    appStatus
  };
};

import path from "node:path";
import {
  ATRIA_RUNTIME_DIR,
  runtimeAppJs,
  runtimeIndexHtml,
  type WriteStatus,
  writeFile
} from "@atria/shared";

interface RuntimeBootstrapWriteResult {
  indexStatus: WriteStatus;
  appStatus: WriteStatus;
}

/**
 * Rewrites runtime bootstrap files used by `atria dev`.
 *
 * @param {string} projectRoot
 * @param {boolean} [force=false]
 * @returns {Promise<RuntimeBootstrapWriteResult>}
 */
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

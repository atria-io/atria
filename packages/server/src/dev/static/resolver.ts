import { promises as fs } from "node:fs";
import path from "node:path";
import type { ResolveRequestMode, ResolveRequestResult } from "../types.js";
import { isInsideDirectory } from "./paths.js";

const resolveRootIndexFile = async (rootDir: string): Promise<ResolveRequestResult> => {
  const rootIndexPath = path.join(rootDir, "index.html");
  try {
    const rootIndexStats = await fs.stat(rootIndexPath);
    if (rootIndexStats.isFile()) {
      return { type: "file", filePath: rootIndexPath };
    }
  } catch {
    // fall through to not found
  }

  return { type: "not-found" };
};

/**
 * Resolves a request path to a safe file path inside a root directory.
 *
 * @param {string} rootDir
 * @param {string} requestPath
 * @param {ResolveRequestMode} mode
 * @returns {Promise<ResolveRequestResult>}
 */
export const resolveRequestFile = async (
  rootDir: string,
  requestPath: string,
  mode: ResolveRequestMode
): Promise<ResolveRequestResult> => {
  const normalizedPath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = path.join(rootDir, normalizedPath);

  if (!isInsideDirectory(rootDir, filePath)) {
    return { type: "forbidden" };
  }

  try {
    const fileStats = await fs.stat(filePath);
    if (fileStats.isDirectory()) {
      const directoryIndexPath = path.join(filePath, "index.html");
      if (!isInsideDirectory(rootDir, directoryIndexPath)) {
        return { type: "forbidden" };
      }

      try {
        const directoryIndexStats = await fs.stat(directoryIndexPath);
        if (directoryIndexStats.isFile()) {
          return { type: "file", filePath: directoryIndexPath };
        }
      } catch {
        // fall through to not found/fallback response
      }

      return mode === "spa-fallback" ? resolveRootIndexFile(rootDir) : { type: "not-found" };
    }

    if (fileStats.isFile()) {
      return { type: "file", filePath };
    }

    return { type: "not-found" };
  } catch {
    if (mode === "spa-fallback" && !path.extname(normalizedPath)) {
      return resolveRootIndexFile(rootDir);
    }

    return { type: "not-found" };
  }
};

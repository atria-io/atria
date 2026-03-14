import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
import { pipeline } from "node:stream/promises";
import { MIME_TYPES } from "../constants.js";

export const sendFileResponse = async (response: ServerResponse, filePath: string): Promise<void> => {
  const fileStats = await fs.stat(filePath);
  const extension = path.extname(filePath);
  const contentType = MIME_TYPES[extension] ?? "application/octet-stream";

  response.writeHead(200, {
    "content-type": contentType,
    "content-length": String(fileStats.size)
  });

  try {
    await pipeline(createReadStream(filePath), response);
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : null;

    if (errorCode === "ERR_STREAM_PREMATURE_CLOSE" || errorCode === "ECONNRESET") {
      return;
    }

    throw error;
  }
};

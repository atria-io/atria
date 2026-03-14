import { promises as fs } from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
import { MIME_TYPES } from "../constants.js";

export const sendFileResponse = async (response: ServerResponse, filePath: string): Promise<void> => {
  const fileBuffer = await fs.readFile(filePath);
  const extension = path.extname(filePath);
  const contentType = MIME_TYPES[extension] ?? "application/octet-stream";

  response.writeHead(200, { "content-type": contentType });
  response.end(fileBuffer);
};

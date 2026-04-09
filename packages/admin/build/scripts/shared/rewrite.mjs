import { readFile, writeFile } from "node:fs/promises";

export const createReplacementEntries = (mapping) => {
  const entries = [];

  for (const [from, to] of mapping.entries()) {
    entries.push([from, to]);

    if (from.startsWith("/")) {
      entries.push([from.slice(1), to]);
    }
  }

  entries.sort((a, b) => b[0].length - a[0].length);
  return entries;
};

export const rewriteWithMapping = (content, mappingEntries) => {
  let next = content;

  for (const [from, to] of mappingEntries) {
    if (!next.includes(from)) {
      continue;
    }

    next = next.split(from).join(to);
  }

  return next;
};

export const rewriteFileWithMapping = async (targetFile, mappingEntries) => {
  const source = await readFile(targetFile, "utf-8");
  const next = rewriteWithMapping(source, mappingEntries);

  if (source !== next) {
    await writeFile(targetFile, next, "utf-8");
  }
};

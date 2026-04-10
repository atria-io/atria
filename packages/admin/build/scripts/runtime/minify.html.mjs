import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { exists } from "../shared/fs.mjs";
import { minifyCss } from "../shared/minifycss.mjs";

const SCRIPT_STYLE_BLOCK_PATTERN = /<(script|style)\b[\s\S]*?<\/\1>/gi;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const INLINE_STYLE_PATTERN = /<style([^>]*)>([\s\S]*?)<\/style>/gi;

const protectBlocks = (source) => {
  const blocks = [];
  const protectedSource = source.replace(SCRIPT_STYLE_BLOCK_PATTERN, (match) => {
    const token = `__HTML_BLOCK_${blocks.length}__`;
    blocks.push(match);
    return token;
  });

  return { protectedSource, blocks };
};

const restoreBlocks = (source, blocks) =>
  blocks.reduce((current, block, index) => current.replace(`__HTML_BLOCK_${index}__`, block), source);

const minifyHtml = (source) => {
  const withMinifiedInlineStyles = source.replace(INLINE_STYLE_PATTERN, (_match, attributes, css) => {
    const minifiedCss = minifyCss(css.trim());
    return `<style${attributes}>${minifiedCss}</style>`;
  });

  const { protectedSource, blocks } = protectBlocks(withMinifiedInlineStyles);
  const minified = protectedSource
    .replace(HTML_COMMENT_PATTERN, "")
    .replace(/>\s+</g, "><")
    .replace(/\s*(__HTML_BLOCK_\d+__)\s*/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  return restoreBlocks(minified, blocks);
};

export const minifyRuntimeHtml = async (packageRoot) => {
  const indexFile = path.join(packageRoot, "dist", "frontend", "index.htm");
  if (!(await exists(indexFile))) {
    throw new Error(`Missing runtime HTML: ${indexFile}`);
  }

  const source = await readFile(indexFile, "utf-8");
  await writeFile(indexFile, `${minifyHtml(source)}\n`, "utf-8");
};

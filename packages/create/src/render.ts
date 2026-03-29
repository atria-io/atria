import path from "node:path";
import { isInteractivePrompt } from "@atria/shared";

export interface ReplacePromptOptions {
  linesUp?: number;
  clearDown?: boolean;
}

export const replacePreviousPromptLine = (
  line: string,
  options: ReplacePromptOptions = {}
): void => {
  if (!isInteractivePrompt()) {
    return;
  }

  const linesUp = options.linesUp ?? 1;
  if (linesUp > 0) {
    process.stdout.write(`\u001b[${linesUp}A`);
  }

  process.stdout.write("\r");
  if (options.clearDown) {
    process.stdout.write("\u001b[J");
  } else {
    process.stdout.write("\u001b[2K");
  }
  process.stdout.write(`${line}\n`);
};

export const formatScaffoldedAt = (baseDir: string, targetDir: string): string => {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetDir);
  const baseName = path.basename(resolvedBase) || resolvedBase;
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (!relative || relative === ".") {
    return `(${baseName})`;
  }

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return `(${resolvedTarget})`;
  }

  const combined = path.join(baseName, relative).split(path.sep).join("/");
  return `(${combined})`;
};

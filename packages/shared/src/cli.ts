/**
 * Parsed command-line input split into flags and positional arguments.
 */
export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/**
 * Parses argv into positionals and long or short flags.
 *
 * @param {string[]} argv
 * @param {Record<string, string>} [aliases={}]
 * @returns {ParsedArgs}
 */
export const parseArgs = (argv: string[], aliases: Record<string, string> = {}): ParsedArgs => {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("-")) {
      positionals.push(token);
      continue;
    }

    if (token === "-h" || token === "--help") {
      flags.help = true;
      continue;
    }

    const shortKey = token.startsWith("-") && !token.startsWith("--") ? aliases[token] : null;
    const keyValue = shortKey ? [shortKey] : token.startsWith("--") ? token.slice(2).split("=", 2) : null;
    if (!keyValue) {
      continue;
    }

    const [key, inlineValue] = keyValue;
    const nextToken = argv[index + 1];

    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }

    if (nextToken && !nextToken.startsWith("-")) {
      flags[key] = nextToken;
      index += 1;
      continue;
    }

    flags[key] = true;
  }

  return { positionals, flags };
};

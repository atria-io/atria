export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

export const parseArgs = (argv: string[]): ParsedArgs => {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("-")) {
      positionals.push(token);
      continue;
    }

    if (token.startsWith("--")) {
      const [rawKey, rawValue] = token.slice(2).split("=", 2);
      const nextToken = argv[index + 1];

      if (rawValue !== undefined) {
        flags[rawKey] = rawValue;
        continue;
      }

      if (nextToken && !nextToken.startsWith("-")) {
        flags[rawKey] = nextToken;
        index += 1;
        continue;
      }

      flags[rawKey] = true;
      continue;
    }

    if (token === "-h") {
      flags.help = true;
      continue;
    }

    if (token === "-p") {
      const nextToken = argv[index + 1];
      if (nextToken && !nextToken.startsWith("-")) {
        flags.port = nextToken;
        index += 1;
        continue;
      }
      flags.port = true;
      continue;
    }
  }

  return { positionals, flags };
};


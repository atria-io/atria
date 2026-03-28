export type CliFlagValue = string | boolean;

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, CliFlagValue>;
}

export type CliCommand = (args: string[]) => Promise<void>;

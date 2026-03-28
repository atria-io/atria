import { runBuildCommand } from "./commands/build/build.command.js";
import { runDevCommand } from "./commands/dev/dev.command.js";
import { runSetupCommand } from "./commands/setup/setup.command.js";
import type { CliCommand } from "./types.js";

const commands: Record<string, CliCommand> = {
  dev: runDevCommand,
  setup: runSetupCommand,
  build: runBuildCommand
};

const printHelp = (): void => {
  console.log("atria CLI");
  console.log("");
  console.log("Commands:");
  console.log("  atria dev [project-directory] [--admin-port 3333] [--public-port 4444]");
  console.log(
    "  atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--force]"
  );
  console.log("  atria build [project-directory] [--mode production|development]");
};

export const runCli = async (argv: string[]): Promise<void> => {
  const command = argv[2];
  if (!command || command === "-h" || command === "--help") {
    printHelp();
    return;
  }

  const runCommand = commands[command];
  if (!runCommand) {
    throw new Error(`Unknown command "${command}". Run "atria --help" for usage.`);
  }

  await runCommand(argv.slice(3));
};

import { runDevCommand } from "./commands/dev.js";
import { runInitCommand } from "./commands/init.js";
import { runSetupCommand } from "./commands/setup.js";

const commands: Record<string, (args: string[]) => Promise<void>> = {
  init: runInitCommand,
  dev: runDevCommand,
  setup: runSetupCommand
};

const printHelp = (): void => {
  console.log("atria CLI");
  console.log("");
  console.log("Commands:");
  console.log("  atria init [project-directory] [--force]");
  console.log("  atria dev [project-directory] [--port 3333]");
  console.log("  atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--auth-method google|github|email] [--force]");
};

/**
 * Runs the `atria` CLI entrypoint.
 *
 * @param {string[]} argv
 * @returns {Promise<void>}
 */
export const runCli = async (argv: string[]): Promise<void> => {
  const command = argv[2];
  if (!command || command === "-h" || command === "--help") {
    printHelp();
    return;
  }

  const runCommand = commands[command];
  if (runCommand) {
    await runCommand(argv.slice(3));
    return;
  }

  throw new Error(`Unknown command "${command}". Run "atria --help" for usage.`);
};

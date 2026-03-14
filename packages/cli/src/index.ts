import { runDevCommand } from "./commands/dev.js";
import { runInitCommand } from "./commands/init.js";
import { runSetupCommand } from "./commands/setup.js";

const printHelp = (): void => {
  console.log("atria CLI");
  console.log("");
  console.log("Commands:");
  console.log("  atria init [project-directory] [--force]");
  console.log("  atria dev [project-directory] [--port 3333]");
  console.log("  atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--auth-method google|github|email] [--force]");
};

export const runCli = async (argv: string[]): Promise<void> => {
  const command = argv[2];
  const args = argv.slice(3);

  if (!command || command === "-h" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "init") {
    await runInitCommand(args);
    return;
  }

  if (command === "dev") {
    await runDevCommand(args);
    return;
  }

  if (command === "setup") {
    await runSetupCommand(args);
    return;
  }

  throw new Error(`Unknown command "${command}". Run "atria --help" for usage.`);
};

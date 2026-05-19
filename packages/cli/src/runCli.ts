import type { CliCommand } from "./types.js";

const commandLoaders: Record<string, () => Promise<CliCommand>> = {
  dev: async () => (await import("./commands/dev/dev.command.js")).runDevCommand,
  setup: async () => (await import("./commands/setup/setup.command.js")).runSetupCommand,
  build: async () => (await import("./commands/build/build.command.js")).runBuildCommand
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

  const commandLoader = commandLoaders[command];
  if (!commandLoader) {
    throw new Error(`Unknown command "${command}". Run "atria --help" for usage.`);
  }

  const runCommand = await commandLoader();
  await runCommand(argv.slice(3));
};

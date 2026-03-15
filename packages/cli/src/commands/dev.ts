import path from "node:path";
import { promises as fs } from "node:fs";
import { startDevServer } from "@atria/server";
import { ATRIA_RUNTIME_DIR, DEFAULT_DEV_PORT } from "@atria/shared";
import { parseArgs } from "../utils/args.js";
import { writeRuntimeBootstrapFiles } from "../runtime/bootstrap.js";
import { terminal } from "../utils/terminal.js";
import { checkForCliUpdate, getCliUpdateInstallCommand } from "../utils/update-check.js";

const printDevHelp = (): void => {
  console.log("Usage: atria dev [project-directory] [--port 3333]");
};

const parsePort = (value: string | boolean | undefined): number => {
  if (value === undefined || value === true) {
    return DEFAULT_DEV_PORT;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid --port value: ${value}`);
  }

  return parsed;
};

const notifyCliUpdate = async (projectRoot: string): Promise<void> => {
  const updateInfo = await checkForCliUpdate();
  if (!updateInfo) {
    return;
  }

  const installCommand = await getCliUpdateInstallCommand(projectRoot);
  console.log(
    `[atria] ${terminal.yellow("Update available")}: @atria/cli ${updateInfo.currentVersion} -> ${updateInfo.latestVersion}`
  );
  console.log(`[atria] ${terminal.dim("Run")} ${terminal.cyan(installCommand)}`);
};

export const runDevCommand = async (args: string[]): Promise<void> => {
  const startTime = Date.now();
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printDevHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const port = parsePort(parsedArgs.flags.port);
  const runtimeDir = path.join(projectRoot, ATRIA_RUNTIME_DIR);

  console.log(`${terminal.green("✔")} Checking configuration files...`);

  try {
    await fs.access(runtimeDir);
  } catch {
    throw new Error(
      `Runtime not found at ${runtimeDir}. Run "atria init ${targetArgument}" first.`
    );
  }

  await writeRuntimeBootstrapFiles(projectRoot, true);

  console.log(`${terminal.green("✔")} Starting dev server`);

  const server = await startDevServer({
    projectRoot,
    port
  });

  const elapsedMs = Date.now() - startTime;
  console.log(
    `Atria is ready in ${elapsedMs}ms and running at ${terminal.cyan(`${server.publicUrl}/`)}`
  );
  console.log(
    `Admin panel is available at ${terminal.cyan(`${server.adminUrl}/`)}`
  );
  console.log("");
  void notifyCliUpdate(projectRoot);

  const shutdown = async (): Promise<void> => {
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
};

import path from "node:path";
import { promises as fs } from "node:fs";
import { startDevServer } from "@atria/server";
import {
  ATRIA_RUNTIME_DIR,
  DEFAULT_DEV_PORT,
  DEFAULT_PUBLIC_PORT,
  parseArgs
} from "@atria/shared";
import { writeRuntimeBootstrapFiles } from "../runtime/bootstrap.js";
import { terminal } from "../utils/terminal.js";
import { checkForCliUpdate, getCliUpdateInstallCommand } from "../utils/update-check.js";

const printDevHelp = (): void => {
  console.log(
    "Usage: atria dev [project-directory] [--admin-port 3333] [--public-port 4444]"
  );
};

const parsePort = (
  value: string | boolean | undefined,
  fallback: number,
  flagName: string
): number => {
  if (value === undefined || value === true) {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${flagName} value: ${value}`);
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

/**
 * Starts the local dev server for an atria project.
 *
 * @param {string[]} args
 * @returns {Promise<void>}
 */
export const runDevCommand = async (args: string[]): Promise<void> => {
  const startTime = Date.now();
  const parsedArgs = parseArgs(args, { "-p": "admin-port" });
  if (parsedArgs.flags.help) {
    printDevHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const adminPort = parsePort(
    parsedArgs.flags["admin-port"] ?? parsedArgs.flags.port,
    DEFAULT_DEV_PORT,
    "admin-port"
  );
  const publicPort = parsePort(parsedArgs.flags["public-port"], DEFAULT_PUBLIC_PORT, "public-port");
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
    adminPort,
    publicPort
  });

  const elapsedMs = Date.now() - startTime;
  console.log("");
  console.log(`Atria is ready in ${elapsedMs}ms.`);
  console.log(`Frontend is available at ${terminal.cyan(`${server.publicUrl}/`)}`);
  console.log(`Atria Studio is available at ${terminal.cyan(`${server.adminUrl}/`)}`);
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

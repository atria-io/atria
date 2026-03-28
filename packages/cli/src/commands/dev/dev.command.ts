import path from "node:path";
import { parseArgs } from "../../parseArgs.js";

const DEFAULT_ADMIN_PORT = 3333;
const DEFAULT_PUBLIC_PORT = 4444;

const printDevHelp = (): void => {
  console.log("Usage: atria dev [project-directory] [--admin-port 3333] [--public-port 4444]");
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
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${flagName} value: ${value}`);
  }

  return parsed;
};

export const runDevCommand = async (args: string[]): Promise<void> => {
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printDevHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const adminPort = parsePort(parsedArgs.flags["admin-port"], DEFAULT_ADMIN_PORT, "admin-port");
  const publicPort = parsePort(parsedArgs.flags["public-port"], DEFAULT_PUBLIC_PORT, "public-port");

  console.log(`[atria] dev orchestration`);
  console.log(`[atria] project: ${projectRoot}`);
  console.log(`[atria] admin port: ${adminPort}`);
  console.log(`[atria] public port: ${publicPort}`);
  console.log("[atria] Dev orchestration hook is ready for server/admin integration.");
};

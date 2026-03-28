import path from "node:path";
import { parseArgs } from "../../parseArgs.js";

const printBuildHelp = (): void => {
  console.log("Usage: atria build [project-directory] [--mode production|development]");
};

const parseBuildMode = (value: string | boolean | undefined): "production" | "development" => {
  if (value === undefined || value === true) {
    return "production";
  }

  if (value === "production" || value === "development") {
    return value;
  }

  throw new Error(`Invalid --mode value: ${value}`);
};

export const runBuildCommand = async (args: string[]): Promise<void> => {
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printBuildHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const mode = parseBuildMode(parsedArgs.flags.mode);

  console.log(`[atria] build orchestration`);
  console.log(`[atria] project: ${projectRoot}`);
  console.log(`[atria] mode: ${mode}`);
  console.log("[atria] Build orchestration hook is ready for core/server integration.");
};

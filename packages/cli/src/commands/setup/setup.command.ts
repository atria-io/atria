import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { parseArgs } from "../../parseArgs.js";

type DatabaseMode = "sqlite" | "postgres";

const SQLITE_DATABASE_URL = "file:./.atria/data/atria.db";

const printSetupHelp = (): void => {
  console.log(
    "Usage: atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--force]"
  );
};

const parseDatabaseMode = (value: string): DatabaseMode | null => {
  if (value === "sqlite" || value === "postgres") {
    return value;
  }

  return null;
};

const isInteractive = (): boolean => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const promptDatabaseMode = async (): Promise<DatabaseMode> => {
  if (!isInteractive()) {
    return "sqlite";
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await rl.question("Database [1=SQLite, 2=PostgreSQL] (1): ");
    const normalized = answer.trim();

    if (normalized === "2") {
      return "postgres";
    }

    return "sqlite";
  } finally {
    rl.close();
  }
};

const promptPostgresUrl = async (): Promise<string> => {
  if (!isInteractive()) {
    throw new Error("Missing --database-url for postgres in non-interactive mode.");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await rl.question("PostgreSQL URL: ");
    const trimmed = answer.trim();
    if (!trimmed) {
      throw new Error("PostgreSQL URL cannot be empty.");
    }
    return trimmed;
  } finally {
    rl.close();
  }
};

const updateEnvFile = async (
  envPath: string,
  updates: Record<string, string>,
  force: boolean
): Promise<void> => {
  const content = await fs.readFile(envPath, "utf-8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return "";
    }

    throw error;
  });

  const lines = content ? content.split(/\r?\n/g) : [];
  const nextLines: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const separator = line.indexOf("=");
    if (separator <= 0) {
      nextLines.push(line);
      continue;
    }

    const key = line.slice(0, separator).trim();
    if (!(key in updates)) {
      nextLines.push(line);
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    if (!force) {
      nextLines.push(line);
      continue;
    }

    nextLines.push(`${key}=${updates[key]}`);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  const output = `${nextLines.join("\n").trim()}\n`;
  await fs.mkdir(path.dirname(envPath), { recursive: true });
  await fs.writeFile(envPath, output, "utf-8");
};

export const runSetupCommand = async (args: string[]): Promise<void> => {
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printSetupHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const requestedMode =
    typeof parsedArgs.flags.database === "string"
      ? parseDatabaseMode(parsedArgs.flags.database)
      : null;

  if (typeof parsedArgs.flags.database === "string" && !requestedMode) {
    throw new Error(`Invalid --database value: ${parsedArgs.flags.database}`);
  }

  const databaseMode = requestedMode ?? (await promptDatabaseMode());
  const postgresUrlFromFlags =
    typeof parsedArgs.flags["database-url"] === "string"
      ? parsedArgs.flags["database-url"].trim()
      : "";

  const databaseUrl =
    databaseMode === "sqlite"
      ? SQLITE_DATABASE_URL
      : postgresUrlFromFlags || (await promptPostgresUrl());

  if (databaseMode === "postgres" && !databaseUrl) {
    throw new Error("PostgreSQL URL cannot be empty.");
  }

  const envPath = path.join(projectRoot, ".env");
  await updateEnvFile(
    envPath,
    {
      ATRIA_DATABASE_URL: databaseUrl
    },
    parsedArgs.flags.force === true
  );

  console.log(`[atria] setup`);
  console.log(`[atria] project: ${projectRoot}`);
  console.log(`[atria] database: ${databaseMode}`);
  console.log(`[atria] .env updated: ${envPath}`);

  if (parsedArgs.flags["database-only"] === true) {
    console.log("[atria] Setup finished in database-only mode.");
  }
};

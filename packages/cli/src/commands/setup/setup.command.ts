import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import * as readlinePromises from "node:readline/promises";
import { done, doneField, isInteractivePrompt, terminal } from "@atria/shared";
import { parseArgs } from "../../parseArgs.js";

type DatabaseMode = "sqlite" | "postgres";
type PromptChoice<T extends string> = { value: T; label: string };

const SQLITE_DATABASE_URL = "file:./.atria/data/atria.db";
const DATABASE_MODE_CHOICES: Array<PromptChoice<DatabaseMode>> = [
  { value: "sqlite", label: "SQLite (default)" },
  { value: "postgres", label: "PostgreSQL" }
];

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

const readEnvValue = async (envPath: string, key: string): Promise<string | null> => {
  const content = await fs.readFile(envPath, "utf-8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  });

  if (content === null) {
    return null;
  }

  const lines = content.split(/\r?\n/g);
  for (const line of lines) {
    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const currentKey = line.slice(0, separator).trim();
    if (currentKey !== key) {
      continue;
    }
    return line.slice(separator + 1).trim();
  }

  return null;
};

const promptDatabaseMode = async (): Promise<DatabaseMode> => {
  if (!isInteractivePrompt()) {
    return "sqlite";
  }

  return new Promise((resolve, reject) => {
    let selectedIndex = 0;
    let hasNavigated = false;
    let renderedLines = 0;

    const clearRender = (): void => {
      if (renderedLines === 0) {
        return;
      }

      readline.moveCursor(process.stdout, 0, -Math.max(0, renderedLines - 1));
      readline.cursorTo(process.stdout, 0);
      readline.clearScreenDown(process.stdout);
      renderedLines = 0;
    };

    const render = (): void => {
      clearRender();

      const promptHint = hasNavigated
        ? ` ${terminal.dim("(↵ select)")}`
        : ` ${terminal.dim("(↑↓ navigate)")}`;
      const promptHeader = `${terminal.green("?")} ${terminal.bold("Select database engine")}${promptHint}`;
      const lines = [
        promptHeader,
        ...DATABASE_MODE_CHOICES.map((choice, index) =>
          index === selectedIndex
            ? `${terminal.cyan("❯")} ${terminal.cyan(choice.label)}`
            : `  ${choice.label}`
        )
      ];

      process.stdout.write(lines.join("\n"));
      renderedLines = lines.length;
    };

    const cleanup = (): void => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\u001b[?25h");
    };

    const finalize = (): void => {
      const value = DATABASE_MODE_CHOICES[selectedIndex].value;
      cleanup();
      clearRender();
      process.stdout.write("\n");
      resolve(value);
    };

    const onData = (chunk: Buffer | string): void => {
      const raw = typeof chunk === "string" ? chunk : chunk.toString("utf8");

      if (raw === "\u0003") {
        cleanup();
        clearRender();
        process.stdout.write("\n");
        reject(new Error("Setup cancelled."));
        return;
      }

      if (raw === "\r" || raw === "\n") {
        finalize();
        return;
      }

      if (raw === "\u001b[A") {
        hasNavigated = true;
        selectedIndex =
          selectedIndex === 0 ? DATABASE_MODE_CHOICES.length - 1 : selectedIndex - 1;
        render();
        return;
      }

      if (raw === "\u001b[B") {
        hasNavigated = true;
        selectedIndex = (selectedIndex + 1) % DATABASE_MODE_CHOICES.length;
        render();
      }
    };

    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    process.stdout.write("\u001b[?25l");
    render();
  });
};

const promptPostgresUrl = async (): Promise<string> => {
  if (!isInteractivePrompt()) {
    throw new Error("Missing --database-url for postgres in non-interactive mode.");
  }

  const rl = readlinePromises.createInterface({
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
): Promise<"updated" | "not-found"> => {
  const content = await fs.readFile(envPath, "utf-8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  });

  if (content === null) {
    return "not-found";
  }

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
  return "updated";
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
  const envPath = path.join(projectRoot, ".env");
  const existingDatabaseUrl = await readEnvValue(envPath, "ATRIA_DATABASE_URL");

  const databaseUrl =
    databaseMode === "sqlite"
      ? SQLITE_DATABASE_URL
      : postgresUrlFromFlags || existingDatabaseUrl || (await promptPostgresUrl());

  if (databaseMode === "postgres" && !databaseUrl) {
    throw new Error("PostgreSQL URL cannot be empty.");
  }

  const envUpdateResult = await updateEnvFile(
    envPath,
    {
      ATRIA_DATABASE_URL: databaseUrl
    },
    parsedArgs.flags.force === true
  );

  console.log(done("Setup started"));
  console.log(doneField("Project", projectRoot));
  console.log(doneField("Database", databaseMode));
  console.log(
    envUpdateResult === "updated"
      ? doneField(".env", envPath)
      : `${terminal.dim("•")} .env not found, skipped update`
  );

  if (parsedArgs.flags["database-only"] === true) {
    console.log(done("Setup finished in database-only mode."));
  }
  console.log(done("Setup completed."));
};

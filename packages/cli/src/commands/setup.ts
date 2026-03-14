import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { request as httpRequest } from "node:http";
import { promises as fs } from "node:fs";
import { openAtriaDatabase } from "@atria/db";
import { startDevServer, type DevServerHandle } from "@atria/server";
import {
  DEFAULT_DEV_PORT,
  parseAuthMethod,
  type AuthMethod
} from "@atria/shared";
import { parseArgs } from "../utils/args.js";
import { terminal } from "../utils/terminal.js";

interface OwnerSetupState {
  pending: boolean;
  preferredAuthMethod: AuthMethod | null;
}

interface SetupStatusPayload {
  pending?: unknown;
}

interface SetupStateResponse {
  statusCode: number;
  payload: SetupStatusPayload | null;
}

interface StudioRequestResult {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

interface WaitingSpinner {
  stop: () => void;
}

type DatabaseMode = "sqlite" | "postgres";

interface PromptChoice<T extends string> {
  value: T;
  label: string;
}

const AUTH_METHOD_CHOICES: Array<PromptChoice<AuthMethod>> = [
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "email", label: "E-mail / password" }
];

const DATABASE_MODE_CHOICES: Array<PromptChoice<DatabaseMode>> = [
  { value: "sqlite", label: "SQLite (default)" },
  { value: "postgres", label: "PostgreSQL" }
];

const supportsColor = process.stdout.isTTY === true && !process.env.NO_COLOR;

const bold = (text: string): string => (supportsColor ? `\u001b[1m${text}\u001b[22m` : text);
const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const printSetupHelp = (): void => {
  console.log(
    "Usage: atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--auth-method google|github|email] [--force]"
  );
};

const authMethodLabel = (authMethod: AuthMethod): string =>
  authMethod === "google" ? "Google" : authMethod === "github" ? "GitHub" : "E-mail / password";

const parseDatabaseMode = (value: string): DatabaseMode | null => {
  if (value === "sqlite" || value === "postgres") {
    return value;
  }

  return null;
};

const isPostgresConnectionString = (connectionString: string): boolean => {
  const normalized = connectionString.toLowerCase();
  return normalized.startsWith("postgres://") || normalized.startsWith("postgresql://");
};

const cleanEnvValue = (value: string | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof AggregateError) {
    const nested = error.errors
      .map((entry) => (entry instanceof Error && entry.message ? entry.message : String(entry)))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (nested.length > 0) {
      return nested.join(" | ");
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.trim().length > 0) {
      return code.trim();
    }
  }

  return String(error).trim();
};

const openBrowser = async (url: string): Promise<boolean> => {
  const openCommand =
    process.platform === "darwin"
      ? { command: "open", args: [url] }
      : process.platform === "win32"
        ? { command: "cmd", args: ["/c", "start", "", url] }
        : { command: "xdg-open", args: [url] };

  try {
    const child = spawn(openCommand.command, openCommand.args, {
      stdio: "ignore",
      detached: true
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
};

const parseDotEnvLine = (line: string): { key: string; value: string } | null => {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  if (!key) {
    return null;
  }

  const quoted =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"));
  const value = quoted ? rawValue.slice(1, -1) : rawValue;
  return { key, value };
};

const loadProjectEnv = async (projectRoot: string): Promise<void> => {
  const envPath = path.join(projectRoot, ".env");
  try {
    const envFile = await fs.readFile(envPath, "utf-8");
    const lines = envFile.split(/\r?\n/g);
    for (const line of lines) {
      const parsed = parseDotEnvLine(line);
      if (!parsed) {
        continue;
      }
      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
};

const hasPath = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const updateProjectEnv = async (
  projectRoot: string,
  updates: Record<string, string | null>
): Promise<void> => {
  const envPath = path.join(projectRoot, ".env");
  const managedKeys = Object.keys(updates);
  const content = await fs.readFile(envPath, "utf-8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });

  const lines = content.length > 0 ? content.split(/\r?\n/g) : [];
  const seen = new Set<string>();
  const outputLines: string[] = [];

  for (const line of lines) {
    const parsed = parseDotEnvLine(line);
    if (!parsed || !managedKeys.includes(parsed.key)) {
      outputLines.push(line);
      continue;
    }

    if (seen.has(parsed.key)) {
      continue;
    }

    seen.add(parsed.key);
    const nextValue = updates[parsed.key];
    if (nextValue !== null) {
      outputLines.push(`${parsed.key}=${nextValue}`);
    }
  }

  for (const key of managedKeys) {
    if (seen.has(key)) {
      continue;
    }

    const value = updates[key];
    if (value !== null) {
      outputLines.push(`${key}=${value}`);
    }
  }

  const normalized = outputLines.join("\n").replace(/\n{3,}/g, "\n\n");
  const finalContent = normalized.length > 0 ? `${normalized}\n` : "";
  await fs.writeFile(envPath, finalContent, "utf-8");
};

const resolveConfiguredDatabaseUrl = (): string | null =>
  cleanEnvValue(process.env.ATRIA_DATABASE_URL) ?? cleanEnvValue(process.env.DATABASE_URL);

const resolveConfiguredDatabaseMode = (): DatabaseMode | null => {
  const explicitConnection = resolveConfiguredDatabaseUrl();
  if (!explicitConnection) {
    return null;
  }

  return isPostgresConnectionString(explicitConnection) ? "postgres" : "sqlite";
};

const ensureDatabaseReady = async (
  projectRoot: string,
  envOverrides: Record<string, string | undefined> = {}
): Promise<void> => {
  const database = openAtriaDatabase(projectRoot, {
    env: {
      ...process.env,
      ...envOverrides
    }
  });

  try {
    await database.hasUsers();
  } finally {
    await database.close();
  }
};

const promptForChoice = async <T extends string>(
  promptText: string,
  choices: Array<PromptChoice<T>>
): Promise<T> =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      reject(new Error("Interactive setup prompt requires a TTY terminal."));
      return;
    }

    let selectedIndex = 0;
    let hasNavigated = false;
    let hasSavedCursor = false;
    let cursorHidden = false;

    const render = (): void => {
      const promptHint = hasNavigated ? "" : ` ${terminal.dim("(Use arrow keys)")}`;
      const promptHeader = `${terminal.green("?")} ${bold(promptText)}${promptHint}`;
      const lines = [
        promptHeader,
        ...choices.map((choice, index) =>
          index === selectedIndex
            ? `${terminal.cyan("❯")} ${terminal.cyan(choice.label)}`
            : `  ${choice.label}`
        )
      ];

      if (!hasSavedCursor) {
        process.stdout.write("\x1b[s");
        hasSavedCursor = true;
      } else {
        process.stdout.write("\x1b[u");
      }

      if (!cursorHidden) {
        process.stdout.write("\x1b[?25l");
        cursorHidden = true;
      }

      readline.clearScreenDown(process.stdout);
      for (let index = 0; index < lines.length; index += 1) {
        process.stdout.write(lines[index]);
        if (index < lines.length - 1) {
          process.stdout.write("\n");
        }
      }
    };

    const cleanup = (): void => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      if (hasSavedCursor) {
        process.stdout.write("\x1b[u");
        readline.clearScreenDown(process.stdout);
      }
      if (cursorHidden) {
        process.stdout.write("\x1b[?25h");
      }
      process.stdout.write("\n");
    };

    const onKeypress = (_input: string, key: readline.Key): void => {
      if (key.name === "up") {
        hasNavigated = true;
        selectedIndex = selectedIndex === 0 ? choices.length - 1 : selectedIndex - 1;
        render();
        return;
      }

      if (key.name === "down") {
        hasNavigated = true;
        selectedIndex = (selectedIndex + 1) % choices.length;
        render();
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(choices[selectedIndex].value);
        return;
      }

      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Setup cancelled."));
      }
    };

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", onKeypress);
    render();
  });

const promptForInput = async (promptText: string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      reject(new Error("Interactive setup prompt requires a TTY terminal."));
      return;
    }

    const input = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    input.question(`${promptText}: `, (answer) => {
      input.close();
      resolve(answer.trim());
    });

    input.on("SIGINT", () => {
      input.close();
      reject(new Error("Setup cancelled."));
    });
  });

const configureDatabase = async (
  projectRoot: string,
  options: {
    force: boolean;
    databaseModeFlag: DatabaseMode | null;
    databaseUrlFlag: string | null;
  }
): Promise<DatabaseMode> => {
  await loadProjectEnv(projectRoot);

  let selectedMode = options.databaseModeFlag;
  const configuredMode = resolveConfiguredDatabaseMode();
  const configuredUrl = resolveConfiguredDatabaseUrl();
  const hasEnvFile = await hasPath(path.join(projectRoot, ".env"));
  const shouldPrompt = options.force || (configuredMode === null && !hasEnvFile);

  if (selectedMode === null) {
    if (shouldPrompt && process.stdin.isTTY && process.stdout.isTTY) {
      selectedMode = await promptForChoice("Select database engine", DATABASE_MODE_CHOICES);
      console.log(
        `${terminal.green("?")} ${bold("Select database engine")} ${terminal.cyan(
          selectedMode === "sqlite" ? "SQLite (default)" : "PostgreSQL"
        )}`
      );
    } else {
      selectedMode = configuredMode ?? "sqlite";
    }
  }

  if (selectedMode === "sqlite") {
    await updateProjectEnv(projectRoot, {
      ATRIA_DATABASE_URL: null,
      DATABASE_URL: null
    });

    delete process.env.ATRIA_DATABASE_URL;
    delete process.env.DATABASE_URL;

    await ensureDatabaseReady(projectRoot, {
      ATRIA_DATABASE_URL: undefined,
      DATABASE_URL: undefined
    });

    return "sqlite";
  }

  let postgresUrl = options.databaseUrlFlag ?? (configuredMode === "postgres" ? configuredUrl : null);
  if (!postgresUrl) {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      postgresUrl = await promptForInput("PostgreSQL connection URL");
    } else {
      throw new Error("PostgreSQL mode requires --database-url or ATRIA_DATABASE_URL.");
    }
  }

  if (!isPostgresConnectionString(postgresUrl)) {
    throw new Error('Invalid PostgreSQL URL. Use "postgres://" or "postgresql://".');
  }

  await updateProjectEnv(projectRoot, {
    ATRIA_DATABASE_URL: postgresUrl,
    DATABASE_URL: null
  });

  process.env.ATRIA_DATABASE_URL = postgresUrl;
  delete process.env.DATABASE_URL;

  try {
    await ensureDatabaseReady(projectRoot, {
      ATRIA_DATABASE_URL: postgresUrl,
      DATABASE_URL: undefined
    });
  } catch (error) {
    const message = toErrorMessage(error);
    throw new Error(`Failed to connect to PostgreSQL. ${message}`);
  }

  return "postgres";
};

const requestStudio = async (requestPath: string): Promise<StudioRequestResult> =>
  new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        protocol: "http:",
        hostname: "localhost",
        port: DEFAULT_DEV_PORT,
        method: "GET",
        path: requestPath,
        headers: {
          host: `studio.localhost:${DEFAULT_DEV_PORT}`,
          accept: "application/json"
        }
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 500,
            headers: response.headers,
            body
          });
        });
      }
    );

    request.on("error", reject);
    request.end();
  });

const isProviderConfigured = async (provider: AuthMethod): Promise<boolean> => {
  try {
    const response = await requestStudio("/api/auth/providers");
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return false;
    }

    const payload = JSON.parse(response.body) as { providers?: unknown };
    return Array.isArray(payload.providers) && payload.providers.includes(provider);
  } catch {
    return false;
  }
};

const resolveProviderAuthorizationUrl = async (provider: AuthMethod): Promise<string> => {
  const response = await requestStudio(`/api/auth/start/${provider}`);
  const locationHeader = response.headers.location;
  const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
  if (response.statusCode >= 300 && response.statusCode < 400 && typeof location === "string") {
    return location;
  }

  if (response.statusCode >= 400) {
    throw new Error(
      `Failed to start OAuth for ${authMethodLabel(provider)} (status ${response.statusCode}).`
    );
  }

  return `http://studio.localhost:${DEFAULT_DEV_PORT}/api/auth/start/${provider}`;
};

const requestSetupStatus = async (): Promise<SetupStateResponse> => {
  try {
    const response = await requestStudio("/api/setup/status");
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return {
        statusCode: response.statusCode,
        payload: null
      };
    }

    return {
      statusCode: response.statusCode,
      payload: JSON.parse(response.body) as SetupStatusPayload
    };
  } catch {
    return {
      statusCode: 500,
      payload: null
    };
  }
};

const startLocalStudioServer = async (
  projectRoot: string
): Promise<{ server: DevServerHandle | null }> => {
  try {
    const server = await startDevServer({
      projectRoot,
      port: DEFAULT_DEV_PORT
    });
    return { server };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("EADDRINUSE")) {
      return { server: null };
    }
    throw error;
  }
};

const waitForSetupCompletion = async (abortSignal: { cancelled: boolean }): Promise<boolean> => {
  while (!abortSignal.cancelled) {
    const setupStatus = await requestSetupStatus();
    if (setupStatus.statusCode >= 200 && setupStatus.statusCode < 300) {
      if (setupStatus.payload?.pending === false) {
        return true;
      }
    }

    await sleep(1200);
  }

  return false;
};

const startWaitingSpinner = (message: string): WaitingSpinner => {
  if (!process.stdout.isTTY) {
    console.log(`${terminal.cyan("⋮")} ${message}`);
    return {
      stop: (): void => {}
    };
  }

  const frames = ["⠇", "⠏", "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"];
  let frameIndex = 0;
  let printedLength = 0;

  const render = (): void => {
    const line = `${terminal.cyan(`${frames[frameIndex]}`)} ${message}`;
    frameIndex = (frameIndex + 1) % frames.length;
    const paddedLine =
      printedLength > line.length ? `${line}${" ".repeat(printedLength - line.length)}` : line;
    printedLength = Math.max(printedLength, line.length);
    process.stdout.write(`\r${paddedLine}`);
  };

  render();
  const timer = setInterval(render, 90);

  return {
    stop: (): void => {
      clearInterval(timer);
      process.stdout.write(`\r${" ".repeat(printedLength)}\r`);
    }
  };
};

const isOAuthMethod = (authMethod: AuthMethod): authMethod is "google" | "github" =>
  authMethod === "google" || authMethod === "github";

const runOAuthSetupFlow = async (
  projectRoot: string,
  authMethod: "google" | "github"
): Promise<void> => {
  await loadProjectEnv(projectRoot);
  const { server } = await startLocalStudioServer(projectRoot);

  try {
    const providerConfigured = await isProviderConfigured(authMethod);
    if (!providerConfigured) {
      console.log(
        `${terminal.cyan("⋮")} OAuth provider ${terminal.cyan(authMethodLabel(authMethod))} is not available right now.`
      );
      return;
    }

    const authorizationUrl = await resolveProviderAuthorizationUrl(authMethod);
    console.log(`Opening browser at ${authorizationUrl}`);
    const opened = await openBrowser(authorizationUrl);
    if (!opened) {
      console.log(`${terminal.cyan("⋮")} Open this URL manually: ${authorizationUrl}`);
    }

    const spinnerMessage = "Waiting for browser login to complete... Press Ctrl + C to cancel";
    let waitingSpinner: WaitingSpinner | null = startWaitingSpinner(spinnerMessage);

    const abortSignal = { cancelled: false };
    const handleSigInt = (): void => {
      abortSignal.cancelled = true;
    };

    process.once("SIGINT", handleSigInt);
    try {
      await waitForSetupCompletion(abortSignal);
    } finally {
      process.off("SIGINT", handleSigInt);
      if (waitingSpinner) {
        waitingSpinner.stop();
        waitingSpinner = null;
      }
    }
  } finally {
    if (server) {
      await server.close();
    }
  }
};

const promptForAuthMethod = async (): Promise<AuthMethod> =>
  promptForChoice("Please log in or create a new account", AUTH_METHOD_CHOICES);

const readOwnerSetupState = async (projectRoot: string): Promise<OwnerSetupState> => {
  const database = openAtriaDatabase(projectRoot);
  try {
    return await database.getOwnerSetupState();
  } finally {
    await database.close();
  }
};

const writePreferredAuthMethod = async (
  projectRoot: string,
  authMethod: AuthMethod | null
): Promise<void> => {
  const database = openAtriaDatabase(projectRoot);
  try {
    await database.setPreferredAuthMethod(authMethod);
  } finally {
    await database.close();
  }
};

export const runSetupCommand = async (args: string[]): Promise<void> => {
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printSetupHelp();
    return;
  }

  if (parsedArgs.flags.complete === true) {
    throw new Error('Option "--complete" was removed. Setup completion is now derived from database users.');
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const force = parsedArgs.flags.force === true;
  const databaseOnly = parsedArgs.flags["database-only"] === true;

  const databaseUrlFromFlag =
    typeof parsedArgs.flags["database-url"] === "string"
      ? cleanEnvValue(String(parsedArgs.flags["database-url"]))
      : null;

  let databaseModeFromFlag: DatabaseMode | null =
    typeof parsedArgs.flags.database === "string"
      ? parseDatabaseMode(String(parsedArgs.flags.database).toLowerCase())
      : null;

  if (databaseUrlFromFlag && databaseModeFromFlag === null) {
    databaseModeFromFlag = "postgres";
  }

  const authMethodFromFlag =
    typeof parsedArgs.flags["auth-method"] === "string"
      ? parseAuthMethod(String(parsedArgs.flags["auth-method"]).toLowerCase())
      : null;

  if (parsedArgs.flags.database && databaseModeFromFlag === null) {
    throw new Error('Invalid --database value. Use "sqlite" or "postgres".');
  }

  if (databaseModeFromFlag === "sqlite" && databaseUrlFromFlag) {
    throw new Error('Option --database-url requires --database postgres.');
  }

  if (parsedArgs.flags["database-url"] && !databaseUrlFromFlag) {
    throw new Error('Option --database-url requires a non-empty PostgreSQL URL.');
  }

  if (parsedArgs.flags["auth-method"] && authMethodFromFlag === null) {
    throw new Error('Invalid --auth-method value. Use "google", "github", or "email".');
  }

  await configureDatabase(projectRoot, {
    force,
    databaseModeFlag: databaseModeFromFlag,
    databaseUrlFlag: databaseUrlFromFlag
  });

  if (databaseOnly) {
    return;
  }

  const existingSetupState = await readOwnerSetupState(projectRoot);

  if (!existingSetupState.pending && !force && authMethodFromFlag === null) {
    return;
  }

  if (existingSetupState.preferredAuthMethod && !force && authMethodFromFlag === null) {
    return;
  }

  let selectedAuthMethod = authMethodFromFlag;
  let selectedViaPrompt = false;
  if (selectedAuthMethod === null && process.stdin.isTTY && process.stdout.isTTY) {
    selectedAuthMethod = await promptForAuthMethod();
    selectedViaPrompt = true;
  }

  await writePreferredAuthMethod(projectRoot, selectedAuthMethod);

  if (selectedAuthMethod !== null && selectedViaPrompt) {
    const selectedLabel = authMethodLabel(selectedAuthMethod);
    console.log(
      `${terminal.green("?")} ${bold("Please log in or create a new account")} ${terminal.cyan(selectedLabel)}`
    );

    if (isOAuthMethod(selectedAuthMethod)) {
      await runOAuthSetupFlow(projectRoot, selectedAuthMethod);
      return;
    }

    console.log(`${terminal.cyan("⋮")} Email/password setup is coming soon.`);
  }
};

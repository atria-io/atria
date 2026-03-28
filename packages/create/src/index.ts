#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ATRIA_CONFIG_FILE = "atria.config.json";
const ATRIA_RUNTIME_DIR = path.join(".atria", "runtime");
const PUBLIC_OUTPUT_DIR = path.join("production", "public");
const STUDIO_CONTENT_DIR = path.join("production", "studio", "content");
const STUDIO_THEME_DIR = path.join("production", "studio", "theme");
const ADMIN_RUNTIME_SOURCE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../admin/studio"
);

const DEFAULT_PROJECT_LABEL = "My Studio Project";
const DEFAULT_PROJECT_DIR = "my-project";
const STUDIO_PACKAGE_NAME = "studio";
const DEFAULT_AUTH_BROKER_ORIGIN = "https://api.atrialabs.pt";

type PackageManager = "npm" | "pnpm" | "yarn";

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

interface WriteTarget {
  path: string;
  content: string;
}

const createEnvExampleFile = (): string =>
  [
    "# Preferred",
    "ATRIA_DATABASE_URL=",
    "",
    "# Compatibility",
    "# DATABASE_URL=",
    "",
    "# Central OAuth broker origin (recommended)",
    `ATRIA_AUTH_BROKER_ORIGIN=${DEFAULT_AUTH_BROKER_ORIGIN}`,
    "",
    "# Self-host OAuth fallback (optional)",
    "# ATRIA_AUTH_GOOGLE_CLIENT_ID=",
    "# ATRIA_AUTH_GOOGLE_CLIENT_SECRET=",
    "# ATRIA_AUTH_GITHUB_CLIENT_ID=",
    "# ATRIA_AUTH_GITHUB_CLIENT_SECRET=",
    "",
    "# Optional Studio origin override (default: http://localhost:3333)",
    "# ATRIA_AUTH_ORIGIN=",
    ""
  ].join("\n");

const parseArgs = (argv: string[]): ParsedArgs => {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("-")) {
      positionals.push(token);
      continue;
    }

    if (token === "-h" || token === "--help") {
      flags.help = true;
      continue;
    }

    if (!token.startsWith("--")) {
      continue;
    }

    const [key, inlineValue] = token.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }

    const nextToken = argv[index + 1];
    if (nextToken && !nextToken.startsWith("-")) {
      flags[key] = nextToken;
      index += 1;
      continue;
    }

    flags[key] = true;
  }

  return { positionals, flags };
};

const normalizeProjectName = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || DEFAULT_PROJECT_DIR;
};

const createProjectIdentifier = (): string => {
  const raw = randomBytes(6).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return (raw + "00000000").slice(0, 8);
};

const createProjectPackageJson = (cliVersion: string): string =>
  `${JSON.stringify(
    {
      name: STUDIO_PACKAGE_NAME,
      private: true,
      version: "0.1.0",
      scripts: {
        install: "atria setup --database-only",
        dev: "atria dev"
      },
      devDependencies: {
        atria: cliVersion
      }
    },
    null,
    2
  )}\n`;

const createConfigJson = (projectName: string, projectId: string): string =>
  `${JSON.stringify(
    {
      name: projectName,
      projectId
    },
    null,
    2
  )}\n`;

const fileExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const ensureDirectory = async (directoryPath: string): Promise<void> => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const assertWritableTargets = async (targets: WriteTarget[], force: boolean): Promise<void> => {
  if (force) {
    return;
  }

  for (const target of targets) {
    if (await fileExists(target.path)) {
      throw new Error(`File already exists: ${target.path}. Use --force to overwrite.`);
    }
  }
};

const writeTargets = async (targets: WriteTarget[]): Promise<void> => {
  for (const target of targets) {
    await ensureDirectory(path.dirname(target.path));
    await fs.writeFile(target.path, target.content, "utf-8");
  }
};

const copyAdminRuntime = async (projectRoot: string, force: boolean): Promise<void> => {
  const runtimeTargetDir = path.join(projectRoot, ATRIA_RUNTIME_DIR);
  const runtimeTargetStaticDir = path.join(runtimeTargetDir, "static");

  if (!(await fileExists(ADMIN_RUNTIME_SOURCE_DIR))) {
    throw new Error(`Admin runtime source not found: ${ADMIN_RUNTIME_SOURCE_DIR}`);
  }

  if (await fileExists(runtimeTargetDir)) {
    if (!force) {
      throw new Error(`File already exists: ${runtimeTargetDir}. Use --force to overwrite.`);
    }

    await fs.rm(runtimeTargetDir, { recursive: true, force: true });
  }

  await ensureDirectory(path.dirname(runtimeTargetDir));
  await fs.cp(ADMIN_RUNTIME_SOURCE_DIR, runtimeTargetDir, { recursive: true });
  await fs.rm(runtimeTargetStaticDir, { recursive: true, force: true });
};

const getPackageManager = (flags: Record<string, string | boolean>): PackageManager => {
  if (flags.pnpm === true || flags["use-pnpm"] === true) {
    return "pnpm";
  }
  if (flags.yarn === true || flags["use-yarn"] === true) {
    return "yarn";
  }
  return "npm";
};

const installProjectDependencies = async (
  projectRoot: string,
  packageManager: PackageManager
): Promise<void> =>
  new Promise((resolve, reject) => {
    const installArgs = packageManager === "yarn" ? [] : ["install"];
    const childProcess = spawn(packageManager, installArgs, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    childProcess.on("error", reject);
    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Dependency install failed with exit code ${code ?? "unknown"}.`));
    });
  });

const isInteractivePrompt = (): boolean => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const promptInput = async (label: string, defaultValue: string): Promise<string> => {
  if (!isInteractivePrompt()) {
    return defaultValue;
  }

  const interfaceHandle = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await interfaceHandle.question(`${label} (${defaultValue}): `);
    const trimmed = answer.trim();
    return trimmed || defaultValue;
  } finally {
    interfaceHandle.close();
  }
};

const printHelp = (): void => {
  console.log("Usage: create-atria [project-directory] [options]");
  console.log("");
  console.log("Options:");
  console.log("  --skip-install        Skip dependency installation");
  console.log("  --force               Overwrite existing project files");
  console.log("  --cli-version <ver>   Version/range for atria (default: latest)");
  console.log("  --pnpm                Use pnpm for dependency install");
  console.log("  --yarn                Use yarn for dependency install");
  console.log("  --npm                 Use npm for dependency install (default)");
  console.log("  -h, --help            Show help");
};

const run = async (): Promise<void> => {
  const parsedArgs = parseArgs(process.argv.slice(2));

  if (parsedArgs.flags.help) {
    printHelp();
    return;
  }

  if (parsedArgs.flags["auth-method"] !== undefined) {
    throw new Error('Option "--auth-method" was removed from create. Sign-in is selected in Studio.');
  }

  const explicitTarget = parsedArgs.positionals[0];
  const requestedProjectLabel = explicitTarget
    ? path.basename(path.resolve(process.cwd(), explicitTarget))
    : await promptInput("Create a new project", DEFAULT_PROJECT_LABEL);

  const projectId = createProjectIdentifier();
  const configProjectName = `${requestedProjectLabel} (${projectId})`;

  const targetArgument = explicitTarget
    ? explicitTarget
    : await promptInput("Project output path", normalizeProjectName(requestedProjectLabel));

  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const force = parsedArgs.flags.force === true;
  const skipInstall = parsedArgs.flags["skip-install"] === true;
  const cliVersion =
    typeof parsedArgs.flags["cli-version"] === "string"
      ? parsedArgs.flags["cli-version"]
      : "latest";
  const packageManager = getPackageManager(parsedArgs.flags);

  await Promise.all([
    ensureDirectory(path.join(projectRoot, STUDIO_CONTENT_DIR)),
    ensureDirectory(path.join(projectRoot, STUDIO_THEME_DIR)),
    ensureDirectory(path.join(projectRoot, PUBLIC_OUTPUT_DIR))
  ]);

  const targets: WriteTarget[] = [
    {
      path: path.join(projectRoot, "package.json"),
      content: createProjectPackageJson(cliVersion)
    },
    {
      path: path.join(projectRoot, ATRIA_CONFIG_FILE),
      content: createConfigJson(configProjectName, projectId)
    },
    {
      path: path.join(projectRoot, ".env.example"),
      content: createEnvExampleFile()
    },
    {
      path: path.join(projectRoot, STUDIO_CONTENT_DIR, ".gitkeep"),
      content: ""
    },
    {
      path: path.join(projectRoot, STUDIO_THEME_DIR, ".gitkeep"),
      content: ""
    }
  ];

  await assertWritableTargets(targets, force);
  await writeTargets(targets);
  await copyAdminRuntime(projectRoot, force);

  console.log(`[create] Project scaffolded at ${projectRoot}`);

  if (!skipInstall) {
    await installProjectDependencies(projectRoot, packageManager);
    console.log(`[create] Run ${packageManager} run dev inside ${targetArgument}.`);
    return;
  }

  console.log(`[create] Skipped dependency installation (--skip-install).`);
  console.log(`[create] Run ${packageManager} install inside ${targetArgument}.`);
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[create] ${message}`);
  process.exit(1);
});

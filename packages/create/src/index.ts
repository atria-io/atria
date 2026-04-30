#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { done, doneField, isInteractivePrompt, success, terminal } from "@atria/shared";
import { promptInput, promptProjectModeSelection } from "./prompts.js";
import { detectExistingProjectAt, discoverExistingProjects } from "./projects.js";
import { formatScaffoldedAt, replacePreviousPromptLine } from "./render.js";

const ATRIA_CONFIG_FILE = "atria.config.json";
const ATRIA_RUNTIME_DIR = path.join(".atria", "runtime");
const PUBLISHED_PUBLIC_DIR = path.join("published", "public");
const PUBLISHED_THEME_DIR = path.join("published", "theme");
const PUBLISHED_MEDIA_DIR = path.join("published", "media");
const PUBLISHED_HTML_DIR = path.join("published", "htm");
const CURRENT_MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_ADMIN_RUNTIME_SOURCE_DIR = path.resolve(CURRENT_MODULE_DIR, "./runtime");
const ADMIN_RUNTIME_SOURCE_DIR = existsSync(BUNDLED_ADMIN_RUNTIME_SOURCE_DIR)
  ? BUNDLED_ADMIN_RUNTIME_SOURCE_DIR
  : path.resolve(CURRENT_MODULE_DIR, "../../admin/dist/frontend");

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

interface ProjectSelection {
  targetArgument: string;
  configProjectName: string;
  projectId: string | null;
  mode: "new" | "existing";
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
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_PROJECT_DIR;
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : DEFAULT_PROJECT_DIR;
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

const resolveProjectSelection = async (parsedArgs: ParsedArgs): Promise<ProjectSelection> => {
  const explicitTarget = parsedArgs.positionals[0];

  if (explicitTarget) {
    const label = path.basename(path.resolve(process.cwd(), explicitTarget));
    const projectId = createProjectIdentifier();

    return {
      targetArgument: explicitTarget,
      configProjectName: `${label} (${projectId})`,
      projectId,
      mode: "new"
    };
  }

  const existingProjects = await discoverExistingProjects(process.cwd(), ATRIA_CONFIG_FILE);
  if (existingProjects.length > 0) {
    console.log(done("Fetching existing projects"));
    console.log("");

    const modeSelection = await promptProjectModeSelection(existingProjects);
    if (modeSelection.kind === "existing") {
      return {
        targetArgument: modeSelection.project.projectRoot,
        configProjectName: modeSelection.project.configProjectName,
        projectId: null,
        mode: "existing"
      };
    }
  }

  const requestedName = await promptInput("Create a new project:", {
    defaultValue: DEFAULT_PROJECT_LABEL,
    displayDefault: DEFAULT_PROJECT_LABEL
  });

  const projectNameLabel = requestedName.trim() || DEFAULT_PROJECT_LABEL;
  const normalizedName = normalizeProjectName(projectNameLabel);
  const projectIdentifier = createProjectIdentifier();
  const configProjectName = `${projectNameLabel} (${projectIdentifier})`;
  replacePreviousPromptLine(doneField("Project name:", configProjectName));

  const defaultOutputPath = path.join(process.cwd(), normalizedName);
  let suggestedOutputPath = defaultOutputPath;
  let hadPathConflict = false;

  while (true) {
    const outputPath = await promptInput("Project output path:", {
      defaultValue: suggestedOutputPath,
      displayDefault: suggestedOutputPath
    });

    const resolvedOutputRoot = path.resolve(process.cwd(), outputPath);
    const conflictingProject = await detectExistingProjectAt(resolvedOutputRoot, ATRIA_CONFIG_FILE);

    if (conflictingProject) {
      if (!isInteractivePrompt()) {
        throw new Error(`${conflictingProject.configProjectName} is already using path: ${resolvedOutputRoot}`);
      }

      replacePreviousPromptLine(
        `${terminal.red("✖")} ${terminal.red(`${conflictingProject.configProjectName} is already using this path.`)}`
      );

      if (suggestedOutputPath === defaultOutputPath) {
        suggestedOutputPath = path.join(process.cwd(), `${normalizedName}-${projectIdentifier}`);
      }

      hadPathConflict = true;
      continue;
    }

    const scaffoldedAt = formatScaffoldedAt(process.cwd(), resolvedOutputRoot);
    replacePreviousPromptLine(
      doneField("Project scaffolded at:", scaffoldedAt),
      hadPathConflict ? { linesUp: 2, clearDown: true } : {}
    );

    return {
      targetArgument: outputPath,
      configProjectName,
      projectId: projectIdentifier,
      mode: "new"
    };
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

  const selection = await resolveProjectSelection(parsedArgs);
  const projectRoot = path.resolve(process.cwd(), selection.targetArgument);
  const configProjectName = selection.configProjectName;
  const projectId = selection.projectId;
  const force = parsedArgs.flags.force === true;
  const skipInstall = parsedArgs.flags["skip-install"] === true;
  const cliVersion =
    typeof parsedArgs.flags["cli-version"] === "string"
      ? parsedArgs.flags["cli-version"]
      : "latest";
  const packageManager = getPackageManager(parsedArgs.flags);

  if (selection.mode === "existing") {
    const scaffoldedAt = formatScaffoldedAt(process.cwd(), projectRoot);
    console.log("");
    console.log(doneField("Using existing project", configProjectName));
    console.log(done("No files were changed"));
    console.log("");
    console.log(`Run ${terminal.cyan(`${packageManager} run dev`)} in the scaffolded ${terminal.cyan(scaffoldedAt)}.`);
    console.log("");
    return;
  }

  if (!projectId) {
    throw new Error("Project ID is required to scaffold a new project.");
  }

  await ensureDirectory(projectRoot);
  await Promise.all([
    ensureDirectory(path.join(projectRoot, PUBLISHED_PUBLIC_DIR)),
    ensureDirectory(path.join(projectRoot, PUBLISHED_THEME_DIR)),
    ensureDirectory(path.join(projectRoot, PUBLISHED_MEDIA_DIR)),
    ensureDirectory(path.join(projectRoot, PUBLISHED_HTML_DIR))
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
      path: path.join(projectRoot, PUBLISHED_PUBLIC_DIR, ".gitkeep"),
      content: ""
    },
    {
      path: path.join(projectRoot, PUBLISHED_THEME_DIR, ".gitkeep"),
      content: ""
    },
    {
      path: path.join(projectRoot, PUBLISHED_MEDIA_DIR, ".gitkeep"),
      content: ""
    },
    {
      path: path.join(projectRoot, PUBLISHED_HTML_DIR, ".gitkeep"),
      content: ""
    }
  ];

  await assertWritableTargets(targets, force);
  await writeTargets(targets);
  await copyAdminRuntime(projectRoot, force);

  const usedInteractiveSetupPrompts =
    selection.mode === "new" && isInteractivePrompt() && parsedArgs.positionals[0] === undefined;

  if (!usedInteractiveSetupPrompts) {
    console.log(doneField("Project scaffolded at:", formatScaffoldedAt(process.cwd(), projectRoot)));
    console.log(doneField("Project output path", projectRoot));
    console.log(doneField("Project name:", configProjectName));
  }

  console.log("");
  console.log(done("Bootstrapping files from template"));
  console.log(done("Creating default project files"));

  if (!skipInstall) {
    console.log("");
    await installProjectDependencies(projectRoot, packageManager);
  } else {
    console.log("");
    console.log(done("[create] Skipped dependency installation (--skip-install)."));
    console.log(done(`[create] Run ${packageManager} install inside ${selection.targetArgument}.`));
  }

  console.log("");
  console.log(success("Success! Your Studio has been created."));
  if (skipInstall) {
    console.log(`Run ${terminal.cyan(`${packageManager} install`)} inside ${terminal.cyan(selection.targetArgument)}.`);
  } else {
    console.log(
      `Get started by running ${terminal.cyan(
        `${packageManager} run dev`
      )} to launch your Studio's development server.`
    );
  }
  console.log("");
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[create] ${message}`);
  process.exit(1);
});

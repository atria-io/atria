#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  ATRIA_CONFIG_FILE,
  ATRIA_RUNTIME_DIR,
  PUBLIC_OUTPUT_DIR,
  STUDIO_CONTENT_DIR,
  STUDIO_THEME_DIR,
  createEnvExampleFile,
  ensureDirectory,
  parseArgs,
  type ParsedArgs,
  runtimeAppJs,
  runtimeIndexHtml,
  writeFile
} from "@atria/shared";

type PackageManager = "npm" | "pnpm" | "yarn";

interface PromptInputOptions {
  defaultValue: string;
  displayDefault?: string;
}

interface ReplacePromptOptions {
  linesUp?: number;
  clearDown?: boolean;
}

interface ProjectSelection {
  targetArgument: string;
  configProjectName: string;
  projectId: string | null;
  mode: "new" | "existing";
}

interface ExistingProjectEntry {
  configProjectName: string;
  projectRoot: string;
}

const STUDIO_PACKAGE_NAME = "studio";
const DEFAULT_PROJECT_NAME = "my-project";
const DEFAULT_PROJECT_NAME_LABEL = "My Studio Project";
const PROJECT_DISCOVERY_IGNORED_DIRS = new Set(["node_modules", ".git", ".pnpm-store"]);

const supportsColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const paint = (openCode: number, text: string): string =>
  supportsColor ? `\u001b[${openCode}m${text}\u001b[0m` : text;

const terminal = {
  blue: (text: string): string => paint(34, text),
  cyan: (text: string): string => paint(36, text),
  green: (text: string): string => paint(32, text),
  red: (text: string): string => paint(31, text),
  dim: (text: string): string => paint(90, text),
  bold: (text: string): string => paint(1, text)
};

const done = (text: string): string => `${terminal.green("✔")} ${text}`;
const doneField = (label: string, value: string): string =>
  `${terminal.green("✔")} ${terminal.bold(label)} ${terminal.cyan(value)}`;
const success = (text: string): string => `${terminal.green("✅")} ${text}`;
const isInteractivePrompt = (): boolean => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const replacePreviousPromptLine = (line: string, options: ReplacePromptOptions = {}): void => {
  if (!isInteractivePrompt()) {
    return;
  }

  const linesUp = options.linesUp ?? 1;
  if (linesUp > 0) {
    process.stdout.write(`\u001b[${linesUp}A`);
  }

  process.stdout.write("\r");
  if (options.clearDown) {
    process.stdout.write("\u001b[J");
  } else {
    process.stdout.write("\u001b[2K");
  }
  process.stdout.write(`${line}\n`);
};

const createProjectPackageJson = (cliVersion: string): string =>
  `${JSON.stringify(
    {
      name: STUDIO_PACKAGE_NAME,
      private: true,
      version: "0.1.0",
      scripts: {
        install: 'npm run "dev install"',
        "dev install": "atria setup --database-only",
        dev: "atria dev"
      },
      devDependencies: {
        "@atria/cli": cliVersion
      }
    },
    null,
    2
  )}\n`;

const createConfigJson = (projectName: string, projectId: string): string =>
  `${JSON.stringify(
    {
      name: projectName,
      runtimeDir: ATRIA_RUNTIME_DIR,
      projectId
    },
    null,
    2
  )}\n`;

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

const readJsonFile = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const detectExistingProjectAt = async (projectRoot: string): Promise<ExistingProjectEntry | null> => {
  const configPath = path.join(projectRoot, ATRIA_CONFIG_FILE);
  const config = await readJsonFile<{ name?: unknown }>(configPath);

  if (!config || typeof config.name !== "string") {
    return null;
  }

  const configProjectName = config.name.trim();
  if (!configProjectName) {
    return null;
  }

  return {
    configProjectName,
    projectRoot
  };
};

const discoverExistingProjects = async (baseDir: string): Promise<ExistingProjectEntry[]> => {
  const projectsByRoot = new Map<string, ExistingProjectEntry>();

  const collectProject = async (candidateRoot: string): Promise<void> => {
    const resolvedRoot = path.resolve(candidateRoot);
    if (projectsByRoot.has(resolvedRoot)) {
      return;
    }

    const detectedProject = await detectExistingProjectAt(resolvedRoot);
    if (!detectedProject) {
      return;
    }

    projectsByRoot.set(resolvedRoot, detectedProject);
  };

  await collectProject(baseDir);

  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(baseDir, { withFileTypes: true });
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith(".") || PROJECT_DISCOVERY_IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    await collectProject(path.join(baseDir, entry.name));
  }

  return Array.from(projectsByRoot.values()).sort((left, right) =>
    left.projectRoot.localeCompare(right.projectRoot)
  );
};

const promptProjectModeSelection = async (
  existingProjects: ExistingProjectEntry[]
): Promise<{ kind: "create-new" } | { kind: "existing"; project: ExistingProjectEntry }> => {
  if (!isInteractivePrompt() || existingProjects.length === 0) {
    return { kind: "create-new" };
  }

  return new Promise((resolve, reject) => {
    let selectedIndex = 0;
    let renderedLines = 0;
    let hasNavigated = false;
    const maxIndex = existingProjects.length;

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

      const lines: string[] = [];
      lines.push(`${terminal.blue("?")} ${terminal.bold("Create a new project or select an existing one")}`);
      lines.push(
        selectedIndex === 0
          ? `${terminal.cyan("❯")} ${terminal.cyan("Create new project")}`
          : "  Create new project"
      );
      lines.push(` ${terminal.dim("──────────────")}`);

      for (let index = 0; index < existingProjects.length; index += 1) {
        const project = existingProjects[index];
        const optionIndex = index + 1;
        const label = project.configProjectName;

        if (optionIndex === selectedIndex) {
          lines.push(`${terminal.cyan("❯")} ${terminal.cyan(label)}`);
          continue;
        }

        lines.push(`  ${label}`);
      }

      lines.push("");
      lines.push(terminal.dim(hasNavigated ? "↵ select" : "↑↓ navigate • ↵ select"));

      process.stdout.write(lines.join("\n"));
      renderedLines = lines.length;
    };

    const cleanup = (): void => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\u001b[?25h");
    };

    const finalize = (
      selection: { kind: "create-new" } | { kind: "existing"; project: ExistingProjectEntry }
    ): void => {
      cleanup();
      clearRender();

      if (selection.kind === "create-new") {
        process.stdout.write(`${done("Create new project")}\n`);
      } else {
        process.stdout.write(
          `${doneField("Using existing project", selection.project.configProjectName)}\n`
        );
      }

      resolve(selection);
    };

    const onData = (chunk: Buffer | string): void => {
      const raw = typeof chunk === "string" ? chunk : chunk.toString("utf8");

      if (raw === "\u0003") {
        cleanup();
        clearRender();
        process.stdout.write("\n");
        reject(new Error("Operation cancelled."));
        return;
      }

      if (raw === "\r" || raw === "\n") {
        if (selectedIndex === 0) {
          finalize({ kind: "create-new" });
          return;
        }

        finalize({
          kind: "existing",
          project: existingProjects[selectedIndex - 1]
        });
        return;
      }

      if (raw === "\u001b[A") {
        hasNavigated = true;
        selectedIndex = selectedIndex === 0 ? maxIndex : selectedIndex - 1;
        render();
        return;
      }

      if (raw === "\u001b[B") {
        hasNavigated = true;
        selectedIndex = selectedIndex === maxIndex ? 0 : selectedIndex + 1;
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

const normalizeProjectName = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_PROJECT_NAME;
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : DEFAULT_PROJECT_NAME;
};

const createProjectIdentifier = (): string => {
  const raw = randomBytes(6).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return (raw + "00000000").slice(0, 8);
};

const formatScaffoldedAt = (baseDir: string, targetDir: string): string => {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetDir);
  const baseName = path.basename(resolvedBase) || resolvedBase;
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (!relative || relative === ".") {
    return `(${baseName})`;
  }

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return `(${resolvedTarget})`;
  }

  const combined = path.join(baseName, relative).split(path.sep).join("/");
  return `(${combined})`;
};

const isPrintableInput = (value: string): boolean => {
  const code = value.charCodeAt(0);
  return code >= 32 && code !== 127;
};

const promptInput = async (label: string, options: PromptInputOptions): Promise<string> => {
  if (!isInteractivePrompt()) {
    return options.defaultValue;
  }

  const displayDefault = options.displayDefault ?? options.defaultValue;

  return new Promise((resolve, reject) => {
    let inputValue = "";

    const render = (): void => {
      const visibleValue =
        inputValue.length > 0 ? inputValue : terminal.dim(`(${displayDefault})`);

      process.stdout.write(
        `\r\u001b[2K${terminal.blue("?")} ${terminal.bold(label)} ${visibleValue}`
      );
    };

    const cleanup = (): void => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\u001b[?25h");
    };

    const finalize = (): void => {
      const trimmed = inputValue.trim();
      const resolvedValue = trimmed.length > 0 ? trimmed : options.defaultValue;
      cleanup();
      process.stdout.write("\n");
      resolve(resolvedValue);
    };

    const onData = (chunk: Buffer | string): void => {
      const raw = typeof chunk === "string" ? chunk : chunk.toString("utf8");

      if (raw === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Operation cancelled."));
        return;
      }

      if (raw === "\r" || raw === "\n") {
        finalize();
        return;
      }

      if (raw === "\u007f" || raw === "\b" || raw === "\u0008") {
        inputValue = inputValue.slice(0, -1);
        render();
        return;
      }

      if (raw.startsWith("\u001b")) {
        return;
      }

      for (const char of raw) {
        if (isPrintableInput(char)) {
          inputValue += char;
        }
      }

      render();
    };

    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    process.stdout.write("\u001b[?25h");

    render();
  });
};

const resolveProjectSelection = async (parsedArgs: ParsedArgs): Promise<ProjectSelection> => {
  const explicitTarget = parsedArgs.positionals[0];

  if (explicitTarget) {
    return {
      targetArgument: explicitTarget,
      configProjectName: path.basename(path.resolve(process.cwd(), explicitTarget)),
      projectId: createProjectIdentifier(),
      mode: "new"
    };
  }

  const existingProjects = await discoverExistingProjects(process.cwd());
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
    defaultValue: DEFAULT_PROJECT_NAME_LABEL,
    displayDefault: DEFAULT_PROJECT_NAME_LABEL
  });

  const projectNameLabel = requestedName.trim() || DEFAULT_PROJECT_NAME_LABEL;
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
    const conflictingProject = await detectExistingProjectAt(resolvedOutputRoot);

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
  console.log("Usage: create [project-directory] [options]");
  console.log("");
  console.log("Options:");
  console.log("  --skip-install        Skip dependency installation");
  console.log("  --force               Overwrite existing project files");
  console.log("  --cli-version <ver>   Version/range for @atria/cli (default: latest)");
  console.log("  --pnpm                Use pnpm for dependency install");
  console.log("  --yarn                Use yarn for dependency install");
  console.log("  --npm                 Use npm for dependency install (default)");
  console.log("  -h, --help            Show help");
};

/**
 * Process boundary for `create-atria`.
 * Enforces that auth choice remains a Studio concern by rejecting `--auth-method` at scaffold time.
 *
 * @throws {Error} When invalid flags are used, scaffold writes fail, or dependency install fails.
 */
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
  const projectName = path.basename(projectRoot);
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
    ensureDirectory(path.join(projectRoot, STUDIO_CONTENT_DIR)),
    ensureDirectory(path.join(projectRoot, STUDIO_THEME_DIR)),
    ensureDirectory(path.join(projectRoot, ATRIA_RUNTIME_DIR)),
    ensureDirectory(path.join(projectRoot, PUBLIC_OUTPUT_DIR))
  ]);

  const writeTargets = [
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
    },
    {
      path: path.join(projectRoot, ATRIA_RUNTIME_DIR, "index.html"),
      content: runtimeIndexHtml
    },
    {
      path: path.join(projectRoot, ATRIA_RUNTIME_DIR, "app.js"),
      content: runtimeAppJs
    }
  ];

  for (const target of writeTargets) {
    await writeFile(target.path, target.content, force);
  }

  const usedInteractiveSetupPrompts =
    selection.mode === "new" && isInteractivePrompt() && parsedArgs.positionals[0] === undefined;

  if (!usedInteractiveSetupPrompts) {
    console.log(doneField("Project scaffolded at:", `(${projectName})`));
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
    console.log("[create] Skipping dependency installation (--skip-install).");
    console.log(`[create] Run ${packageManager} install to choose database engine.`);
  }

  console.log("");
  console.log(success("Success! Your Studio has been created."));
  if (skipInstall) {
    console.log(`Run ${terminal.cyan(`${packageManager} install`)} to choose your database engine first.`);
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

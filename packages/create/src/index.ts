#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ATRIA_CONFIG_FILE,
  ATRIA_RUNTIME_DIR,
  PUBLIC_OUTPUT_DIR,
  STUDIO_CONTENT_DIR,
  STUDIO_THEME_DIR,
  createEnvExampleFile,
  runtimeAppJs,
  runtimeIndexHtml
} from "@atria/shared";

type WriteStatus = "created" | "updated" | "skipped";
type PackageManager = "npm" | "pnpm" | "yarn";

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

const ensureDirectory = async (directoryPath: string): Promise<void> => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const writeFile = async (
  filePath: string,
  content: string,
  force = false
): Promise<WriteStatus> => {
  let exists = false;

  try {
    await fs.access(filePath);
    exists = true;
  } catch {
    exists = false;
  }

  if (exists && !force) {
    return "skipped";
  }

  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
  return exists ? "updated" : "created";
};

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

    if (token.startsWith("--")) {
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
      continue;
    }
  }

  return { positionals, flags };
};

const createProjectPackageJson = (projectName: string, cliVersion: string): string =>
  `${JSON.stringify(
    {
      name: projectName,
      private: true,
      version: "0.1.0",
      scripts: {
        postinstall: "atria setup --database-only",
        dev: "atria dev"
      },
      devDependencies: {
        "@atria/cli": cliVersion
      }
    },
    null,
    2
  )}\n`;

const createConfigJson = (projectName: string): string =>
  `${JSON.stringify(
    {
      name: projectName,
      runtimeDir: ATRIA_RUNTIME_DIR
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

const run = async (): Promise<void> => {
  const parsedArgs = parseArgs(process.argv.slice(2));
  if (parsedArgs.flags.help) {
    printHelp();
    return;
  }

  if (parsedArgs.flags["auth-method"] !== undefined) {
    throw new Error('Option "--auth-method" was removed from create. Sign-in is selected in Studio.');
  }

  const targetArgument = parsedArgs.positionals[0] ?? "atria-project";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const projectName = path.basename(projectRoot);
  const force = parsedArgs.flags.force === true;
  const skipInstall = parsedArgs.flags["skip-install"] === true;
  const cliVersion =
    typeof parsedArgs.flags["cli-version"] === "string"
      ? parsedArgs.flags["cli-version"]
      : "latest";
  const packageManager = getPackageManager(parsedArgs.flags);

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
      content: createProjectPackageJson(projectName, cliVersion)
    },
    {
      path: path.join(projectRoot, ATRIA_CONFIG_FILE),
      content: createConfigJson(projectName)
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

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const target of writeTargets) {
    const writeStatus = await writeFile(target.path, target.content, force);
    if (writeStatus === "created") {
      created += 1;
    } else if (writeStatus === "updated") {
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(`[create] Project scaffolded at ${projectRoot}`);
  console.log(`[create] Files: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log("[create] Database setup is deferred to npm install (atria setup).")

  if (!skipInstall) {
    console.log(`[create] Installing dependencies via ${packageManager}...`);
    await installProjectDependencies(projectRoot, packageManager);
  } else {
    console.log("[create] Skipping dependency installation (--skip-install).\n[create] Run npm install to choose database engine.");
  }

  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${targetArgument}`);
  if (skipInstall) {
    console.log(`  ${packageManager} install`);
  }
  console.log(`  ${packageManager} run dev`);
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[create] ${message}`);
  process.exit(1);
});

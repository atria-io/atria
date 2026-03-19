import path from "node:path";
import {
  ATRIA_CONFIG_FILE,
  ATRIA_RUNTIME_DIR,
  PUBLIC_OUTPUT_DIR,
  STUDIO_CONTENT_DIR,
  STUDIO_THEME_DIR,
  createEnvExampleFile,
  ensureDirectory,
  parseArgs,
  runtimeAppJs,
  runtimeIndexHtml,
  writeFile
} from "@atria/shared";

const STUDIO_PACKAGE_NAME = "studio";

const buildProjectPackageJson = (): string =>
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
        "@atria/cli": "latest"
      }
    },
    null,
    2
  )}\n`;

const buildConfigFile = (projectName: string): string =>
  `${JSON.stringify(
    {
      name: projectName,
      runtimeDir: ATRIA_RUNTIME_DIR
    },
    null,
    2
  )}\n`;

const printInitHelp = (): void => {
  console.log("Usage: atria init [project-directory] [--force]");
};

/**
 * Command boundary for `atria init`.
 * The scaffold written here must stay compatible with `atria dev` runtime/public expectations.
 *
 * @throws {Error} Propagates filesystem failures while creating the scaffold.
 */
export const runInitCommand = async (args: string[]): Promise<void> => {
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printInitHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const targetRoot = path.resolve(process.cwd(), targetArgument);
  const force = parsedArgs.flags.force === true;

  await ensureDirectory(targetRoot);

  const directories = [
    path.join(targetRoot, STUDIO_CONTENT_DIR),
    path.join(targetRoot, STUDIO_THEME_DIR),
    path.join(targetRoot, ATRIA_RUNTIME_DIR),
    path.join(targetRoot, PUBLIC_OUTPUT_DIR)
  ];

  await Promise.all(directories.map((directory) => ensureDirectory(directory)));

  const filesToWrite = [
    {
      path: path.join(targetRoot, "package.json"),
      content: buildProjectPackageJson()
    },
    {
      path: path.join(targetRoot, ATRIA_CONFIG_FILE),
      content: buildConfigFile(path.basename(targetRoot))
    },
    {
      path: path.join(targetRoot, ".env.example"),
      content: createEnvExampleFile()
    },
    {
      path: path.join(targetRoot, STUDIO_CONTENT_DIR, ".gitkeep"),
      content: ""
    },
    {
      path: path.join(targetRoot, STUDIO_THEME_DIR, ".gitkeep"),
      content: ""
    },
    {
      path: path.join(targetRoot, ATRIA_RUNTIME_DIR, "index.html"),
      content: runtimeIndexHtml
    },
    {
      path: path.join(targetRoot, ATRIA_RUNTIME_DIR, "app.js"),
      content: runtimeAppJs
    }
  ];

  for (const file of filesToWrite) {
    await writeFile(file.path, file.content, force);
  }

  const runtimePath = path.join(targetRoot, ATRIA_RUNTIME_DIR);
  const runtimeLabel = path.relative(targetRoot, runtimePath) || runtimePath;

  console.log(`[atria] Project ready at ${targetRoot}`);
  console.log(`[atria] Runtime: ${runtimeLabel}`);
  console.log("[atria] Database setup is deferred to npm install (atria setup).");
  console.log("[atria] Run npm install to choose SQLite or PostgreSQL.");
};

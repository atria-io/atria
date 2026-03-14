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
import { parseArgs } from "../utils/args.js";
import { ensureDirectory, writeFile } from "../utils/fs.js";

const buildProjectPackageJson = (projectName: string): string =>
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

const fileLabel = (targetRoot: string, filePath: string): string => {
  const relativePath = path.relative(targetRoot, filePath);
  return relativePath.length > 0 ? relativePath : filePath;
};

const printInitHelp = (): void => {
  console.log("Usage: atria init [project-directory] [--force]");
};

export const runInitCommand = async (args: string[]): Promise<void> => {
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printInitHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const targetRoot = path.resolve(process.cwd(), targetArgument);
  const force = parsedArgs.flags.force === true;
  const projectName = path.basename(targetRoot);

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
      content: buildProjectPackageJson(projectName)
    },
    {
      path: path.join(targetRoot, ATRIA_CONFIG_FILE),
      content: buildConfigFile(projectName)
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

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const file of filesToWrite) {
    const status = await writeFile(file.path, file.content, force);
    if (status === "created") {
      created += 1;
    } else if (status === "updated") {
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(`[atria] Project ready at ${targetRoot}`);
  console.log(`[atria] Files: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log(
    `[atria] Runtime: ${fileLabel(targetRoot, path.join(targetRoot, ATRIA_RUNTIME_DIR))}`
  );
  console.log("[atria] Database setup is deferred to npm install (atria setup).\n[atria] Run npm install to choose SQLite or PostgreSQL.");
};

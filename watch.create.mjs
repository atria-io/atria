#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  copyFileSync,
  symlinkSync,
  lstatSync,
  realpathSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.join(rootDir, "workspace");
const runtimeDir = path.join(workspaceDir, ".atria", "runtime");
const frontendDir = path.join(rootDir, "packages", "admin", "dist", "frontend");
const cliNodeModulesScopedRoot = path.join(rootDir, "packages", "cli", "node_modules", "@atria");
const dbNodeModulesScopeRoot = path.join(rootDir, "packages", "db", "node_modules", "@");

const run = (command, args, cwd = rootDir) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const cleanDirContents = (targetDir) => {
  if (!existsSync(targetDir)) {
    return;
  }

  for (const name of readdirSync(targetDir)) {
    rmSync(path.join(targetDir, name), { recursive: true, force: true });
  }
};

const ensureWorkspace = () => {
  mkdirSync(workspaceDir, { recursive: true });
  cleanDirContents(workspaceDir);
};

const ensureRuntimeAssets = () => {
  const indexFile = path.join(frontendDir, "index.htm");
  if (!existsSync(indexFile)) {
    console.error("Missing local admin build output: packages/admin/dist/frontend/index.htm");
    process.exit(1);
  }

  mkdirSync(runtimeDir, { recursive: true });
  cleanDirContents(runtimeDir);

  copyFileSync(
    indexFile,
    path.join(runtimeDir, "index.htm")
  );

  const files = readdirSync(frontendDir).filter((name) => name.endsWith(".js"));
  for (const file of files) {
    copyFileSync(path.join(frontendDir, file), path.join(runtimeDir, file));
  }
};

const setWorkspacePackageJson = () => {
  run("npm", [
    "--prefix",
    workspaceDir,
    "pkg",
    "set",
    'scripts.install=node --input-type=module -e "import { runCli } from \\\"@atria/cli\\\"; runCli([process.execPath, \\\"atria\\\", \\\"setup\\\", \\\".\\\", \\\"--database\\\", \\\"sqlite\\\", \\\"--database-only\\\"]).catch((error) => { const message = error instanceof Error ? error.message : String(error); console.error(\\\"[atria] \\\" + message); process.exit(1); });"',
    'scripts.dev=node --input-type=module -e "import { runCli } from \\\"@atria/cli\\\"; runCli([process.execPath, \\\"atria\\\", \\\"dev\\\", \\\".\\\"]).catch((error) => { const message = error instanceof Error ? error.message : String(error); console.error(\\\"[atria] \\\" + message); process.exit(1); });"',
    'devDependencies.@atria/cli=file:../packages/cli',
    'devDependencies.@atria/admin=file:../packages/admin',
    'devDependencies.@atria/ui=file:../packages/ui',
    'devDependencies.@atria/server=file:../packages/server',
    'devDependencies.@atria/shared=file:../packages/shared',
    'overrides.atria=file:../packages/atria',
    'overrides.@atria/cli=file:../packages/cli',
    'overrides.@atria/admin=file:../packages/admin',
    'overrides.@atria/ui=file:../packages/ui',
    'overrides.@atria/server=file:../packages/server',
    'overrides.@atria/core=file:../packages/core',
    'overrides.@atria/db=file:../packages/db',
    'overrides.@atria/shared=file:../packages/shared'
  ]);
};

const forceLocalWorkspaceLinks = () => {
  const scopedRoot = path.join(workspaceDir, "node_modules", "@atria");
  mkdirSync(scopedRoot, { recursive: true });

  const mappings = [
    ["admin", path.join(rootDir, "packages", "admin")],
    ["core", path.join(rootDir, "packages", "core")],
    ["db", path.join(rootDir, "packages", "db")],
    ["ui", path.join(rootDir, "packages", "ui")],
    ["cli", path.join(rootDir, "packages", "cli")],
    ["server", path.join(rootDir, "packages", "server")],
    ["shared", path.join(rootDir, "packages", "shared")]
  ];

  for (const [name, target] of mappings) {
    const linkPath = path.join(scopedRoot, name);
    const packageName = `@atria/${name}`;
    rmSync(linkPath, { recursive: true, force: true });
    symlinkSync(target, linkPath, "dir");

    const stats = lstatSync(linkPath);
    if (!stats.isSymbolicLink()) {
      console.error(`Expected symlink for ${packageName} at workspace/node_modules.`);
      process.exit(1);
    }

    const resolved = realpathSync(linkPath);
    if (resolved !== target) {
      console.error(`${packageName} is not linked to local source.`);
      process.exit(1);
    }
  }
};

const forceLocalCliResolutionLinks = () => {
  mkdirSync(cliNodeModulesScopedRoot, { recursive: true });

  const mappings = [
    ["admin", path.join(rootDir, "packages", "admin")],
    ["core", path.join(rootDir, "packages", "core")],
    ["db", path.join(rootDir, "packages", "db")],
    ["ui", path.join(rootDir, "packages", "ui")],
    ["server", path.join(rootDir, "packages", "server")],
    ["shared", path.join(rootDir, "packages", "shared")]
  ];

  for (const [name, target] of mappings) {
    const linkPath = path.join(cliNodeModulesScopedRoot, name);
    rmSync(linkPath, { recursive: true, force: true });
    symlinkSync(target, linkPath, "dir");

    const stats = lstatSync(linkPath);
    if (!stats.isSymbolicLink()) {
      console.error(`Expected symlink for @atria/${name} in packages/cli/node_modules.`);
      process.exit(1);
    }

    const resolved = realpathSync(linkPath);
    if (resolved !== target) {
      console.error(`@atria/${name} in packages/cli/node_modules is not local.`);
      process.exit(1);
    }
  }
};

const forceLocalDbAliasLinks = () => {
  mkdirSync(dbNodeModulesScopeRoot, { recursive: true });

  const mappings = [
    ["data", path.join(rootDir, "packages", "db", "dist", "data")],
    ["system", path.join(rootDir, "packages", "db", "dist", "system")]
  ];

  for (const [name, target] of mappings) {
    const linkPath = path.join(dbNodeModulesScopeRoot, name);
    rmSync(linkPath, { recursive: true, force: true });
    symlinkSync(target, linkPath, "dir");

    const stats = lstatSync(linkPath);
    if (!stats.isSymbolicLink()) {
      console.error(`Expected alias symlink for @/${name} in packages/db/node_modules.`);
      process.exit(1);
    }

    const resolved = realpathSync(linkPath);
    if (resolved !== target) {
      console.error(`@/${name} in packages/db/node_modules is not local.`);
      process.exit(1);
    }
  }
};

const main = () => {
  ensureWorkspace();

  run("corepack", ["pnpm", "install", "--no-frozen-lockfile"]);
  run("corepack", ["pnpm", "--filter", "@atria/shared", "build"]);
  run("corepack", ["pnpm", "--filter", "@atria/db", "build"]);
  run("corepack", ["pnpm", "--filter", "@atria/core", "build"]);
  run("corepack", ["pnpm", "--filter", "@atria/server", "build"]);
  run("corepack", ["pnpm", "--filter", "@atria/cli", "build"]);
  run("corepack", ["pnpm", "--filter", "atria", "build"]);
  run("node", [path.join("packages", "admin", "build", "dist.mjs")]);
  run("corepack", ["pnpm", "--filter", "create-atria", "build"]);

  run("node", [
    path.join("packages", "create", "dist", "index.js"),
    "workspace",
    "--force",
    "--skip-install",
    "--cli-version",
    "file:../packages/atria"
  ]);

  ensureRuntimeAssets();
  setWorkspacePackageJson();
  forceLocalCliResolutionLinks();
  forceLocalDbAliasLinks();
  run("npm", ["install"], workspaceDir);
  forceLocalWorkspaceLinks();
  forceLocalCliResolutionLinks();
  forceLocalDbAliasLinks();

  run("pwd", [], workspaceDir);
  run("ls", ["-la"], workspaceDir);
  run("find", [".", "-maxdepth", "2", "-mindepth", "1"], workspaceDir);
  run("npm", ["run", "watch:live"], rootDir);
};

main();

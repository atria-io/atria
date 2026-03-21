#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = path.join(ROOT_DIR, "packages");

const parseArgs = (argv) => {
  const options = {
    baseRef: null,
    bumpType: "patch",
    packsDir: "workspace/packs"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--base") {
      options.baseRef = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (value === "--bump") {
      options.bumpType = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (value === "--packs-dir") {
      options.packsDir = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
  }

  if (!options.baseRef) {
    options.baseRef = resolveBaseRef();
  }

  if (!["patch", "minor", "major"].includes(options.bumpType)) {
    throw new Error(`Invalid --bump value "${options.bumpType}". Use patch, minor, or major.`);
  }

  if (options.packsDir.trim().length === 0) {
    throw new Error("Invalid --packs-dir value.");
  }

  return options;
};

const run = (command, args, { allowFailure = false } = {}) => {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: "pipe"
  });

  const stdout = result.stdout?.toString() ?? "";
  const stderr = result.stderr?.toString() ?? "";

  if (result.status !== 0 && !allowFailure) {
    const message = [stdout, stderr].filter((chunk) => chunk.trim().length > 0).join("\n").trim();
    throw new Error(message.length > 0 ? message : `${command} ${args.join(" ")} failed.`);
  }

  return {
    status: result.status ?? 1,
    stdout,
    stderr
  };
};

const runLogged = (title, command, args) => {
  process.stdout.write(`\n${title}\n`);
  const result = run(command, args);

  if (result.stdout.trim().length > 0) {
    process.stdout.write(`${result.stdout.trimEnd()}\n`);
  }

  if (result.stderr.trim().length > 0) {
    process.stderr.write(`${result.stderr.trimEnd()}\n`);
  }
};

const resolveBaseRef = () => {
  const tagResult = run("git", ["describe", "--tags", "--abbrev=0"], { allowFailure: true });
  if (tagResult.status === 0) {
    const tag = tagResult.stdout.trim();
    if (tag.length > 0) {
      return tag;
    }
  }

  const headResult = run("git", ["rev-parse", "--verify", "HEAD~1"], { allowFailure: true });
  if (headResult.status === 0) {
    return "HEAD~1";
  }

  throw new Error("Could not resolve base ref. Pass --base <ref>.");
};

const listPackages = () => {
  const entries = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dirName = entry.name;
    const packageJsonPath = path.join(PACKAGES_DIR, dirName, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packages.push({
      dirName,
      dirPath: path.join(PACKAGES_DIR, dirName),
      packageJsonPath,
      name: packageJson.name,
      packageJson
    });
  }

  const packageNames = new Set(packages.map((item) => item.name));
  for (const item of packages) {
    const dependencies = {
      ...(item.packageJson.dependencies ?? {}),
      ...(item.packageJson.optionalDependencies ?? {}),
      ...(item.packageJson.peerDependencies ?? {})
    };

    item.internalDependencies = Object.keys(dependencies).filter((name) => packageNames.has(name));
  }

  return packages;
};

const readChangedFiles = (baseRef) => {
  const fileSet = new Set();
  const commands = [
    ["git", ["diff", "--name-only", `${baseRef}...HEAD`]],
    ["git", ["diff", "--name-only"]],
    ["git", ["diff", "--name-only", "--cached"]]
  ];

  for (const [command, args] of commands) {
    const output = run(command, args).stdout;
    for (const line of output.split("\n")) {
      const normalized = line.trim();
      if (normalized.length > 0) {
        fileSet.add(normalized);
      }
    }
  }

  return fileSet;
};

const detectChangedPackages = (packages, changedFiles) => {
  const byDir = new Map(packages.map((item) => [item.dirName, item]));
  const changedPackageNames = new Set();

  for (const filePath of changedFiles) {
    const segments = filePath.split("/");
    if (segments.length < 2 || segments[0] !== "packages") {
      continue;
    }

    const packageDir = segments[1];
    const packageEntry = byDir.get(packageDir);
    if (packageEntry) {
      changedPackageNames.add(packageEntry.name);
    }
  }

  return changedPackageNames;
};

const expandImpactedPackages = (packages, changedPackageNames) => {
  const reverseDependencies = new Map();

  for (const item of packages) {
    for (const dependencyName of item.internalDependencies) {
      const dependents = reverseDependencies.get(dependencyName) ?? new Set();
      dependents.add(item.name);
      reverseDependencies.set(dependencyName, dependents);
    }
  }

  const impacted = new Set(changedPackageNames);
  const queue = [...changedPackageNames];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const dependents = reverseDependencies.get(current);
    if (!dependents) {
      continue;
    }

    for (const dependent of dependents) {
      if (impacted.has(dependent)) {
        continue;
      }

      impacted.add(dependent);
      queue.push(dependent);
    }
  }

  return impacted;
};

const topologicalSortPackages = (packages, impactedPackageNames) => {
  const packageMap = new Map(packages.map((item) => [item.name, item]));
  const ordered = [];
  const permanent = new Set();
  const temporary = new Set();

  const visit = (packageName) => {
    if (permanent.has(packageName)) {
      return;
    }

    if (temporary.has(packageName)) {
      throw new Error(`Cycle detected while sorting impacted packages: ${packageName}`);
    }

    temporary.add(packageName);

    const packageEntry = packageMap.get(packageName);
    if (!packageEntry) {
      throw new Error(`Package not found: ${packageName}`);
    }

    for (const dependencyName of packageEntry.internalDependencies) {
      if (impactedPackageNames.has(dependencyName)) {
        visit(dependencyName);
      }
    }

    temporary.delete(packageName);
    permanent.add(packageName);
    ordered.push(packageName);
  };

  const names = [...impactedPackageNames].sort((left, right) => left.localeCompare(right));
  for (const packageName of names) {
    visit(packageName);
  }

  return ordered;
};

const makeFilterArgs = (orderedPackageNames) =>
  orderedPackageNames.flatMap((packageName) => ["--filter", packageName]);

const cleanupExistingTarballs = (packsDirPath, orderedPackageNames) => {
  if (!fs.existsSync(packsDirPath)) {
    return;
  }

  const tarFiles = fs.readdirSync(packsDirPath);
  const prefixes = orderedPackageNames.map((name) => `${name.replace(/^@/, "").replace("/", "-")}-`);

  for (const fileName of tarFiles) {
    if (!fileName.endsWith(".tgz")) {
      continue;
    }

    if (!prefixes.some((prefix) => fileName.startsWith(prefix))) {
      continue;
    }

    fs.rmSync(path.join(packsDirPath, fileName), { force: true });
  }
};

const readVersions = (packages, orderedPackageNames) => {
  const packageMap = new Map(packages.map((item) => [item.name, item]));
  const lines = [];

  for (const packageName of orderedPackageNames) {
    const packageEntry = packageMap.get(packageName);
    if (!packageEntry) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageEntry.packageJsonPath, "utf8"));
    lines.push(`${packageName}@${packageJson.version}`);
  }

  return lines;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const packages = listPackages();
  const changedFiles = readChangedFiles(options.baseRef);
  const changedPackageNames = detectChangedPackages(packages, changedFiles);

  if (changedPackageNames.size === 0) {
    process.stdout.write(`No package changes detected since ${options.baseRef}.\n`);
    return;
  }

  const impacted = expandImpactedPackages(packages, changedPackageNames);
  const orderedPackageNames = topologicalSortPackages(packages, impacted);
  const filterArgs = makeFilterArgs(orderedPackageNames);
  const packsDirPath = path.resolve(ROOT_DIR, options.packsDir);

  process.stdout.write(
    `Base ref: ${options.baseRef}\nChanged: ${[...changedPackageNames].sort().join(", ")}\nImpacted: ${orderedPackageNames.join(", ")}\n`
  );

  runLogged(
    "Bumping versions",
    "corepack",
    ["pnpm", "-r", ...filterArgs, "exec", "npm", "version", options.bumpType, "--no-git-tag-version"]
  );

  runLogged("Building impacted packages", "corepack", ["pnpm", "-r", ...filterArgs, "build"]);

  fs.mkdirSync(packsDirPath, { recursive: true });
  cleanupExistingTarballs(packsDirPath, orderedPackageNames);

  runLogged("Packing impacted packages", "corepack", [
    "pnpm",
    "-r",
    ...filterArgs,
    "pack",
    "--pack-destination",
    packsDirPath
  ]);

  const versions = readVersions(packages, orderedPackageNames);
  const packedFiles = fs
    .readdirSync(packsDirPath)
    .filter((fileName) =>
      orderedPackageNames.some((name) =>
        fileName.startsWith(`${name.replace(/^@/, "").replace("/", "-")}-`) && fileName.endsWith(".tgz")
      )
    )
    .sort();

  process.stdout.write("\nResult\n");
  for (const line of versions) {
    process.stdout.write(`- ${line}\n`);
  }
  for (const fileName of packedFiles) {
    process.stdout.write(`- ${path.join(options.packsDir, fileName)}\n`);
  }
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

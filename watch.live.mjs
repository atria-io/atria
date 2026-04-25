#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readdirSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.join(rootDir, "packages");
const workspaceDir = path.join(rootDir, "workspace");
const ADMIN_DIST_DIR = path.join(packagesDir, "admin", "dist");
/**
 * Controls browser auto-reload after dev restarts.
 * Use `off` or `false` in `ATRIA_BROWSER_RELOAD` to disable it.
 */
const BROWSER_RELOAD_MODE = (() => {
  const mode = (process.env.ATRIA_BROWSER_RELOAD ?? "cmdr").toLowerCase();
  return mode === "false" ? "off" : mode;
})();
const BROWSER_RELOAD_DELAY_MS = 700;
const RESTART_DEBOUNCE_MS = 350;
const WATCH_DEBOUNCE_MS = 200;
const ADMIN_PORT = 3333;
const INTERNAL_API_PORT = 3334;
const ADMIN_WATCH_IGNORED_PREFIXES = ["dist", "node_modules"];
const WORKSPACE_IGNORED_PREFIXES = [
  ".atria/data",
  ".atria/runtime",
  "node_modules",
  ".git"
];
const TSC_WATCH_NOISE_LINES = new Set([
  "Starting compilation in watch mode...",
  "Found 0 errors. Watching for file changes."
]);

if (!existsSync(workspaceDir)) {
  console.error('[live] Missing "workspace" directory. Create it first.');
  process.exit(1);
}

const watchers = [];
let tscWatchProcess = null;
let devProcess = null;
let restartTimer = null;
let browserReloadTimer = null;
let shuttingDown = false;
let restartingDev = false;
let pendingRestart = false;
let browserReloadWarningShown = false;

let adminBuildTimer = null;
let adminBuildRunning = false;
let adminBuildQueued = false;
let restartQueuedAfterAdminBuild = false;

let sharedBuildTimer = null;
let sharedBuildRunning = false;
let sharedBuildQueued = false;

const spawnProcess = (command, args, cwd, stdio = "inherit") =>
  spawn(command, args, {
    cwd,
    stdio,
    env: process.env
  });

const spawnBackgroundProcess = (command, args, cwd, stdio = "inherit") =>
  spawn(command, args, {
    cwd,
    stdio,
    env: process.env,
    detached: true
  });

const runCommand = (command, args, cwd, stdio = "inherit") =>
  new Promise((resolve) => {
    const child = spawnProcess(command, args, cwd, stdio);
    child.on("exit", (code) => {
      resolve(code ?? 0);
    });
    child.on("error", () => {
      resolve(1);
    });
  });

const runCommandCapture = (command, args, cwd) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("exit", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
    child.on("error", () => {
      resolve({ code: 1, stdout: "", stderr: "" });
    });
  });

const listListeningPids = async (port) => {
  const result = await runCommandCapture(
    "lsof",
    ["-nP", "-t", `-iTCP:${port}`, "-sTCP:LISTEN"],
    rootDir
  );
  if (result.code !== 0 || result.stdout.trim() === "") {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
};

const isNodeProcess = async (pid) => {
  const result = await runCommandCapture("ps", ["-p", String(pid), "-o", "comm="], rootDir);
  if (result.code !== 0) {
    return false;
  }

  const command = result.stdout.trim().toLowerCase();
  return command.includes("node");
};

const terminatePid = (pid, signal) => {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
};

const ensureDevPortsAvailable = async () => {
  const ports = [ADMIN_PORT, INTERNAL_API_PORT];
  let killed = 0;

  for (const port of ports) {
    const pids = await listListeningPids(port);
    for (const pid of pids) {
      if (pid === process.pid) {
        continue;
      }

      if (!(await isNodeProcess(pid))) {
        continue;
      }

      if (terminatePid(pid, "SIGTERM")) {
        killed += 1;
      }
    }
  }

  if (killed === 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  for (const port of ports) {
    const pids = await listListeningPids(port);
    for (const pid of pids) {
      if (pid === process.pid) {
        continue;
      }

      if (!(await isNodeProcess(pid))) {
        continue;
      }

      terminatePid(pid, "SIGKILL");
    }
  }
};

const terminateChildProcess = async (child) =>
  new Promise((resolve) => {
    let exited = false;
    const finish = () => {
      if (exited) {
        return;
      }
      exited = true;
      resolve();
    };

    const killByGroup = (signal) => {
      if (!child.pid) {
        return false;
      }

      try {
        process.kill(-child.pid, signal);
        return true;
      } catch {
        return false;
      }
    };

    const killByPid = (signal) => {
      try {
        child.kill(signal);
        return true;
      } catch {
        return false;
      }
    };

    const killTimeout = setTimeout(() => {
      if (!killByGroup("SIGKILL")) {
        killByPid("SIGKILL");
      }
    }, 3000);

    child.once("exit", () => {
      clearTimeout(killTimeout);
      finish();
    });

    if (!killByGroup("SIGTERM")) {
      if (!killByPid("SIGTERM")) {
        clearTimeout(killTimeout);
        finish();
      }
    }
  });

/**
 * Triggers a browser refresh after dev-server restarts.
 * Reload mode is controlled by ATRIA_BROWSER_RELOAD.
 *
 * @returns {Promise<void>}
 */
const runBrowserReload = async () => {
  if (shuttingDown || BROWSER_RELOAD_MODE === "off") {
    return;
  }

  let code = 1;
  if (BROWSER_RELOAD_MODE === "cmdr") {
    code = await runCommand(
      "osascript",
      ["-e", 'tell application "System Events" to keystroke "r" using {command down}'],
      rootDir,
      ["ignore", "ignore", "ignore"]
    );
  } else if (BROWSER_RELOAD_MODE === "chrome") {
    code = await runCommand(
      "osascript",
      [
        "-e",
        'tell application "Google Chrome" to tell active tab of front window to reload'
      ],
      rootDir,
      ["ignore", "ignore", "ignore"]
    );
  } else if (BROWSER_RELOAD_MODE === "safari") {
    code = await runCommand(
      "osascript",
      ["-e", 'tell application "Safari" to tell front document to do JavaScript "location.reload()"'],
      rootDir,
      ["ignore", "ignore", "ignore"]
    );
  }

  if (code === 0 || browserReloadWarningShown) {
    return;
  }

  browserReloadWarningShown = true;
};

/**
 * Coalesces browser refresh requests to avoid repeated reload bursts.
 *
 * @returns {void}
 */
const queueBrowserReload = () => {
  if (shuttingDown || BROWSER_RELOAD_MODE === "off") {
    return;
  }

  if (browserReloadTimer) {
    clearTimeout(browserReloadTimer);
  }

  browserReloadTimer = setTimeout(() => {
    browserReloadTimer = null;
    void runBrowserReload();
  }, BROWSER_RELOAD_DELAY_MS);
};

const forwardFilteredTscOutput = (stream, output) => {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += String(chunk);

    while (true) {
      const nextLineBreakIndex = buffer.indexOf("\n");
      if (nextLineBreakIndex === -1) {
        return;
      }

      const rawLine = buffer.slice(0, nextLineBreakIndex);
      buffer = buffer.slice(nextLineBreakIndex + 1);

      const line = rawLine.replace(/\r/g, "").trim();
      if (!line || TSC_WATCH_NOISE_LINES.has(line)) {
        continue;
      }

      output.write(`${line}\n`);
    }
  });

  stream.on("end", () => {
    const line = buffer.replace(/\r/g, "").trim();
    if (!line || TSC_WATCH_NOISE_LINES.has(line)) {
      return;
    }
    output.write(`${line}\n`);
  });
};

const requestRestart = () => {
  if (shuttingDown) {
    return;
  }

  if (adminBuildRunning || adminBuildQueued) {
    restartQueuedAfterAdminBuild = true;
    return;
  }

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;
    void restartDevServer();
  }, RESTART_DEBOUNCE_MS);
};

const stopDevServer = async () => {
  if (!devProcess) {
    return;
  }

  const current = devProcess;
  devProcess = null;
  await terminateChildProcess(current);
};

const startDevServer = () => {
  if (shuttingDown) {
    return;
  }

  devProcess = spawnBackgroundProcess(
    "node",
    [path.join("..", "packages", "atria", "dist", "bin.js"), "dev"],
    workspaceDir
  );

  devProcess.on("exit", () => {
    if (shuttingDown || restartingDev) {
      return;
    }
    requestRestart();
  });

  queueBrowserReload();
};

/**
 * Restarts workspace dev safely while preserving single-flight semantics.
 * If a restart is requested mid-restart, it is queued once.
 *
 * @returns {Promise<void>}
 */
const restartDevServer = async () => {
  if (shuttingDown) {
    return;
  }

  if (restartingDev) {
    pendingRestart = true;
    return;
  }

  restartingDev = true;
  await stopDevServer();
  startDevServer();
  restartingDev = false;

  if (pendingRestart) {
    pendingRestart = false;
    void restartDevServer();
  }
};

const queueAdminBuild = () => {
  if (shuttingDown) {
    return;
  }

  if (adminBuildTimer) {
    clearTimeout(adminBuildTimer);
  }

  adminBuildTimer = setTimeout(() => {
    adminBuildTimer = null;
    void runAdminBuild();
  }, WATCH_DEBOUNCE_MS);
};

/**
 * Rebuilds @atria/admin on source changes and requests restart only after
 * a successful build so server boot never targets a missing app.js.
 *
 * @returns {Promise<void>}
 */
const runAdminBuild = async () => {
  if (shuttingDown) {
    return;
  }

  if (adminBuildRunning) {
    adminBuildQueued = true;
    return;
  }

  adminBuildRunning = true;
  const code = await runCommand(
    "corepack",
    ["pnpm", "--filter", "@atria/admin", "build"],
    rootDir
  );
  if (code !== 0) {
    restartQueuedAfterAdminBuild = false;
    console.error(`[live] @atria/admin build failed (exit ${code}).`);
  } else {
    restartQueuedAfterAdminBuild = true;
  }
  adminBuildRunning = false;

  if (adminBuildQueued) {
    adminBuildQueued = false;
    void runAdminBuild();
    return;
  }

  if (restartQueuedAfterAdminBuild) {
    restartQueuedAfterAdminBuild = false;
    requestRestart();
  }
};

const queueSharedBuild = () => {
  if (shuttingDown) {
    return;
  }

  if (sharedBuildTimer) {
    clearTimeout(sharedBuildTimer);
  }

  sharedBuildTimer = setTimeout(() => {
    sharedBuildTimer = null;
    void runSharedBuild();
  }, WATCH_DEBOUNCE_MS);
};

/**
 * Rebuilds @atria/shared for runtime template/build-script changes.
 *
 * @returns {Promise<void>}
 */
const runSharedBuild = async () => {
  if (shuttingDown) {
    return;
  }

  if (sharedBuildRunning) {
    sharedBuildQueued = true;
    return;
  }

  sharedBuildRunning = true;
  const code = await runCommand(
    "corepack",
    ["pnpm", "--filter", "@atria/shared", "build"],
    rootDir
  );
  if (code !== 0) {
    console.error(`[live] @atria/shared build failed (exit ${code}).`);
  }
  sharedBuildRunning = false;

  if (sharedBuildQueued) {
    sharedBuildQueued = false;
    void runSharedBuild();
  }
};

const addRecursiveWatcher = (targetPath, onEvent) => {
  if (!existsSync(targetPath)) {
    return;
  }

  try {
    const watcher = watch(targetPath, { recursive: true }, (eventType, filename) => {
      onEvent(eventType, filename ? String(filename) : "");
    });
    watchers.push(watcher);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[live] Could not watch ${targetPath}: ${message}`);
  }
};

const closeWatchers = () => {
  for (const watcher of watchers) {
    watcher.close();
  }
  watchers.length = 0;
};

const shutdown = async (exitCode) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (restartTimer) {
    clearTimeout(restartTimer);
  }
  if (browserReloadTimer) {
    clearTimeout(browserReloadTimer);
  }
  if (adminBuildTimer) {
    clearTimeout(adminBuildTimer);
  }
  if (sharedBuildTimer) {
    clearTimeout(sharedBuildTimer);
  }

  closeWatchers();
  await stopDevServer();

  if (tscWatchProcess) {
    const current = tscWatchProcess;
    tscWatchProcess = null;
    await terminateChildProcess(current);
  }

  process.exit(exitCode);
};

/**
 * Watches package dist outputs and asks for a dev restart on changes.
 * Admin dist is excluded and handled via runAdminBuild completion.
 *
 * @returns {void}
 */
const watchDistOutputs = () => {
  const packageNames = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const packageName of packageNames) {
    const distDir = path.join(packagesDir, packageName, "dist");
    if (distDir === ADMIN_DIST_DIR) {
      continue;
    }
    addRecursiveWatcher(distDir, requestRestart);
  }
};

const watchBuildOnlySources = () => {
  addRecursiveWatcher(path.join(packagesDir, "admin"), (_eventType, filename) => {
    if (filename.length === 0) {
      return;
    }

    const normalized = filename.replace(/\\/g, "/");
    const isIgnored = ADMIN_WATCH_IGNORED_PREFIXES.some((prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`)
    );
    if (isIgnored) {
      return;
    }

    queueAdminBuild();
  });
  addRecursiveWatcher(path.join(packagesDir, "shared", "src", "runtime"), queueSharedBuild);
  addRecursiveWatcher(path.join(packagesDir, "shared", "build"), queueSharedBuild);
};

const watchWorkspaceSources = () => {
  addRecursiveWatcher(workspaceDir, (_eventType, filename) => {
    if (filename.length > 0) {
      const normalizedFilename = filename.replace(/\\/g, "/");
      const isIgnored = WORKSPACE_IGNORED_PREFIXES.some((prefix) =>
        normalizedFilename === prefix ||
        normalizedFilename.startsWith(`${prefix}/`)
      );
      if (isIgnored) {
        return;
      }
    }

    requestRestart();
  });
};

/**
 * Bootstraps the live bridge: initial build, TS watch, file watchers,
 * and workspace dev process lifecycle wiring.
 *
 * @returns {Promise<void>}
 */
const main = async () => {
  process.on("SIGINT", () => {
    void shutdown(0);
  });
  process.on("SIGTERM", () => {
    void shutdown(0);
  });

  console.log("[live] Building packages once before watch...");
  const initialBuildCode = await runCommand(
    "corepack",
    ["pnpm", "-r", "--filter", "./packages/*", "build"],
    rootDir
  );
  if (initialBuildCode !== 0) {
    await shutdown(initialBuildCode);
    return;
  }

  console.log("[live] Starting TypeScript watch...");
  tscWatchProcess = spawnBackgroundProcess(
    "corepack",
    [
      "pnpm",
      "-r",
      "--parallel",
      "--filter",
      "./packages/*",
      "exec",
      "tsc",
      "-w",
      "--pretty",
      "false",
      "--preserveWatchOutput",
      "-p",
      "tsconfig.json"
    ],
    rootDir,
    ["inherit", "pipe", "pipe"]
  );

  if (tscWatchProcess.stdout) {
    forwardFilteredTscOutput(tscWatchProcess.stdout, process.stdout);
  }
  if (tscWatchProcess.stderr) {
    forwardFilteredTscOutput(tscWatchProcess.stderr, process.stderr);
  }

  tscWatchProcess.on("exit", (code) => {
    if (shuttingDown) {
      return;
    }
    console.error(`[live] TypeScript watch stopped (exit ${code ?? 0}).`);
    void shutdown(code ?? 1);
  });

  watchDistOutputs();
  watchBuildOnlySources();
  watchWorkspaceSources();

  console.log("[live] Starting workspace dev server...");
  await ensureDevPortsAvailable();
  startDevServer();
};

void main();

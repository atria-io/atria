import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from "node:http";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { terminal } from "@atria/shared";
import { startDevServer } from "@atria/server";
import { parseArgs } from "../../parseArgs.js";

const DEFAULT_ADMIN_PORT = 3333;
const DEFAULT_PUBLIC_PORT = 4444;

const printDevHelp = (): void => {
  console.log("Usage: atria dev [project-directory] [--admin-port 3333] [--public-port 4444]");
};

const parsePort = (
  value: string | boolean | undefined,
  fallback: number,
  flagName: string
): number => {
  if (value === undefined || value === true) {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${flagName} value: ${value}`);
  }

  return parsed;
};

const readProjectIdFromProjectConfig = async (projectRoot: string): Promise<string> => {
  try {
    const configPath = path.join(projectRoot, "atria.config.json");
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as { projectId?: unknown };
    return typeof parsed.projectId === "string" ? parsed.projectId.trim() : "";
  } catch {
    return "";
  }
};

const mimeTypeByExtension: Record<string, string> = {
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const pathExists = async (target: string): Promise<boolean> => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const resolvePathWithinRoot = (root: string, requestPath: string): string | null => {
  const resolvedRoot = path.resolve(root);
  const candidatePath = path.resolve(root, `.${requestPath}`);
  if (candidatePath === resolvedRoot || candidatePath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return candidatePath;
  }

  return null;
};

const resolveRuntimeFilePath = (
  runtimeRoot: string,
  adminDistRoot: string,
  adminAssetDirectory: string,
  urlPath: string
): string | null => {
  const indexFile = path.join(runtimeRoot, "index.htm");

  if (urlPath === "/" || urlPath === "/index.html") {
    return indexFile;
  }

  if (path.extname(urlPath) === "") {
    return indexFile;
  }

  if (urlPath.startsWith(`/${adminAssetDirectory}/`)) {
    return resolvePathWithinRoot(adminDistRoot, urlPath);
  }

  return resolvePathWithinRoot(runtimeRoot, urlPath);
};

const runAdminBuild = async (adminPackageRoot: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const buildEntry = path.join(adminPackageRoot, "build", "dist.mjs");
    const child = spawn(process.execPath, [buildEntry], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`admin build failed with exit code ${code ?? 1}`));
    });
    child.on("error", reject);
  });

const hasIndexFile = (runtimeRoot: string): Promise<boolean> =>
  pathExists(path.join(runtimeRoot, "index.htm"));

const resolveAdminAssetDirectory = async (adminDistRoot: string): Promise<string | null> => {
  try {
    const entries = await fs.readdir(adminDistRoot, { withFileTypes: true });
    const matched = entries.find((entry) => entry.isDirectory() && /^[a-f0-9]{3}$/.test(entry.name));
    return matched?.name ?? null;
  } catch {
    return null;
  }
};

const hasRuntimePayload = async (adminDistRoot: string): Promise<boolean> =>
  (await hasIndexFile(adminDistRoot)) && (await resolveAdminAssetDirectory(adminDistRoot)) !== null;

const materializeWorkspaceRuntime = async (
  adminDistRoot: string,
  workspaceRuntimeRoot: string
): Promise<void> => {
  await fs.rm(workspaceRuntimeRoot, { recursive: true, force: true });
  await fs.mkdir(workspaceRuntimeRoot, { recursive: true });

  const adminEntries = await fs.readdir(adminDistRoot, { withFileTypes: true });
  for (const entry of adminEntries) {
    if (!entry.isFile()) {
      continue;
    }

    if (entry.name === "index.htm" || entry.name.endsWith(".js")) {
      await fs.cp(
        path.join(adminDistRoot, entry.name),
        path.join(workspaceRuntimeRoot, entry.name)
      );
    }
  }
};

const ensureWorkspaceRuntime = async (
  projectRoot: string
): Promise<{ runtimeRoot: string; adminDistRoot: string; adminAssetDirectory: string }> => {
  const workspaceRuntimeRoot = path.join(projectRoot, path.join(".atria", "runtime"));
  const adminDistRoot = resolveAdminDistRoot();
  const adminPackageRoot = path.resolve(adminDistRoot, "..", "..");
  let adminReady = await hasRuntimePayload(adminDistRoot);
  if (!adminReady) {
    const buildEntry = path.join(adminPackageRoot, "build", "dist.mjs");
    if (await pathExists(buildEntry)) {
      await runAdminBuild(adminPackageRoot);
      adminReady = await hasRuntimePayload(adminDistRoot);
    }
  }

  if (!adminReady) {
    throw new Error("Admin dist runtime is missing required files.");
  }
  const adminAssetDirectory = await resolveAdminAssetDirectory(adminDistRoot);
  if (!adminAssetDirectory) {
    throw new Error("Admin dist runtime asset directory is missing after build.");
  }

  await materializeWorkspaceRuntime(adminDistRoot, workspaceRuntimeRoot);

  if (!(await hasIndexFile(workspaceRuntimeRoot))) {
    throw new Error("Workspace runtime is missing required files after materialization.");
  }

  return {
    runtimeRoot: workspaceRuntimeRoot,
    adminDistRoot,
    adminAssetDirectory
  };
};

const resolveAdminDistRoot = (): string => {
  const require = createRequire(import.meta.url);
  const adminPackageFile = require.resolve("@atria/admin/package.json");
  const adminPackageRoot = path.dirname(adminPackageFile);
  return path.join(adminPackageRoot, "dist", "frontend");
};

const readRequestBody = async (request: IncomingMessage): Promise<Buffer | undefined> => {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
};

const proxyToInternalApi = async (
  request: IncomingMessage,
  response: ServerResponse,
  internalApiPort: number,
  requestUrl: string
): Promise<void> => {
  const requestBody = await readRequestBody(request);

  await new Promise<void>((resolve, reject) => {
    const upstreamRequest = httpRequest(
      {
        hostname: "127.0.0.1",
        port: internalApiPort,
        path: requestUrl,
        method: request.method ?? "GET",
        headers: request.headers,
      },
      (upstreamResponse) => {
        response.statusCode = upstreamResponse.statusCode ?? 500;
        for (const [key, value] of Object.entries(upstreamResponse.headers)) {
          if (value !== undefined) {
            response.setHeader(key, value);
          }
        }

        const chunks: Buffer[] = [];
        upstreamResponse.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        upstreamResponse.on("end", () => {
          response.end(Buffer.concat(chunks));
          resolve();
        });
      }
    );

    upstreamRequest.on("error", reject);
    if (requestBody) {
      upstreamRequest.write(requestBody);
    }
    upstreamRequest.end();
  });
};

export const runDevCommand = async (args: string[]): Promise<void> => {
  const startTime = Date.now();
  const parsedArgs = parseArgs(args);
  if (parsedArgs.flags.help) {
    printDevHelp();
    return;
  }

  const targetArgument = parsedArgs.positionals[0] ?? ".";
  const projectRoot = path.resolve(process.cwd(), targetArgument);
  const adminPort = parsePort(parsedArgs.flags["admin-port"], DEFAULT_ADMIN_PORT, "admin-port");
  const publicPort = parsePort(parsedArgs.flags["public-port"], DEFAULT_PUBLIC_PORT, "public-port");
  const internalApiPort = adminPort + 1;
  let internalApiServer: Server | null = null;

  if (!process.env.ATRIA_PROJECT_ID) {
    const projectId = await readProjectIdFromProjectConfig(projectRoot);
    if (projectId !== "") {
      process.env.ATRIA_PROJECT_ID = projectId;
    }
  }

  console.log(`${terminal.green("✔")} Checking configuration files...`);
  const { runtimeRoot, adminDistRoot, adminAssetDirectory } = await ensureWorkspaceRuntime(projectRoot);
  internalApiServer = await startDevServer({ host: "0.0.0.0", port: internalApiPort });

  const server = createServer(async (request, response) => {
    const requestUrl = request.url ?? "/";
    const pathname = new URL(requestUrl, "http://localhost").pathname;

    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/auth/")
    ) {
      try {
        await proxyToInternalApi(request, response, internalApiPort, requestUrl);
      } catch {
        response.statusCode = 500;
        response.end("Internal Server Error");
      }

      return;
    }

    const runtimeFilePath = resolveRuntimeFilePath(runtimeRoot, adminDistRoot, adminAssetDirectory, pathname);
    if (!runtimeFilePath) {
      response.statusCode = 404;
      response.end("Not Found");
      return;
    }

    try {
      await fs.access(runtimeFilePath);
      const content = await fs.readFile(runtimeFilePath);
      const extension = path.extname(runtimeFilePath).toLowerCase();
      const contentType = mimeTypeByExtension[extension] ?? "application/octet-stream";

      response.statusCode = 200;
      response.setHeader("Content-Type", contentType);
      response.end(content);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        response.statusCode = 404;
        response.end("Not Found");
        return;
      }

      response.statusCode = 500;
      response.end("Internal Server Error");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    console.log(`${terminal.green("✔")} Starting dev server`);
    server.listen(adminPort, "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const elapsedMs = Date.now() - startTime;
  const adminUrl = `http://localhost:${adminPort}`;
  const publicUrl = `http://localhost:${publicPort}`;

  console.log("");
  console.log(`Atria is ready in ${elapsedMs}ms.`);
  console.log(`Frontend is available at ${terminal.cyan(`${publicUrl}/`)}`);
  console.log(`Atria Studio is available at ${terminal.cyan(`${adminUrl}/`)}`);
  console.log("");

  const shutdown = (): void => {
    server.close(() => {
      if (!internalApiServer) {
        process.exit(0);
        return;
      }

      internalApiServer.close(() => {
        process.exit(0);
      });
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

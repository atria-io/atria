import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from "node:http";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
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
  ".woff2": "font/woff2"
};

const hasRequiredAdminRuntimeFiles = (paths: {
  staticRoot: string;
  bundleFile: string;
  runtimeIndexFile: string;
  runtimeAppFile: string;
}): boolean => {
  return (
    existsSync(paths.runtimeAppFile) &&
    existsSync(paths.staticRoot) &&
    existsSync(paths.bundleFile) &&
    existsSync(paths.runtimeIndexFile)
  );
};

const resolveRuntimeFilePath = (
  runtimeRoot: string,
  adminRuntimeIndexFile: string,
  adminStaticRoot: string,
  adminBundleFile: string,
  urlPath: string
): string | null => {
  const runtimeIndexFile = path.join(runtimeRoot, "index.htm");

  if (urlPath === "/" || urlPath === "/index.html") {
    return existsSync(runtimeIndexFile) ? runtimeIndexFile : adminRuntimeIndexFile;
  }

  if (urlPath === "/app.js") {
    return path.join(runtimeRoot, "app.js");
  }

  if (urlPath === "/static/app.js") {
    return adminBundleFile;
  }

  if (urlPath.startsWith("/static/")) {
    const candidatePath = path.resolve(adminStaticRoot, `.${urlPath.slice("/static".length)}`);
    const adminStaticRootPath = path.resolve(adminStaticRoot);
    if (
      candidatePath === adminStaticRootPath ||
      candidatePath.startsWith(`${adminStaticRootPath}${path.sep}`)
    ) {
      return candidatePath;
    }
  }

  if (path.extname(urlPath) === "") {
    return existsSync(runtimeIndexFile) ? runtimeIndexFile : adminRuntimeIndexFile;
  }

  return null;
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
  const runtimeRoot = path.join(projectRoot, ".atria", "runtime");
  const adminPackagePaths = resolveAdminPackagePaths();
  const adminStaticRoot = adminPackagePaths.staticRoot;
  const adminBundleFile = adminPackagePaths.bundleFile;
  const adminRuntimeIndexFile = adminPackagePaths.runtimeIndexFile;
  const adminStudioAppFile = adminPackagePaths.runtimeAppFile;
  const internalApiPort = adminPort + 1;
  const runtimeAppFile = path.join(runtimeRoot, "app.js");
  let internalApiServer: Server | null = null;

  if (!process.env.ATRIA_PROJECT_ID) {
    const projectId = await readProjectIdFromProjectConfig(projectRoot);
    if (projectId !== "") {
      process.env.ATRIA_PROJECT_ID = projectId;
    }
  }

  console.log(`${terminal.green("✔")} Checking configuration files...`);
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

    if (pathname === "/app.js" && !existsSync(runtimeAppFile)) {
      try {
        const content = await fs.readFile(adminStudioAppFile);
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/javascript; charset=utf-8");
        response.end(content);
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          response.statusCode = 404;
          response.end("Not Found");
          return;
        }

        response.statusCode = 500;
        response.end("Internal Server Error");
        return;
      }
    }

    const runtimeFilePath = resolveRuntimeFilePath(
      runtimeRoot,
      adminRuntimeIndexFile,
      adminStaticRoot,
      adminBundleFile,
      pathname
    );

    if (!runtimeFilePath) {
      response.statusCode = 404;
      response.end("Not Found");
      return;
    }

    try {
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

const resolveAdminPackagePaths = (): {
  staticRoot: string;
  bundleFile: string;
  runtimeIndexFile: string;
  runtimeAppFile: string;
} => {
  const require = createRequire(import.meta.url);
  const adminPackageJson = require.resolve("@atria/admin/package.json");
  const adminRoot = path.dirname(adminPackageJson);
  const buildCandidate = {
    staticRoot: path.join(adminRoot, "dist", "runtime", "static"),
    bundleFile: path.join(adminRoot, "dist", "app.js"),
    runtimeIndexFile: path.join(adminRoot, "dist", "runtime", "index.htm"),
    runtimeAppFile: path.join(adminRoot, "dist", "runtime", "app.js"),
  };
  const sourceCandidate = {
    staticRoot: path.join(adminRoot, "studio", "static"),
    bundleFile: path.join(adminRoot, "dist", "app.js"),
    runtimeIndexFile: path.join(adminRoot, "studio", "index.htm"),
    runtimeAppFile: path.join(adminRoot, "studio", "app.js"),
  };

  if (hasRequiredAdminRuntimeFiles(buildCandidate)) {
    return buildCandidate;
  }

  if (hasRequiredAdminRuntimeFiles(sourceCandidate)) {
    return sourceCandidate;
  }

  throw new Error(
    "Admin runtime not found in @atria/admin (expected runtime app.js, static assets and dist/app.js)."
  );
};

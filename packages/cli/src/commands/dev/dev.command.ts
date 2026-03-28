import { createServer } from "node:http";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseArgs } from "../../parseArgs.js";
import { terminal } from "../../terminal.js";

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

const mimeTypeByExtension: Record<string, string> = {
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

const resolveRuntimeFilePath = (
  runtimeRoot: string,
  adminStaticRoot: string,
  urlPath: string
): string | null => {
  if (urlPath === "/" || urlPath === "/index.html") {
    return path.join(runtimeRoot, "index.htm");
  }

  if (urlPath === "/app.js") {
    return path.join(runtimeRoot, "app.js");
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

  return null;
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
  const adminStaticRoot = resolveAdminStaticRoot();

  console.log(`${terminal.green("✔")} Checking configuration files...`);

  const server = createServer(async (request, response) => {
    const requestUrl = request.url ?? "/";
    const pathname = new URL(requestUrl, "http://localhost").pathname;
    const runtimeFilePath = resolveRuntimeFilePath(runtimeRoot, adminStaticRoot, pathname);

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
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

const resolveAdminStaticRoot = (): string => {
  const require = createRequire(import.meta.url);
  const adminPackageJson = require.resolve("@atria/admin/package.json");
  return path.join(path.dirname(adminPackageJson), "dist", "runtime", "static");
};

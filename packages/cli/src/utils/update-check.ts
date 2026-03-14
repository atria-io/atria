import { promises as fs } from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NPM_CLI_LATEST_URL = "https://registry.npmjs.org/@atria%2fcli/latest";
const FETCH_TIMEOUT_MS = 1200;

interface CliUpdateInfo {
  currentVersion: string;
  latestVersion: string;
}

interface PackageJsonLike {
  version?: unknown;
  dependencies?: unknown;
  devDependencies?: unknown;
}

interface NpmLatestPayload {
  version?: string;
}

const parseSemverCore = (value: string): [number, number, number] | null => {
  const normalized = value.trim().replace(/^v/, "");
  const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return [
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
    Number.parseInt(match[3], 10)
  ];
};

const compareSemver = (left: string, right: string): number => {
  const leftParts = parseSemverCore(left);
  const rightParts = parseSemverCore(right);

  if (!leftParts || !rightParts) {
    return 0;
  }

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }
    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }

  return 0;
};

const readJsonFile = async (filePath: string): Promise<PackageJsonLike | null> => {
  try {
    const rawContent = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(rawContent) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as PackageJsonLike;
    }
    return null;
  } catch {
    return null;
  }
};

const fetchLatestCliPayload = async (): Promise<NpmLatestPayload | null> =>
  new Promise((resolve) => {
    const request = https.get(NPM_CLI_LATEST_URL, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        response.resume();
        resolve(null);
        return;
      }

      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          const parsed = JSON.parse(body) as NpmLatestPayload;
          resolve(parsed);
        } catch {
          resolve(null);
        }
      });
    });

    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy();
      resolve(null);
    });

    request.on("error", () => {
      resolve(null);
    });
  });

const readCurrentCliVersion = async (): Promise<string | null> => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const packageJsonPath = path.resolve(path.dirname(currentFilePath), "../../package.json");
  const packageJson = await readJsonFile(packageJsonPath);

  if (typeof packageJson?.version !== "string") {
    return null;
  }

  return packageJson.version;
};

const hasDependency = (value: unknown, dependencyName: string): boolean => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return dependencyName in (value as Record<string, unknown>);
};

export const getCliUpdateInstallCommand = async (projectRoot: string): Promise<string> => {
  const projectPackage = await readJsonFile(path.join(projectRoot, "package.json"));

  if (
    hasDependency(projectPackage?.dependencies, "atria") ||
    hasDependency(projectPackage?.devDependencies, "atria")
  ) {
    return "npm install atria@latest";
  }

  return "npm install -D @atria/cli@latest";
};

export const checkForCliUpdate = async (): Promise<CliUpdateInfo | null> => {
  const [currentVersion, latestPayload] = await Promise.all([
    readCurrentCliVersion(),
    fetchLatestCliPayload()
  ]);

  if (!currentVersion || typeof latestPayload?.version !== "string") {
    return null;
  }

  if (compareSemver(latestPayload.version, currentVersion) <= 0) {
    return null;
  }

  return {
    currentVersion,
    latestVersion: latestPayload.version
  };
};

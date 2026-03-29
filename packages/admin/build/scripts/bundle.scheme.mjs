import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const TOKEN_MAP = {
  background: "--background",
  boot_track: "--boot-track",
  boot_spinner: "--boot-spinner",
  text: "--text",
  text_muted: "--text-muted",
};

const getPaths = (entryUrl) => {
  const entryDir = path.dirname(fileURLToPath(entryUrl));
  const packageRoot =
    path.basename(entryDir) === "scripts"
      ? path.resolve(entryDir, "..", "..")
      : path.resolve(entryDir, "..");

  const schemeCssFile = path.join(packageRoot, "studio", "static", "styles", "scheme.css");
  const outputFile = path.join(packageRoot, "studio", "static", "js", "scheme.js");

  return { schemeCssFile, outputFile };
};

const extractSchemeBlock = (css, scheme) => {
  const pattern = new RegExp(`\\[data-scheme="${scheme}"\\]\\s*\\{([\\s\\S]*?)\\}`, "m");
  const match = css.match(pattern);
  if (!match) {
    throw new Error(`Missing [data-scheme="${scheme}"] block in scheme.css`);
  }

  return match[1];
};

const extractTokens = (block, scheme) => {
  const tokens = {};

  for (const [tokenName, cssVariable] of Object.entries(TOKEN_MAP)) {
    const variablePattern = new RegExp(`${cssVariable}\\s*:\\s*([^;]+);`, "m");
    const match = block.match(variablePattern);
    if (!match) {
      throw new Error(`Missing ${cssVariable} in [data-scheme="${scheme}"] block`);
    }

    tokens[tokenName] = match[1].trim();
  }

  return tokens;
};

const buildRuntimeSource = (tokenMap) => `(() => {
  const TOKENS = ${JSON.stringify(tokenMap)};
  const STORAGE_KEY = "atria.scheme";
  const STYLE_ID = "atria-scheme";
  const VALID_MODES = new Set(["system", "light", "dark"]);

  const readStoredMode = () => {
    try {
      const value = localStorage.getItem(STORAGE_KEY) ?? "system";
      return VALID_MODES.has(value) ? value : "system";
    } catch {
      return "system";
    }
  };

  const resolveMode = (mode) => {
    if (mode !== "system") {
      return mode;
    }

    if (typeof window.matchMedia !== "function") {
      return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const ensureStyleElement = () => {
    let styleElement = document.getElementById(STYLE_ID);
    if (styleElement) {
      return styleElement;
    }

    styleElement = document.createElement("style");
    styleElement.id = STYLE_ID;
    document.head.appendChild(styleElement);
    return styleElement;
  };

  const toCss = (tokens) => \`:root{--background:\${tokens.background};--boot-track:\${tokens.boot_track};--boot-spinner:\${tokens.boot_spinner};--text:\${tokens.text};--text-muted:\${tokens.text_muted};}html,body{background:var(--background);color:var(--text);}\`;

  let mode = readStoredMode();
  let resolved = resolveMode(mode);

  const apply = () => {
    resolved = resolveMode(mode);
    const styleElement = ensureStyleElement();
    styleElement.textContent = toCss(TOKENS[resolved]);

    const rootApi = window.__atria__ ?? (window.__atria__ = {});
    rootApi.scheme = {
      get mode() {
        return mode;
      },
      get resolved() {
        return resolved;
      },
      setMode,
    };
  };

  function setMode(nextMode) {
    if (!VALID_MODES.has(nextMode)) {
      return;
    }

    mode = nextMode;

    try {
      localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {}

    apply();
  }

  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "system") {
        apply();
      }
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onChange);
    }
  }

  apply();
})();
`;

export const runSchemeBundle = async (entryUrl) => {
  const paths = getPaths(entryUrl);
  const source = await readFile(paths.schemeCssFile, "utf-8");

  const darkTokens = extractTokens(extractSchemeBlock(source, "dark"), "dark");
  const lightTokens = extractTokens(extractSchemeBlock(source, "light"), "light");
  const runtimeSource = buildRuntimeSource({ light: lightTokens, dark: darkTokens });

  await mkdir(path.dirname(paths.outputFile), { recursive: true });
  await writeFile(paths.outputFile, runtimeSource, "utf-8");
};


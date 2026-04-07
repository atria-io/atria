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

  const schemeCssFile = path.join(packageRoot, "boot", "static", "styles", "scheme.css");
  const outputFile = path.join(packageRoot, "boot", "static", "js", "scheme.js");

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

const buildRuntimeSource = (tokenMap) => `(() => {// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.
  const TOKENS = ${JSON.stringify(tokenMap)};
  const STORAGE_KEY = "atria:color-scheme";
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

  let resolved = resolveMode(readStoredMode());
  const subscribers = new Set();

  const notify = () => {
    for (const subscriber of subscribers) {
      try {
        subscriber(resolved);
      } catch {}
    }
  };

  const persistMode = (nextMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {}
  };

  const syncDomScheme = (nextScheme) => {
    const shellNodes = document.querySelectorAll(".admin-shell[data-scheme]");
    for (const shellNode of shellNodes) {
      if (shellNode.getAttribute("data-scheme") !== nextScheme) {
        shellNode.setAttribute("data-scheme", nextScheme);
      }
    }
  };

  const applyScheme = (nextScheme) => {
    if (nextScheme !== "light" && nextScheme !== "dark") {
      return;
    }

    resolved = nextScheme;
    const styleElement = ensureStyleElement();
    styleElement.textContent = toCss(TOKENS[resolved]);
    syncDomScheme(resolved);
    notify();
  };

  const refreshFromStorage = () => {
    applyScheme(resolveMode(readStoredMode()));
  };

  const rootApi = window.__atria__ ?? (window.__atria__ = {});
  rootApi.scheme = {
    get mode() {
      return readStoredMode();
    },
    get resolved() {
      refreshFromStorage();
      return resolved;
    },
    setMode,
    subscribe(onChange) {
      if (typeof onChange !== "function") {
        return;
      }

      subscribers.add(onChange);
      return () => {
        subscribers.delete(onChange);
      };
    },
  };

  if (typeof window.addEventListener === "function") {
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        refreshFromStorage();
      }
    });
  };

  function setMode(nextMode) {
    if (!VALID_MODES.has(nextMode)) {
      return;
    }

    persistMode(nextMode);
    refreshFromStorage();
  }

  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredMode() === "system") {
        refreshFromStorage();
      }
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onChange);
    }
  }

  const schemeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "attributes" || mutation.attributeName !== "data-scheme") {
        continue;
      }

      const target = mutation.target;
      if (!(target instanceof Element)) {
        continue;
      }

      const nextScheme = target.getAttribute("data-scheme");
      if (nextScheme === "light" || nextScheme === "dark") {
        persistMode(nextScheme);
        applyScheme(nextScheme);
      }
    }
  });

  schemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-scheme"],
    subtree: true,
  });

  refreshFromStorage();
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

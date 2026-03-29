(() => {
  const TOKENS = {"light":{"background":"#ffffff","boot_track":"#d7dde8","boot_spinner":"#1f2937","text":"#222222","text_muted":"#515870"},"dark":{"background":"#131319","boot_track":"#24252f","boot_spinner":"#8a8a8a","text":"#f3f4f6","text_muted":"#9ca3af"}};
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

  const toCss = (tokens) => `:root{--background:${tokens.background};--boot-track:${tokens.boot_track};--boot-spinner:${tokens.boot_spinner};--text:${tokens.text};--text-muted:${tokens.text_muted};}html,body{background:var(--background);color:var(--text);}`;

  let mode = readStoredMode();
  let resolved = resolveMode(mode);

  const applyScheme = (nextScheme) => {
    resolved = nextScheme;
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

    applyScheme(resolveMode(mode));
  }

  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "system") {
        applyScheme(resolveMode(mode));
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
        applyScheme(nextScheme);
      }
    }
  });

  schemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-scheme"],
    subtree: true,
  });

  applyScheme(resolveMode(mode));
})();

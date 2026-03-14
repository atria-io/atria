const CORE_STYLE_FILES = ["tokens.css", "scheme.css", "main.css"] as const;
const STYLE_ATTRIBUTE = "data-atria-admin-style";
const STYLE_LOADED_ATTRIBUTE = "data-atria-admin-style-loaded";

const normalizeBasePath = (basePath: string): string => {
  if (!basePath || basePath === "/") {
    return "/";
  }

  return basePath.endsWith("/") ? basePath : `${basePath}/`;
};

const styleHref = (basePath: string, styleFile: string): string => {
  return `${normalizeBasePath(basePath)}.atria/admin/styles/${styleFile}`;
};

const findStyleLink = (styleFile: string): HTMLLinkElement | null => {
  return document.querySelector(`link[${STYLE_ATTRIBUTE}="${styleFile}"]`);
};

const ensureStyleLink = (basePath: string, styleFile: string): HTMLLinkElement => {
  const href = styleHref(basePath, styleFile);
  const existing = findStyleLink(styleFile);

  if (existing) {
    if (existing.getAttribute("href") !== href) {
      existing.setAttribute("href", href);
      existing.removeAttribute(STYLE_LOADED_ATTRIBUTE);
    }

    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  link.setAttribute(STYLE_ATTRIBUTE, styleFile);
  link.removeAttribute(STYLE_LOADED_ATTRIBUTE);
  document.head.appendChild(link);
  return link;
};

const removeUnusedFeatureLinks = (featureStyleFiles: string[]): void => {
  const activeStyles = new Set(featureStyleFiles);
  const coreStyles = new Set<string>(CORE_STYLE_FILES);

  const links = Array.from(
    document.querySelectorAll<HTMLLinkElement>(`link[${STYLE_ATTRIBUTE}]`)
  );

  for (const link of links) {
    const styleFile = link.getAttribute(STYLE_ATTRIBUTE);
    if (!styleFile || coreStyles.has(styleFile)) {
      continue;
    }

    if (!activeStyles.has(styleFile)) {
      link.remove();
    }
  }
};

const waitForStyleLink = (link: HTMLLinkElement): Promise<void> => {
  if (link.getAttribute(STYLE_LOADED_ATTRIBUTE) === "true") {
    return Promise.resolve();
  }

  if (link.sheet) {
    link.setAttribute(STYLE_LOADED_ATTRIBUTE, "true");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const markLoaded = (): void => {
      link.setAttribute(STYLE_LOADED_ATTRIBUTE, "true");
      resolve();
    };

    link.addEventListener("load", markLoaded, { once: true });
    link.addEventListener("error", markLoaded, { once: true });
  });
};

export const applyRouteStyles = async (
  basePath: string,
  featureStyleFiles: string[]
): Promise<void> => {
  const requiredStyles = new Set<string>([...CORE_STYLE_FILES, ...featureStyleFiles]);
  const ensuredLinks: HTMLLinkElement[] = [];

  for (const styleFile of requiredStyles) {
    ensuredLinks.push(ensureStyleLink(basePath, styleFile));
  }

  removeUnusedFeatureLinks(featureStyleFiles);

  await Promise.all(ensuredLinks.map((link) => waitForStyleLink(link)));
};

const CORE_STYLE_FILES = ["styles/tokens.css", "styles/scheme.css", "styles/globals.css"] as const;

const styleLinks = new Map<string, HTMLLinkElement>();
const loadedLinks = new WeakSet<HTMLLinkElement>();

const normalizeBasePath = (basePath: string): string => {
  if (!basePath || basePath === "/") {
    return "/";
  }

  return basePath.endsWith("/") ? basePath : `${basePath}/`;
};

const styleHref = (basePath: string, stylePath: string): string => {
  return `${normalizeBasePath(basePath)}static/${stylePath}`;
};

const findExistingStyleLinkByHref = (href: string): HTMLLinkElement | null => {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

  for (const link of links) {
    const currentHref = link.getAttribute("href");
    if (!currentHref) {
      continue;
    }

    if (currentHref === href) {
      return link;
    }
  }

  return null;
};

const ensureStyleLink = (basePath: string, stylePath: string): HTMLLinkElement => {
  const href = styleHref(basePath, stylePath);
  const known = styleLinks.get(stylePath);

  if (known && known.isConnected) {
    if (known.getAttribute("href") !== href) {
      known.setAttribute("href", href);
      loadedLinks.delete(known);
    }

    known.removeAttribute("data-atria-admin-style");
    known.removeAttribute("data-atria-admin-style-loaded");
    return known;
  }

  const existing = findExistingStyleLinkByHref(href);
  if (existing) {
    existing.removeAttribute("data-atria-admin-style");
    existing.removeAttribute("data-atria-admin-style-loaded");
    styleLinks.set(stylePath, existing);
    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  document.head.appendChild(link);
  styleLinks.set(stylePath, link);
  return link;
};

const removeUnusedModuleLinks = (moduleStyleFiles: string[]): void => {
  const activeStyles = new Set(moduleStyleFiles);
  const coreStyles = new Set<string>(CORE_STYLE_FILES);

  for (const [stylePath, link] of styleLinks.entries()) {
    if (coreStyles.has(stylePath)) {
      continue;
    }

    if (activeStyles.has(stylePath)) {
      continue;
    }

    if (link.isConnected) {
      link.remove();
    }

    styleLinks.delete(stylePath);
  }
};

const waitForStyleLink = (link: HTMLLinkElement): Promise<void> => {
  if (loadedLinks.has(link)) {
    return Promise.resolve();
  }

  if (link.sheet) {
    loadedLinks.add(link);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const markLoaded = (): void => {
      loadedLinks.add(link);
      resolve();
    };

    link.addEventListener("load", markLoaded, { once: true });
    link.addEventListener("error", markLoaded, { once: true });
  });
};

export const applyRouteStyles = async (
  basePath: string,
  moduleStyleFiles: string[]
): Promise<void> => {
  const requiredStyles = new Set<string>([...CORE_STYLE_FILES, ...moduleStyleFiles]);
  const ensuredLinks: HTMLLinkElement[] = [];

  for (const stylePath of requiredStyles) {
    ensuredLinks.push(ensureStyleLink(basePath, stylePath));
  }

  removeUnusedModuleLinks(moduleStyleFiles);

  await Promise.all(ensuredLinks.map((link) => waitForStyleLink(link)));
};

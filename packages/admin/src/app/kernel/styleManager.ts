import { resolveBasePathUrl } from "../../state/api.client.js";

const styleLinks = new Map<string, HTMLLinkElement>();
const loadedLinks = new WeakSet<HTMLLinkElement>();
let latestApplyRequestId = 0;
const styleHref = (basePath: string, stylePath: string): string =>
  resolveBasePathUrl(basePath, `static/${stylePath}`);

const findStyleLinkByHref = (href: string): HTMLLinkElement | null => {
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

const placeStyleLink = (link: HTMLLinkElement): void => {
  const head = document.head;
  const schemeStyle = head.querySelector<HTMLStyleElement>("#atria-scheme");

  if (schemeStyle) {
    head.insertBefore(link, schemeStyle);
    return;
  }

  head.appendChild(link);
};

const ensureStyleLink = (basePath: string, stylePath: string): HTMLLinkElement => {
  const href = styleHref(basePath, stylePath);
  const known = styleLinks.get(stylePath);

  if (known && known.isConnected) {
    if (known.getAttribute("href") !== href) {
      known.setAttribute("href", href);
      loadedLinks.delete(known);
    }

    placeStyleLink(known);
    known.removeAttribute("data-atria-admin-style");
    known.removeAttribute("data-atria-admin-style-loaded");
    return known;
  }

  const existing = findStyleLinkByHref(href);
  if (existing) {
    placeStyleLink(existing);
    existing.removeAttribute("data-atria-admin-style");
    existing.removeAttribute("data-atria-admin-style-loaded");
    styleLinks.set(stylePath, existing);
    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  placeStyleLink(link);
  styleLinks.set(stylePath, link);
  return link;
};

const removeUnusedModuleLinks = (moduleStyleFiles: string[]): void => {
  const activeStyles = new Set(moduleStyleFiles);

  for (const [stylePath, link] of styleLinks.entries()) {
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

/**
 * Applies route-scoped styles atomically: mounts required links, removes stale ones and waits for load/error.
 * `latestApplyRequestId` guards against race conditions when navigation changes style sets quickly.
 *
 * @param {string} basePath
 * @param {string[]} moduleStyleFiles
 * @returns {Promise<void>}
 */
export const applyRouteStyles = async (
  basePath: string,
  moduleStyleFiles: string[]
): Promise<void> => {
  const applyRequestId = ++latestApplyRequestId;
  const requiredStyles = new Set<string>(moduleStyleFiles);
  const ensuredLinks: HTMLLinkElement[] = [];

  for (const stylePath of requiredStyles) {
    ensuredLinks.push(ensureStyleLink(basePath, stylePath));
  }

  if (applyRequestId !== latestApplyRequestId) {
    return;
  }

  removeUnusedModuleLinks(Array.from(requiredStyles));

  await Promise.all(ensuredLinks.map((link) => waitForStyleLink(link)));
};

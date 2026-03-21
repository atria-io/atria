import { readFileSync } from "node:fs";

export const READY_EVENT_NAME = "atria:studio:ready";
export const COLOR_SCHEME_STORAGE_KEY = "atria:color-scheme";

const runtimeIndexTemplate = readFileSync(new URL("./index.htm", import.meta.url), "utf-8");

export const runtimeIndexHtml = runtimeIndexTemplate
  .replaceAll("__COLOR_SCHEME_STORAGE_KEY__", COLOR_SCHEME_STORAGE_KEY);

export const runtimeAppJs = `// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.
import { mountAdminApp } from "/static/app.js";

const rootElement = document.getElementById("atria");
const bootElement = document.getElementById("atria-boot");
const BOOT_REVEAL_DELAY_MS = 150;
let hasRevealedApp = false;
const bootRevealTimeoutId = window.setTimeout(() => {
  if (!hasRevealedApp && bootElement) {
    bootElement.classList.add("is-visible");
  }
}, BOOT_REVEAL_DELAY_MS);

const revealApp = () => {
  if (hasRevealedApp) {
    return;
  }

  hasRevealedApp = true;
  window.clearTimeout(bootRevealTimeoutId);

  if (bootElement) {
    bootElement.classList.remove("is-visible");
    bootElement.classList.add("is-hidden");
  }
  setTimeout(() => {
    if (bootElement) {
      bootElement.remove();
    }
  }, 500);
};

window.addEventListener("${READY_EVENT_NAME}", revealApp, { once: true });
window.setTimeout(revealApp, 5000);

mountAdminApp({
  mountElement: rootElement,
  basePath: "/",
  reactStrictMode: false
});
`;

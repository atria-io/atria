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

const revealApp = () => {
  if (bootElement) {
    bootElement.classList.add("is-hidden");
    window.setTimeout(() => {
      bootElement.remove();
    }, 220);
  }
};

window.addEventListener("${READY_EVENT_NAME}", revealApp, { once: true });
window.setTimeout(revealApp, 5000);

mountAdminApp({
  mountElement: rootElement,
  basePath: "/",
  reactStrictMode: false
});
`;

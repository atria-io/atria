// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.

import { mountAdminApp } from "/static/app.js";

const rootElement = document.getElementById("atria");

const readInitialBootstrap = async () => {
  try {
    const response = await fetch("/api/state", { method: "GET" });
    return {
      ok: response.ok,
      payload: response.ok ? await response.json() : undefined
    };
  } catch {
    return {
      ok: false,
      failed: "network",
      online: window.navigator.onLine
    };
  }
};

void (async () => {
  const initialBootstrap = await readInitialBootstrap();
  mountAdminApp({
    mountElement: rootElement,
    basePath: "/",
    reactStrictMode: false,
    initialBootstrap
  });
})();

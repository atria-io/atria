// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.

import { mountAdminApp } from "/static/app.js";

const rootElement = document.getElementById("atria");

const readAuthenticatedInitialAppState = async () => {
  try {
    const response = await fetch("/admin/bootstrap", { method: "GET" });
    if (!response.ok) {
      return undefined;
    }

    const payload = await response.json();
    if (payload?.state !== "authenticated") {
      return undefined;
    }

    const user = payload.user;
    if (
      !user ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      typeof user.avatarUrl !== "string" ||
      typeof user.role !== "string"
    ) {
      return undefined;
    }

    return {
      realm: "studio",
      screen: "dashboard",
      user
    };
  } catch {
    return undefined;
  }
};

void (async () => {
  const initialAppState = await readAuthenticatedInitialAppState();
  mountAdminApp({
    mountElement: rootElement,
    basePath: "/",
    reactStrictMode: false,
    initialAppState
  });
})();

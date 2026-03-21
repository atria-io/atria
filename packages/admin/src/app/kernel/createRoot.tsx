import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminApp } from "../App.js";

export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
}

export const mountAdminApp = (options: MountAdminOptions = {}): void => {
  const mountElement = options.mountElement ?? document.getElementById("atria");

  if (!mountElement) {
    return;
  }

  const basePath = options.basePath ?? "/";
  const root = createRoot(mountElement);
  const app = <AdminApp basePath={basePath} />;

  if (options.reactStrictMode === true) {
    root.render(<StrictMode>{app}</StrictMode>);
    return;
  }

  root.render(app);
};

export const mountStudioApp = mountAdminApp;

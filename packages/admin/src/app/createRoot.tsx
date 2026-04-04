import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminApp } from "../App.js";
import type { AppState } from "./runtime/runtimeTypes.js";

export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
  initialAppState?: AppState;
}

export const mountAdminApp = (options: MountAdminOptions = {}): void => {
  const mountElement = options.mountElement ?? document.getElementById("atria");

  if (!mountElement) {
    return;
  }

  const basePath = options.basePath ?? "/";
  const root = createRoot(mountElement);
  const app = <AdminApp basePath={basePath} initialAppState={options.initialAppState} />;

  if (options.reactStrictMode === true) {
    root.render(<StrictMode>{app}</StrictMode>);
    return;
  }

  root.render(app);
};

export const mountStudioApp = mountAdminApp;

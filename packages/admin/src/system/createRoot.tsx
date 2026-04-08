import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { AppState } from "./runtimeTypes.js";
import type { InitialBootstrapSnapshot } from "./state/getAppState.js";
import { resolveInitialAppState } from "./state/getAppState.js";
import { AdminApp } from "../App.js";

export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
  initialAppState?: AppState;
  initialBootstrap?: InitialBootstrapSnapshot;
}

export const mountAdminApp = (options: MountAdminOptions = {}): void => {
  const mountElement = options.mountElement ?? document.getElementById("atria");

  if (!mountElement) {
    return;
  }

  const basePath = options.basePath ?? "/";
  const root = createRoot(mountElement);
  const initialAppState =
    options.initialBootstrap !== undefined
      ? resolveInitialAppState(options.initialBootstrap)
      : options.initialAppState;
  const app = <AdminApp basePath={basePath} initialAppState={initialAppState} />;

  if (options.reactStrictMode === true) {
    root.render(<StrictMode>{app}</StrictMode>);
    return;
  }

  root.render(app);
};

export const mountStudioApp = mountAdminApp;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { AppState } from "./appState.js";
import type { BootSnapshot } from "./state/getAppState.js";
import { resolveBootState } from "./state/getAppState.js";
import { App } from "../App.js";

export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
  initialAppState?: AppState;
  initialBootstrap?: BootSnapshot;
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
      ? resolveBootState(options.initialBootstrap, basePath)
      : options.initialAppState;
  const app = <App basePath={basePath} initialAppState={initialAppState} />;

  if (options.reactStrictMode === true) {
    root.render(<StrictMode>{app}</StrictMode>);
    return;
  }

  root.render(app);
};

export const mountStudioApp = mountAdminApp;

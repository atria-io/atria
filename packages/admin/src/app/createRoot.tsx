import * as React from "react";
import { createRoot as createReactRoot } from "react-dom/client";
import type { AppState } from "./system/state/app.state.js";
import type { BootSnapshot } from "./system/state/fetch.app.state.js";
import { resolveBootState } from "./system/state/fetch.app.state.js";
import { App } from "./App.js";

export interface AdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
  initialAppState?: AppState;
  initialBootstrap?: BootSnapshot;
}

export const createRoot = (
  options: AdminOptions = {}
): void => {
  const mountElement = options.mountElement ?? document.getElementById("atria");

  if (!mountElement) {
    return;
  }

  const basePath = options.basePath ?? "/";
  const root = createReactRoot(mountElement);
  const initialAppState =
    options.initialBootstrap !== undefined
      ? resolveBootState(options.initialBootstrap, basePath)
      : options.initialAppState;

  const app = <App basePath={basePath} initialAppState={initialAppState} />;

  if (options.reactStrictMode === true) {
    root.render(<React.StrictMode>{app}</React.StrictMode>);
    return;
  }

  root.render(app);
};

export const AdminApp = createRoot;

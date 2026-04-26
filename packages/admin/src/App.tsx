import type { AppState } from "./system/appState.js";
import { useSchemeState } from "./system/hooks/useSchemeState.js";
import { useAppState } from "./system/state/useAppState.js";

import { Router } from "./runtime/Router.js";

export interface AppProps {
  basePath: string;
  initialAppState?: AppState;
}

export const App = ({ basePath, initialAppState }: AppProps) => {
  const appState = useAppState(basePath, initialAppState);
  const resolved = useSchemeState();

  if (!appState) {
    return null;
  }

  return (
    <div className="admin-shell" data-scheme={resolved}>
      <Router appState={appState} />
    </div>
  );
};

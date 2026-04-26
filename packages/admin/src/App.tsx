import type { AppState } from "./system/appState.js";
import { useScheme } from "./system/hooks/useScheme.js";
import { useAppState } from "./system/state/useAppState.js";

import { Router } from "./runtime/Router.js";

export interface AppProps {
  basePath: string;
  initialAppState?: AppState;
}

export const App = ({ basePath, initialAppState }: AppProps) => {
  const appState = useAppState(basePath, initialAppState);
  const resolved = useScheme();

  if (!appState) {
    return null;
  }

  return (
    <div className="admin-shell" data-scheme={resolved}>
      <Router appState={appState} />
    </div>
  );
};

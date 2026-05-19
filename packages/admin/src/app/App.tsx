import type { AppState } from "./system/state/app.state.js";
import { useSchemeState } from "./system/services/scheme/use.scheme.state.js";
import { useAppState } from "./system/state/use.app.state.js";
import { Shell } from "./Shell.js";

export interface AppProps {
  basePath: string;
  initialAppState?: AppState;
}

export const App = (
  { basePath, initialAppState }: AppProps
) => {
  const appState = useAppState(basePath, initialAppState);
  const resolved = useSchemeState();

  if (!appState) {
    return null;
  }

  return (
    <div className="admin-shell" data-scheme={resolved}>
      <Shell appState={appState} />
    </div>
  );
};

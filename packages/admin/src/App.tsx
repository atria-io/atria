import type { AppState } from "./system/runtimeTypes.js";
import { useRuntimeScheme } from "./system/runtimeScheme.js";
import { useAppState } from "./system/state/useAppState.js";
import { Router } from "./runtime/Router.js";

export interface AdminAppProps {
  basePath: string;
  initialAppState?: AppState;
}

export const AdminApp = ({ basePath, initialAppState }: AdminAppProps) => {
  const appState = useAppState(basePath, initialAppState);
  const resolved = useRuntimeScheme();
  if (!appState) {
    return null;
  }

  return (
    <div className="admin-shell" data-scheme={resolved}>
      <Router appState={appState} />
    </div>
  );
};

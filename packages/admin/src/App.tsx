import { useAppState } from "./app/state/useAppState.js";
import { StudioShell } from "./app/shell/StudioShell.js";
import { AuthShell } from "./app/shell/AuthShell.js";
import { CriticalShell } from "./app/shell/CriticalShell.js";
import type { AppState } from "./app/runtime/runtimeTypes.js";

export interface AdminAppProps {
  basePath: string;
  initialAppState?: AppState;
}

export const AdminApp = ({ basePath, initialAppState }: AdminAppProps) => {
  const appState = useAppState(basePath, initialAppState);
  if (!appState) {
    return null;
  }

  if (appState.realm === "critical") {
    return <CriticalShell screen={appState.screen} />;
  }

  if (appState.realm === "studio") {
    return <StudioShell screen={appState.screen} user={appState.user} />;
  }

  return <AuthShell screen={appState.screen} />;
};

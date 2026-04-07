import type { AppState } from "./system/runtime/runtimeTypes.js";
import { useAppState } from "./system/state/useAppState.js";
import { AuthShell } from "./shell/AuthShell.js";
import { StudioShell } from "./shell/StudioShell.js";
import { CriticalShell } from "./shell/CriticalShell.js";

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

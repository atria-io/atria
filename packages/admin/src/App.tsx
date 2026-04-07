import type { AppState } from "./system/runtime/runtimeTypes.js";
import { useAppState } from "./system/state/useAppState.js";
import { AuthShell } from "./realms/auth/AuthShell.js";
import { StudioShell } from "./realms/studio/StudioShell.js";
import { CriticalShell } from "./realms/critical/CriticalShell.js";

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

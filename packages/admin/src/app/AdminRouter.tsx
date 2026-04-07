import type { AppState } from "../system/runtime/runtimeTypes.js";
import { AuthShell } from "./AuthShell.js";
import { StudioShell } from "./StudioShell.js";
import { CriticalShell } from "./CriticalShell.js";

export interface AdminRouterProps {
  appState: AppState;
}

export const AdminRouter = ({ appState }: AdminRouterProps) => {
  if (appState.realm === "critical") {
    return <CriticalShell screen={appState.screen} />;
  }

  if (appState.realm === "studio") {
    return <StudioShell screen={appState.screen} user={appState.user} />;
  }

  return <AuthShell screen={appState.screen} />;
};

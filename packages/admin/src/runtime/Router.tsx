import type { AppState } from "../system/runtimeTypes.js";
import { AuthShell } from "./auth/AuthShell.js";
import { StudioShell } from "./studio/StudioShell.js";
import { CriticalShell } from "./critical/CriticalShell.js";

export interface RouterProps {
  appState: AppState;
}

export const AdminRouter = ({ appState }: RouterProps) => {
  if (appState.realm === "critical") {
    return <CriticalShell screen={appState.screen} />;
  }

  if (appState.realm === "studio") {
    return <StudioShell screen={appState.screen} user={appState.user} />;
  }

  return <AuthShell screen={appState.screen} />;
};

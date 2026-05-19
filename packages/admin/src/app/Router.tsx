import type { AppState } from "../system/appState.js";
import { Shell as AuthShell } from "./domains/auth/Shell.js";
import { Shell as StudioShell } from "./domains/studio/Shell.js";
import { Shell as CriticalShell } from "./domains/critical/Shell.js";

export interface RouterProps {
  appState: AppState;
}

export const Router = ({ appState }: RouterProps) => {
  if (appState.realm === "critical") {
    return <CriticalShell screen={appState.screen} />;
  }

  if (appState.realm === "studio") {
    return <StudioShell screen={appState.screen} user={appState.user} />;
  }

  return <AuthShell screen={appState.screen} />;
};

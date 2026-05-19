import type { AppState } from "./system/state/app.state.js";
import { Shell as AuthShell } from "./realms/auth/index.js";
import { Shell as StudioShell } from "./realms/studio/index.js";
import { Shell as CriticalShell } from "./realms/critical/index.js";

export interface ShellProps {
  appState: AppState;
}

export const Shell = (
  { appState }: ShellProps
) => {
  return appState.realm === "critical" ? (
    <CriticalShell screen={appState.screen} />
  ) : appState.realm === "studio" ? (
    <StudioShell screen={appState.screen} user={appState.user} />
  ) : (
    <AuthShell screen={appState.screen} />
  );
};

import { StudioShell } from "./app/shell/StudioShell.js";
import { AuthShell } from "./app/shell/AuthShell.js";
import { useBootstrapState } from "./app/bootstrap/useBootstrapState.js";
import { CriticalShell } from "./app/shell/CriticalShell.js";

export interface AdminAppProps {
  basePath: string;
}

export const AdminApp = ({ basePath }: AdminAppProps) => {
  const appState = useBootstrapState(basePath);

  if (appState.realm === "critical") {
    return <CriticalShell screen={appState.screen} />;
  }

  if (appState.realm === "studio") {
    return <StudioShell screen={appState.screen} user={appState.user} />;
  }

  return <AuthShell screen={appState.screen} />;
};

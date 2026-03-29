import { StudioShell } from "./app/shell/StudioShell.js";
import { AuthShell } from "./app/shell/AuthShell.js";
import { useBootstrapState } from "./app/bootstrap/useBootstrapState.js";
import { Auth } from "./modules/auth/Auth.js";
import type { AuthState } from "./modules/auth/auth.types.js";

export interface AdminAppProps {
  basePath: string;
}

export const AdminApp = ({ basePath }: AdminAppProps) => {
  const bootstrap = useBootstrapState(basePath);
  const state = bootstrap.state;

  const handleLogout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  if (state === "authenticated") {
    if (!bootstrap.user) {
      return null;
    }

    return (
      <StudioShell route="dashboard" user={bootstrap.user} onLogout={() => void handleLogout()}>
        <div>Dashboard</div>
      </StudioShell>
    );
  }

  return (
    <AuthShell route={state as AuthState}>
      <Auth state={state as AuthState} />
    </AuthShell>
  );
};

import { useEffect, useState } from "react";
import { StudioShell } from "./app/shell/StudioShell.js";
import { AuthShell } from "./app/shell/AuthShell.js";
import { getBootstrapState, type BootstrapState } from "./app/bootstrap/getBootstrapState.js";
import { Auth } from "./modules/auth/Auth.js";
import type { AuthState } from "./modules/auth/auth.types.js";

export interface AdminAppProps {
  basePath: string;
}

export const AdminApp = ({ basePath }: AdminAppProps) => {
  const [state, setState] = useState<BootstrapState>("setup");

  const handleLogout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const result = await getBootstrapState(basePath);
      if (isActive) {
        setState(result.state);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [basePath]);

  if (state === "authenticated") {
    return (
      <StudioShell>
        <div>
          <div>Dashboard</div>
          <button type="button" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>
      </StudioShell>
    );
  }

  return (
    <AuthShell route={state as AuthState}>
      <Auth state={state as AuthState} />
    </AuthShell>
  );
};

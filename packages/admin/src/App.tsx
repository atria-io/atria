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
      <StudioShell route="dashboard">
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

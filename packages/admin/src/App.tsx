import { StudioShell } from "./app/shell/StudioShell.js";
import { getBootstrapState } from "./app/runtime/bootstrapState.js";
import { Auth } from "./modules/auth/Auth.js";
import type { AuthState } from "./modules/auth/auth.types.js";

export interface AdminAppProps {
  basePath: string;
}

export const AdminApp = ({ basePath }: AdminAppProps) => {
  const state = getBootstrapState(basePath);

  if (state === "authenticated") {
    return (
      <StudioShell route="dashboard">
        <div>Dashboard</div>
      </StudioShell>
    );
  }

  return <Auth state={state as AuthState} />;
};

import { StudioShell } from "./app/shell/StudioShell.js";
import { Auth } from "./modules/auth/Auth.js";
import type { AuthState } from "./modules/auth/auth.types.js";

export interface AdminAppProps {
  basePath: string;
}

type BootstrapState = "setup" | "create" | "login" | "authenticated";

const getBootstrapState = (_basePath: string): BootstrapState => "setup";

export const AdminApp = ({ basePath }: AdminAppProps) => {
  const state = getBootstrapState(basePath);

  if (state === "authenticated") {
    return (
      <StudioShell>
        <div>Dashboard</div>
      </StudioShell>
    );
  }

  return (
    <StudioShell>
      <Auth state={state as AuthState} />
    </StudioShell>
  );
};

import { Auth } from "../../modules/auth/Auth.js";
import type { AuthState } from "../../modules/auth/auth.types.js";
import { useRuntimeScheme } from "../runtime/runtimeScheme.js";

export interface AuthShellProps {
  screen: AuthState;
}

export const AuthShell = ({ screen }: AuthShellProps) => {
  const resolved = useRuntimeScheme();

  return (
    <div className="admin-shell" data-route={screen} data-scheme={resolved}>
      <main className="admin-shell__main">
        <section className="auth-screen">
          <Auth state={screen} />
        </section>
      </main>
    </div>
  );
};

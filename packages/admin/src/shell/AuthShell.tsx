import { Auth } from "../realms/auth/Auth.js";
import type { AuthScreen } from "../system/runtime/runtimeTypes.js";
import { useRuntimeScheme } from "../system/runtime/runtimeScheme.js";

export interface AuthShellProps {
  screen: AuthScreen;
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

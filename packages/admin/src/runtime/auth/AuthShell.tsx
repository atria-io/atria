import { AuthScreen } from "./AuthScreen.js";
import type { AuthState } from "./Auth.types.js";

export interface AuthShellProps {
  screen: AuthState;
}

export const AuthShell = ({ screen }: AuthShellProps) => {
  return (
    <main className="admin-shell__main">
      <section className="auth-screen">
        <AuthScreen state={screen} />
      </section>
    </main>
  );
};

import type { AuthState } from "./AuthTypes.js";
import { AuthScreen } from "./AuthScreen.js";

export interface AuthShellProps {
  screen: AuthState;
}

export const AuthShell = ({ screen }: AuthShellProps) => {
  return (
    <main className="admin-main">
      <section className="auth-screen">
        <AuthScreen state={screen} />
      </section>
    </main>
  );
};

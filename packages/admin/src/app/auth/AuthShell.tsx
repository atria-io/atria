import { AuthScreen } from "./AuthScreen.js";
import type { AuthScreen as AuthStateScreen } from "../../system/runtime/runtimeTypes.js";

export interface AuthShellProps {
  screen: AuthStateScreen;
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

import { Auth } from "./Auth.js";
import type { AuthScreen } from "../../system/runtime/runtimeTypes.js";

export interface AuthShellProps {
  screen: AuthScreen;
}

export const AuthShell = ({ screen }: AuthShellProps) => {
  return (
    <main className="admin-shell__main">
      <section className="auth-screen">
        <Auth state={screen} />
      </section>
    </main>
  );
};

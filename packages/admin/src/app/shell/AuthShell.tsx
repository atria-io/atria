import type { ReactNode } from "react";
import { useRuntimeScheme } from "../runtime/useRuntimeScheme.js";

export interface AuthShellProps {
  route: "setup" | "create" | "login";
  children: ReactNode;
}

export const AuthShell = ({ route, children }: AuthShellProps) => {
  const resolved = useRuntimeScheme();

  return (
    <div className="admin-shell" data-route={route} data-scheme={resolved}>
      <main className="admin-shell__main">
        <section className="auth-screen">{children}</section>
      </main>
    </div>
  );
};

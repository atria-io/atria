import type { ReactNode } from "react";

export interface AuthShellProps {
  route: "setup" | "create" | "login";
  children: ReactNode;
}

export const AuthShell = ({ route, children }: AuthShellProps) => (
  <div className="admin-shell" data-route={route} data-scheme="light">
    <main className="admin-shell__main">{children}</main>
  </div>
);

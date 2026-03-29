import type { ReactNode } from "react";

export interface AuthShellProps {
  route: "setup" | "create" | "login";
  children: ReactNode;
}

export const AuthShell = ({ route, children }: AuthShellProps) => (
  <div className="admin-auth" data-route={route} data-scheme="light">
    <main className="admin-auth__main">{children}</main>
  </div>
);

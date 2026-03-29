import type { ReactNode } from "react";

export interface StudioShellProps {
  route: string;
  children: ReactNode;
}

export const StudioShell = ({ route, children }: StudioShellProps) => (
  <div className="admin-shell" data-route={route} data-scheme="light">
    <main className="admin-shell__main">{children}</main>
  </div>
);

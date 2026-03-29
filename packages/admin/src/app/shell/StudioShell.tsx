import type { ReactNode } from "react";

export interface StudioShellProps {
  children: ReactNode;
}

export const StudioShell = ({ children }: StudioShellProps) => (
  <div className="admin-shell">
    <main className="admin-shell__main">{children}</main>
  </div>
);

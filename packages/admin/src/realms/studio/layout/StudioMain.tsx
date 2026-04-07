import type { ReactNode } from "react";

export interface StudioMainProps {
  children: ReactNode;
}

export const StudioMain = ({ children }: StudioMainProps) => (
  <main className="admin-shell__main">{children}</main>
);

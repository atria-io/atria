import type { ReactNode } from "react";
import { StudioMain } from "./layout/StudioMain.js";
import { StudioHeader } from "./layout/sections/StudioHeader.js";

export interface StudioShellProps {
  onLogout: () => void;
  children: ReactNode;
}

export const StudioShell = ({ onLogout, children }: StudioShellProps) => (
  <div className="admin-shell">
    <StudioHeader onLogout={onLogout} />
    <StudioMain>{children}</StudioMain>
  </div>
);

import type { ReactNode } from "react";
import { StudioMain } from "./layout/StudioMain.js";
import { StudioHeader } from "./layout/sections/StudioHeader.js";

export interface StudioShellProps {
  children: ReactNode;
}

export const StudioShell = ({ children }: StudioShellProps) => (
  <div className="admin-shell">
    <StudioHeader />
    <StudioMain>{children}</StudioMain>
  </div>
);

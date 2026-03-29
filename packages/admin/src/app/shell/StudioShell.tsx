import type { ReactNode } from "react";
import type { BootstrapUserSummary } from "../bootstrap/getBootstrapState.js";
import { StudioMain } from "./layout/StudioMain.js";
import { StudioHeader } from "./layout/sections/StudioHeader.js";

export interface StudioShellProps {
  user: BootstrapUserSummary;
  onLogout: () => void;
  children: ReactNode;
}

export const StudioShell = ({ user, onLogout, children }: StudioShellProps) => (
  <div className="admin-shell">
    <StudioHeader user={user} onLogout={onLogout} />
    <StudioMain>{children}</StudioMain>
  </div>
);

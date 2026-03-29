import type { ReactNode } from "react";
import type { BootstrapUserSummary } from "../bootstrap/getBootstrapState.js";
import { useRuntimeScheme } from "../runtime/useRuntimeScheme.js";
import { StudioMain } from "./layout/StudioMain.js";
import { StudioHeader } from "./layout/sections/StudioHeader.js";

export interface StudioShellProps {
  route: string;
  user: BootstrapUserSummary;
  onLogout: () => void;
  children: ReactNode;
}

export const StudioShell = ({ route, user, onLogout, children }: StudioShellProps) => {
  const resolved = useRuntimeScheme();

  return (
    <div className="admin-shell" data-route={route} data-scheme={resolved}>
      <StudioHeader user={user} onLogout={onLogout} />
      <StudioMain>{children}</StudioMain>
    </div>
  );
};

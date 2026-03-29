import { useEffect, useRef, type ReactNode } from "react";
import type { BootstrapUserSummary } from "../bootstrap/getBootstrapState.js";
import { StudioMain } from "./layout/StudioMain.js";
import { StudioHeader } from "./layout/sections/StudioHeader.js";

export interface StudioShellProps {
  route: string;
  user: BootstrapUserSummary;
  onLogout: () => void;
  children: ReactNode;
}

export const StudioShell = ({ route, user, onLogout, children }: StudioShellProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resolved = (window as Window & { __atria__?: { scheme?: { resolved?: string } } })
      .__atria__?.scheme?.resolved;

    if (resolved === "light" || resolved === "dark") {
      rootRef.current?.setAttribute("data-scheme", resolved);
    }
  }, []);

  return (
    <div ref={rootRef} className="admin-shell" data-route={route} data-scheme="light">
      <StudioHeader user={user} onLogout={onLogout} />
      <StudioMain>{children}</StudioMain>
    </div>
  );
};

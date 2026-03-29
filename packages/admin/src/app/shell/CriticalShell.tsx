import type { ReactNode } from "react";
import { useRuntimeScheme } from "../runtime/useRuntimeScheme.js";

export interface CriticalShellProps {
  children: ReactNode;
}

export const CriticalShell = ({ children }: CriticalShellProps) => {
  const resolved = useRuntimeScheme();

  return (
    <div className="admin-shell" data-route="critical" data-scheme={resolved}>
      <main className="admin-shell__main">{children}</main>
    </div>
  );
};

import { useRuntimeScheme } from "../runtime/useRuntimeScheme.js";
import type { RuntimeCriticalState } from "../runtime/runtimeFatal.js";
import { CriticalScreen } from "./screens/CriticalScreen.js";
import { OfflineScreen } from "./screens/OfflineScreen.js";
import { ServerDownScreen } from "./screens/ServerDownScreen.js";

export interface CriticalShellProps {
  runtimeState: RuntimeCriticalState;
}

export const CriticalShell = ({ runtimeState }: CriticalShellProps) => {
  const resolved = useRuntimeScheme();

  const screen =
    runtimeState.kind === "offline" ? (
      <OfflineScreen />
    ) : runtimeState.kind === "server-down" ? (
      <ServerDownScreen />
    ) : (
      <CriticalScreen message={runtimeState.message} />
    );

  return (
    <div className="admin-shell" data-route="critical" data-scheme={resolved}>
      <main className="admin-shell__main">{screen}</main>
    </div>
  );
};

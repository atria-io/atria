import type { CriticalScreen as CriticalRealmScreen } from "../../system/runtime/runtimeTypes.js";
import { useRuntimeScheme } from "../../system/runtime/runtimeScheme.js";
import { CriticalScreen } from "./screens/CriticalScreen.js";
import { OfflineScreen } from "./screens/OfflineScreen.js";
import { ServerDownScreen } from "./screens/ServerDownScreen.js";

export interface CriticalShellProps {
  screen: CriticalRealmScreen;
}

export const CriticalShell = ({ screen }: CriticalShellProps) => {
  const resolved = useRuntimeScheme();

  const content =
    screen === "offline" ? (
      <OfflineScreen />
    ) : screen === "server-down" ? (
      <ServerDownScreen />
    ) : (
      <CriticalScreen message="Runtime failed. Retry to continue." />
    );

  return (
    <div className="admin-shell" data-route="critical" data-scheme={resolved}>
      <main className="admin-shell__main">{content}</main>
    </div>
  );
};

import type { CriticalScreen as CriticalRealmScreen } from "../runtime/runtimeTypes.js";
import { useRuntimeScheme } from "../runtime/runtimeScheme.js";
import { CriticalScreen } from "./screens/CriticalScreen.js";
import { OfflineScreen } from "./screens/OfflineScreen.js";
import { ServerDownScreen } from "./screens/ServerDownScreen.js";

export interface CriticalShellProps {
  screen: CriticalRealmScreen;
}

export const CriticalShell = ({ screen }: CriticalShellProps) => {
  const resolved = useRuntimeScheme();

  const content =
    screen.kind === "offline" ? (
      <OfflineScreen />
    ) : screen.kind === "server-down" ? (
      <ServerDownScreen />
    ) : (
      <CriticalScreen message={screen.message} />
    );

  return (
    <div className="admin-shell" data-route="critical" data-scheme={resolved}>
      <main className="admin-shell__main">{content}</main>
    </div>
  );
};

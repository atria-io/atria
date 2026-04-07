import type { CriticalScreen as CriticalRealmScreen } from "../system/runtime/runtimeTypes.js";
import { CriticalScreen } from "./critical/screens/CriticalScreen.js";
import { OfflineScreen } from "./critical/screens/OfflineScreen.js";
import { ServerDownScreen } from "./critical/screens/ServerDownScreen.js";

export interface CriticalShellProps {
  screen: CriticalRealmScreen;
}

export const CriticalShell = ({ screen }: CriticalShellProps) => {
  const content =
    screen === "offline" ? (
      <OfflineScreen />
    ) : screen === "server-down" ? (
      <ServerDownScreen />
    ) : (
      <CriticalScreen message="Runtime failed. Retry to continue." />
    );

  return <main className="admin-shell__main">{content}</main>;
};

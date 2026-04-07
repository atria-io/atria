import type { CriticalScreen as CriticalRealmScreen } from "../../system/runtimeTypes.js";
import { CriticalScreen } from "./CriticalScreen.js";
import { OfflineScreen } from "./OfflineScreen.js";
import { ServerDownScreen } from "./ServerDownScreen.js";

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

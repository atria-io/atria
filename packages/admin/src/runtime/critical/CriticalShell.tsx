import type { CriticalScreen as CriticalRealmScreen } from "../../system/runtimeTypes.js";
import { CriticalScreen } from "./CriticalScreen.js";

export interface CriticalShellProps {
  screen: CriticalRealmScreen;
}

export const CriticalShell = ({ screen }: CriticalShellProps) => {
  return (
    <main className="admin-shell__main">
      <CriticalScreen screen={screen} />
    </main>
  );
};

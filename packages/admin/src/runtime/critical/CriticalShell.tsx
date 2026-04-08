import type { CriticalScreen as CriticalScreenState } from "./Critical.types.js";
import { CriticalScreen } from "./CriticalScreen.js";

export interface CriticalShellProps {
  screen: CriticalScreenState;
}

export const CriticalShell = ({ screen }: CriticalShellProps) => {
  return (
    <main className="admin-shell__main">
      <CriticalScreen screen={screen} />
    </main>
  );
};

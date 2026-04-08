import { CriticalScreen } from "./CriticalScreen.js";
import type { CriticalState } from "./Critical.types.js";

export interface CriticalShellProps {
  screen: CriticalState;
}

export const CriticalShell = ({ screen }: CriticalShellProps) => {
  return (
    <main className="admin-shell__main">
      <CriticalScreen state={screen} />
    </main>
  );
};

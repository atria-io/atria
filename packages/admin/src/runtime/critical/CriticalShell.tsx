import type { CriticalState } from "./CriticalTypes.js";
import { CriticalScreen } from "./CriticalScreen.js";

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

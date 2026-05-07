import type { State } from "./types.js";
import { Screen } from "./Screen.js";

export interface ShellProps {
  screen: State;
}

export const Shell = (
  { screen }: ShellProps
) => {
  return (
    <main className="admin-main">
      <Screen state={screen} />
    </main>
  );
};

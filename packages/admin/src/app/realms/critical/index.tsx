import type { State } from "./model/critical.types.js";
import { Screen } from "./route/index.js";

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

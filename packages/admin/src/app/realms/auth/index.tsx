import type { State } from "./model/auth.types.js";
import { Screen } from "./route/index.js";

export interface ShellProps {
  screen: State;
}

export const Shell = (
  { screen }: ShellProps
) => {
  return (
    <main className="admin-main">
      <section className="auth-screen">
        <Screen state={screen} />
      </section>
    </main>
  );
};

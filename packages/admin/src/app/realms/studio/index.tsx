import type { User, State } from "./model/studio.types.js";
import { Sidebar } from "./chrome/aside/index.js";
import { Header } from "./chrome/header/index.js";
import { Route } from "./route/index.js";

export interface ShellProps {
  screen: State;
  user: User;
}

function Main({ screen }: Pick<ShellProps, "screen">) {
  return (
    <main className="admin-main studio-main">
      <div className="studio-main__body">
        <Sidebar state={screen} />
        <div className="admin-main__screen" role="region">
          <Route state={screen} />
        </div>
      </div>
    </main>
  );
}

function Shell({ screen, user }: ShellProps) {
  return (
    <div className="studio-shell">
      <Header account={user} screen={screen} />
      <Main screen={screen} />
    </div>
  );
}

export { Shell };

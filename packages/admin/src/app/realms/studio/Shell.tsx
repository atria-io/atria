import type { User, State } from "./types.js";
import { Sidebar } from "./chrome/aside/Sidebar.js";
import { Header } from "./chrome/header/Header.js";
import { Screen } from "./Screen.js";

export interface ShellProps {
  screen: State;
  user: User;
}

export const Shell = ({ screen, user }: ShellProps) => {
  return (
    <>
      <Header account={user} screen={screen} />
      <main className="admin-main">
        <div>
          <Sidebar state={screen} />
          <div className="admin-main__screen" role="region">
            <Screen state={screen} />
          </div>
        </div>
      </main>
    </>
  );
};

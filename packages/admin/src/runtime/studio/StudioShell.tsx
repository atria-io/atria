import type { AppUser, StudioState } from "./StudioTypes.js";
import { StudioSidebar } from "./chrome/aside/StudioSidebar.js";
import { StudioHeader } from "./chrome/header/StudioHeader.js";
import { StudioScreen } from "./StudioScreen.js";

export interface StudioShellProps {
  screen: StudioState;
  user: AppUser;
}

export const StudioShell = ({ screen, user }: StudioShellProps) => {
  return (
    <>
      <StudioHeader account={user} screen={screen} />
      <main className="admin-main">
        <div>
          <StudioSidebar state={screen} />
          <div className="admin-main__screen" role="region">
            <StudioScreen state={screen} />
          </div>
        </div>
      </main>
    </>
  );
};

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
      <StudioHeader account={user} />
      <StudioSidebar state={screen} />
      <StudioScreen state={screen} />
    </>
  );
};

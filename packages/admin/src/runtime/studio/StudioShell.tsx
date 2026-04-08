import type { AppUser, StudioState } from "./StudioTypes.js";
import { StudioHeader } from "./chrome/header/StudioHeader.js";
import { StudioMain } from "./chrome/main/StudioMain.js";

export interface StudioShellProps {
  screen: StudioState;
  user: AppUser;
}

export const StudioShell = ({ screen, user }: StudioShellProps) => {
  return (
    <>
      <StudioHeader account={user} />
      <StudioMain state={screen} />
    </>
  );
};

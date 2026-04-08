import type { AppUser, StudioState } from "./StudioTypes.js";
import { StudioHeader } from "./chrome/header/StudioHeader.js";
import { StudioContent } from "./content/StudioContent.js";

export interface StudioShellProps {
  screen: StudioState;
  user: AppUser;
}

export const StudioShell = ({ screen, user }: StudioShellProps) => {
  return (
    <>
      <StudioHeader account={user} />
      <StudioContent state={screen} />
    </>
  );
};

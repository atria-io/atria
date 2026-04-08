import type { AppUser } from "./StudioTypes.js";
import type { StudioState } from "./StudioTypes.js";
import { StudioHeader } from "./shell/header/StudioHeader.js";
import { StudioMain } from "./shell/main/StudioMain.js";

export interface StudioShellProps {
  screen: StudioState;
  user: AppUser;
}

export const StudioShell = ({ screen, user }: StudioShellProps) => {
  const handleLogout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };
  const handleLogoutClick = (): void => {
    void handleLogout();
  };

  return (
    <>
      <StudioHeader user={user} onLogout={handleLogoutClick} />
      <StudioMain state={screen} />
    </>
  );
};

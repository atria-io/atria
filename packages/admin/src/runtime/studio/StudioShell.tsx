import type { StudioState } from "./Studio.types.js";
import type { AppUser } from "./Studio.types.js";
import { Dashboard } from "./modules/dashboard/Dashboard.js";
import { StudioAccountPanel } from "./components/StudioAccountPanel.js";
import { StudioHeader } from "./components/StudioHeader.js";
import { StudioMain } from "./layout/StudioMain.js";

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
      <StudioHeader accountPanel={<StudioAccountPanel user={user} onLogout={handleLogoutClick} />} />
      <StudioMain>
        <Dashboard />
      </StudioMain>
    </>
  );
};

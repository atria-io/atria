import type { AppUser } from "./StudioTypes.js";
import type { StudioState } from "./StudioTypes.js";
import { StudioScreen } from "./StudioScreen.js";
import { StudioAccountPanel } from "./components/StudioAccountPanel.js";
import { StudioHeader } from "./components/StudioHeader.js";

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
      <main className="admin-shell__main">
        <StudioScreen state={screen} />
      </main>
    </>
  );
};

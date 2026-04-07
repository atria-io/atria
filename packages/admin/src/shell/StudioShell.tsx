import type { AppUser, StudioScreen } from "../system/runtime/runtimeTypes.js";
import { useRuntimeScheme } from "../system/runtime/runtimeScheme.js";
import { Dashboard } from "../realms/studio/modules/dashboard/Dashboard.js";
import { StudioAccountPanel } from "./components/StudioAccountPanel.js";
import { StudioHeader } from "./components/StudioHeader.js";
import { StudioMain } from "./layout/StudioMain.js";

export interface StudioShellProps {
  screen: StudioScreen;
  user: AppUser;
}

export const StudioShell = ({ screen, user }: StudioShellProps) => {
  const resolved = useRuntimeScheme();

  const handleLogout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };
  const handleLogoutClick = (): void => {
    void handleLogout();
  };

  return (
    <div className="admin-shell" data-route={screen} data-scheme={resolved}>
      <StudioHeader accountPanel={<StudioAccountPanel user={user} onLogout={handleLogoutClick} />} />
      <StudioMain>
        <Dashboard />
      </StudioMain>
    </div>
  );
};

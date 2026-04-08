import type { AppUser } from "../../StudioTypes.js";
import { StudioAccountPanel } from "./StudioAccountPanel.js";

export interface StudioHeaderProps {
  account: AppUser;
}

export const StudioHeader = ({ account }: StudioHeaderProps) => {
  const handleLogout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const handleLogoutClick = (): void => {
    void handleLogout();
  };

  return (
    <header className="admin-shell__header">
      <div>Studio</div>
      <StudioAccountPanel user={account} onLogout={handleLogoutClick} />
    </header>
  );
};

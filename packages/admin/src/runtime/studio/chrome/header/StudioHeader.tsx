import type { AppUser } from "../../StudioTypes.js";
import { AccountPanel } from "./AccountPanel.js";

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
    <header className="admin-header">
      <div className="admin-header__container">
        <div className="admin-header__atria"></div>
        <div className="admin-header__path" aria-label="Current path">
          <strong>@studio</strong><span>&nbsp;/&nbsp;</span>
        </div>
        <div className="admin-header__profile">
          <AccountPanel user={account} onLogout={handleLogoutClick} />
        </div>
      </div>
    </header>
  );
};

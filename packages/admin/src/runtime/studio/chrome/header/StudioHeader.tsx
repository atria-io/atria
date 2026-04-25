import type { AppUser } from "@/runtime/studio/StudioTypes.js";
import { useLogout } from "@/system/services/session/useLogout.js";
import { AccountPanel } from "./parts/account-panel/AccountPanel.js";
import { StudioBreadcrumbs } from "./parts/breadcrumbs/StudioBreadcrumbs.js";
import { StudioScheme } from "./parts/scheme/StudioScheme.js";

export interface StudioHeaderProps {
  account: AppUser;
}

export const StudioHeader = ({ account }: StudioHeaderProps) => {
  const { logout } = useLogout();

  const handleLogoutClick = (): void => {
    void logout();
  };

  return (
    <header className="admin-header">
      <div className="admin-header__container">
        <div className="admin-header__path">
          <StudioBreadcrumbs />
        </div>
        <div className="admin-header__scheme">
          <StudioScheme />
        </div>
        <div className="admin-header__profile">
          <AccountPanel user={account} onLogout={handleLogoutClick} />
        </div>
      </div>
    </header>
  );
};

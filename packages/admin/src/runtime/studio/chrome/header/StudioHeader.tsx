import type { AppUser, StudioState } from "@/runtime/studio/StudioTypes.js";
import { useLogout } from "@/system/services/session/useLogout.js";
import { StudioBreadcrumbs } from "./parts/breadcrumbs/StudioBreadcrumbs.js";
import { AccountPanel } from "./parts/account-panel/AccountPanel.js";
import { SchemePainel } from "./parts/scheme/SchemePainel.js";

export interface StudioHeaderProps {
  account: AppUser;
  screen: StudioState;
}

export const StudioHeader = ({ account, screen }: StudioHeaderProps) => {
  const { logout } = useLogout();

  const handleLogoutClick = (): void => {
    void logout();
  };

  return (
    <header className="admin-header">
      <div className="admin-header__container">
        <div className="admin-header__path">
          <StudioBreadcrumbs screen={screen} />
        </div>
        <div className="admin-header__actions">
          <SchemePainel />
          <AccountPanel user={account} onLogout={handleLogoutClick} />
        </div>
      </div>
    </header>
  );
};

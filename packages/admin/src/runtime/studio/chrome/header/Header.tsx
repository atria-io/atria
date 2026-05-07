import { StudioBreadcrumbs } from "./parts/breadcrumbs/StudioBreadcrumbs.js";
import { AccountPanel } from "./parts/account-panel/AccountPanel.js";
import { useLogout } from "@/system/services/session/useLogout.js";
import { SchemePanel } from "./parts/scheme/SchemePanel.js";
import type { User, State } from "@/runtime/studio/types.js";

export interface HeaderProps {
  account: User;
  screen: State;
}

export const Header = (
  { account, screen }: HeaderProps
) => {
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
          <SchemePanel />
          <AccountPanel user={account} onLogout={handleLogoutClick} />
        </div>
      </div>
    </header>
  );
};

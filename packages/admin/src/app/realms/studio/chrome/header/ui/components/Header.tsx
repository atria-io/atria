import { Account } from "./header/Account.js";
import { Path } from "./header/Path.js";
import { Scheme } from "./header/Scheme.js";
import * as deps from "../deps.js";

export interface HeaderProps {
  account: deps.User;
  screen: deps.State;
}

function Header({ account, screen }: HeaderProps) {
  const { logout } = deps.useLogout();

  const handleLogoutClick = (): void => {
    void logout();
  };

  return (
    <header className="admin-header">
      <div className="admin-header__container">
        <div className="admin-header__commun"></div>
        <div className="admin-header__path">
          <Path screen={screen} />
        </div>
        <div className="admin-header__actions">
          <Scheme />
          <Account user={account} onLogout={handleLogoutClick} />
        </div>
      </div>
    </header>
  );
}

export { Header };

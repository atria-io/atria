import { Path } from "./sections/path/Path.js";
import { Account } from "./sections/actions/Account.js";
import { useLogout } from "@/app/realms/auth/model/useLogout.js";
import { Scheme } from "./sections/actions/Scheme.js";
import type { User, State } from "@/app/realms/studio/model/studio.types.js";

export interface HeaderProps {
  account: User;
  screen: State;
}

const Header = ({ account, screen }: HeaderProps) => {
  const { logout } = useLogout();

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
};

export { Header };

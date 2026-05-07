import { Path } from "./parts/path/Path.js";
import { Account } from "./parts/actions/account/Account.js";
import { useLogout } from "@/system/services/session/useLogout.js";
import { Scheme } from "./parts/actions/scheme/Scheme.js";
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

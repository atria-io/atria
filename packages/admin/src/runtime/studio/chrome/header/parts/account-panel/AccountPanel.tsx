import { useScheme } from "@/system/services/scheme/useScheme.js";
import type { StudioAccountPanelProps } from "./AccountPanelTypes.js";
import { AccountIdentity } from "./components/AccountIdentity.js";
import { AccountLogoutButton } from "./components/AccountLogoutButton.js";
import { AccountSchemeSwitcher } from "./components/AccountSchemeSwitcher.js";

export const AccountPanel = ({ user, onLogout }: StudioAccountPanelProps) => {
  const { mode, modes, setMode } = useScheme();

  return (
    <>
      <div className="studio-account__profile" aria-label="User info">
        <AccountIdentity user={user} avatarSize={22} />
      </div>
      <div className="studio-account__panel">
        <AccountIdentity user={user} avatarSize={24} showDetails />
        <AccountSchemeSwitcher mode={mode} modes={modes} onSetMode={setMode} />
        <AccountLogoutButton onLogout={onLogout} />
      </div>
    </>
  );
};

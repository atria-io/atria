import { useScheme } from "@/system/services/scheme/useScheme.js";
import type { StudioAccountPanelProps } from "./AccountPanelTypes.js";
import { AccountIdentity } from "./components/AccountIdentity.js";
import { AccountLogout } from "./components/AccountLogout.js";
import { AccountScheme } from "./components/AccountScheme.js";

export const AccountPanel = ({ user, onLogout }: StudioAccountPanelProps) => {
  const { mode, modes, setMode } = useScheme();

  return (
    <>
      <div className="studio-account__profile" aria-label="User info">
        <AccountIdentity user={user} avatarSize={22} />
      </div>
      <div className="studio-account__panel">
        <div className="studio-account__menu">
          <AccountIdentity user={user} avatarSize={24} showDetails />
          <AccountScheme mode={mode} modes={modes} onSetMode={setMode} />
          <AccountLogout onLogout={onLogout} />
        </div>
      </div>
    </>
  );
};

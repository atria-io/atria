import { AccountPanelEmail } from "./shared/AccountPanelEmail.js";
import { AccountPanelProvider } from "./shared/AccountPanelProvider.js";
import type { AccountPanelProps } from "./accountPanelTypes.js";

export const AccountPanel = (
  { user, onLogout }: AccountPanelProps
) => {
  return user.avatarUrl
    ? <AccountPanelProvider user={user} onLogout={onLogout} />
    : <AccountPanelEmail user={user} onLogout={onLogout} />;
};

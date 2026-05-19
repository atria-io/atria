import { AccountEmail } from "./shared/AccountEmail.js";
import { AccountProvider } from "./shared/AccountProvider.js";
import type { AccountProps } from "./types.js";

export const Account = (
  { user, onLogout }: AccountProps
) => {
  return user.avatarUrl
    ? <AccountProvider user={user} onLogout={onLogout} />
    : <AccountEmail user={user} onLogout={onLogout} />;
};

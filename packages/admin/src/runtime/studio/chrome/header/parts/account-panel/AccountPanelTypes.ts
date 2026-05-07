import type { User } from "@/runtime/studio/types.js";

export interface AccountPanelProps {
  user: User;
  onLogout: () => void;
}

export interface AccountIdentityProps {
  user: User;
  avatarSize: 22 | 24;
  showDetails?: boolean;
}

export interface AccountLogoutProps {
  onLogout: () => void;
}

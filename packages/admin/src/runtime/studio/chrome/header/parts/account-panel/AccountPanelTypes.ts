import type { AppUser } from "@/runtime/studio/StudioTypes.js";

export interface AccountPanelProps {
  user: AppUser;
  onLogout: () => void;
}

export interface AccountIdentityProps {
  user: AppUser;
  avatarSize: 22 | 24;
  showDetails?: boolean;
}

export interface AccountLogoutProps {
  onLogout: () => void;
}

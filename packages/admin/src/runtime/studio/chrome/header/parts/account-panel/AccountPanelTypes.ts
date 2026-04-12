import type { AppUser } from "@/runtime/studio/StudioTypes.js";
import type { SchemeMode } from "@/system/services/scheme/schemeTypes.js";

export interface StudioAccountPanelProps {
  user: AppUser;
  onLogout: () => void;
}

export interface AccountIdentityProps {
  user: AppUser;
  avatarSize: 22 | 24;
  showDetails?: boolean;
}

export interface AccountSchemeSwitcherProps {
  mode: SchemeMode;
  resolved: "light" | "dark";
  modes: readonly SchemeMode[];
  onSetMode: (mode: SchemeMode) => void;
}

export interface AccountLogoutButtonProps {
  onLogout: () => void;
}

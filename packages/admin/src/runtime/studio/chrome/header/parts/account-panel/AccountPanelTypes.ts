import type { User } from "@/runtime/studio/types.js";

export interface AccountPanelProps {
  user: User;
  onLogout: () => void;
}

export interface AccountLogoutProps {
  onLogout: () => void;
}

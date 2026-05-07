import type { User } from "@/runtime/studio/types.js";

export interface AccountProps {
  user: User;
  onLogout: () => void;
}

export interface AccountLogoutProps {
  onLogout: () => void;
}

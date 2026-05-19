import type { UseLogoutResult } from "./logoutTypes.js";

export const useLogout = (): UseLogoutResult => {
  const logout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  return { logout };
};

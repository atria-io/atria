import { LogOut } from "lucide-react";
import type { AccountLogoutProps } from "../types.js";

export const AccountLogout = ({ onLogout }: AccountLogoutProps) => (
  <div className="studio-account__logout" aria-label="Logout action">
    <button
    type="button"
    className="button button--overlay studio-account__logout-button"
    onClick={onLogout}>
      <div className="button__icon">
        <LogOut size={16} />
      </div>
    </button>
  </div>
);

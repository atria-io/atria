import { LogOut } from "lucide-react";
import type { AccountLogoutProps } from "../accountPanelTypes.js";

export const AccountLogout = ({ onLogout }: AccountLogoutProps) => (
  <div className="studio-account__logout" aria-label="Logout action">
    <button
    type="button"
    className="button button--overlay studio-account__logout-button" onClick={onLogout}>
      <div className="button__icon">
        <LogOut className="admin-main__sidebar-icon" />
      </div>
    </button>
  </div>
);

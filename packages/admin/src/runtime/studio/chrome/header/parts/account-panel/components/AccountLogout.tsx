import type { AccountLogoutProps } from "../AccountPanelTypes.js";

export const AccountLogout = ({ onLogout }: AccountLogoutProps) => (
  <div className="studio-account__logout" aria-label="Logout action">
    <button className="studio-account__logout-button" type="button" onClick={onLogout}>
      Logout
    </button>
  </div>
);

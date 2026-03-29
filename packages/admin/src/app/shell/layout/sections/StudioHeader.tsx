import type { BootstrapUserSummary } from "../../../bootstrap/getBootstrapState.js";

export interface StudioHeaderProps {
  user: BootstrapUserSummary;
  onLogout: () => void;
}

export const StudioHeader = ({ user, onLogout }: StudioHeaderProps) => (
  <header className="admin-shell__header">
    <div>Studio</div>
    <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} width={24} height={24} />
        ) : (
          <span
            aria-label="Avatar"
            style={{ width: "24px", height: "24px", borderRadius: "50%", background: "currentColor", opacity: 0.3 }}
          />
        )}
        <span>{user.name}</span>
      </div>
      <button type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  </header>
);

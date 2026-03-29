export interface StudioHeaderProps {
  onLogout: () => void;
}

export const StudioHeader = ({ onLogout }: StudioHeaderProps) => (
  <header className="admin-shell__header">
    <div>Studio</div>
    <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
      <button type="button" aria-label="Account">
        Account
      </button>
      <button type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  </header>
);

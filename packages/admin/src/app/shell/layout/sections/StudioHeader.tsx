import type { BootstrapUserSummary } from "../../../bootstrap/getBootstrapState.js";
import { StudioAccountPanel } from "./StudioAccountPanel.js";

export interface StudioHeaderProps {
  user: BootstrapUserSummary;
  onLogout: () => void;
}

export const StudioHeader = ({ user, onLogout }: StudioHeaderProps) => (
  <header className="admin-shell__header">
    <div>Studio</div>
    <StudioAccountPanel user={user} onLogout={onLogout} />
  </header>
);

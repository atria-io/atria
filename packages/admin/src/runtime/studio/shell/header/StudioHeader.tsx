import type { AppUser } from "../../StudioTypes.js";
import { StudioAccountPanel } from "./StudioAccountPanel.js";

export interface StudioHeaderProps {
  user: AppUser;
  onLogout: () => void;
}

export const StudioHeader = ({ user, onLogout }: StudioHeaderProps) => (
  <header className="admin-shell__header">
    <div>Studio</div>
    <StudioAccountPanel user={user} onLogout={onLogout} />
  </header>
);

import type { AppUser, StudioScreen } from "../runtime/runtimeTypes.js";
import { useRuntimeScheme } from "../runtime/runtimeScheme.js";
import { Dashboard } from "../../modules/dashboard/Dashboard.js";
import { StudioAccountPanel } from "./components/StudioAccountPanel.js";
import { StudioHeader } from "./components/StudioHeader.js";
import { StudioMain } from "./layout/StudioMain.js";

export interface StudioShellProps {
  screen: StudioScreen;
  user: AppUser;
}

export const StudioShell = ({ screen, user }: StudioShellProps) => {
  const resolved = useRuntimeScheme();

  const handleLogout = async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const content = (() => {
    switch (screen) {
      case "dashboard":
        return <Dashboard />;
    }
  })();

  return (
    <div className="admin-shell" data-route={screen} data-scheme={resolved}>
      <StudioHeader accountPanel={<StudioAccountPanel user={user} onLogout={() => void handleLogout()} />} />
      <StudioMain>{content}</StudioMain>
    </div>
  );
};

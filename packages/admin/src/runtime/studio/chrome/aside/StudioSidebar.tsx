import type { StudioProps } from "../../StudioTypes.js";
import { useLogout } from "@/system/services/session/useLogout.js";
import { Layers2, LogOut, Settings } from "lucide-react";

export const StudioSidebar = ({ state }: StudioProps) => {
  const { logout } = useLogout();

  const navigateTo = (nextState: StudioProps["state"]): void => {
    const pathname = nextState === "dashboard" ? "/" : `/${nextState}`;
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = (): void => {
    void logout();
  };

  return (
    <aside className="admin-main__sidebar">
      <nav>
        <button
          aria-label="Pages"
          data-tooltip="Pages"
          data-active={state === "pages"}
          onClick={() => navigateTo("pages")}
          type="button">
            <Layers2 className="admin-main__sidebar-icon pages" />
        </button>
        <div>
          <button
            aria-label="Settings"
            data-tooltip="Settings"
            data-active={state === "settings"}
            onClick={() => navigateTo("settings")}
            type="button">
              <Settings className="admin-main__sidebar-icon settings" />
          </button>
          <button
            aria-label="Logout"
            data-tooltip="Logout"
            onClick={handleLogout}
            type="button">
              <LogOut className="admin-main__sidebar-icon logout" />
          </button>
        </div>
      </nav>
    </aside>
  );
};

import type { Props } from "../../types.js";
import { useLogout } from "@/system/services/session/useLogout.js";
import { Layers2, LogOut, Settings } from "lucide-react";
import { SidebarNavButton } from "./shared/SidebarNavButton.js";

interface SidebarItem {
  name: "Pages" | "Settings" | "Logout";
  state?: Props["state"];
  onClick: () => void;
  Icon: typeof Layers2;
}

export const Sidebar = (
  { state }: Props
) => {
  const { logout } = useLogout();

  const navigateTo = (nextState: Props["state"]): void => {
    const pathname = nextState === "dashboard" ? "/" : `/${nextState}`;
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = (): void => {
    void logout();
  };

  const topItems: SidebarItem[] = [
    {
      name: "Pages",
      state: "pages",
      onClick: () => navigateTo("pages"),
      Icon: Layers2
    },
  ];

  const bottomItems: SidebarItem[] = [
    {
      name: "Settings",
      state: "settings",
      onClick: () => navigateTo("settings"),
      Icon: Settings
    },
    {
      name: "Logout",
      onClick: handleLogout,
      Icon: LogOut
    },
  ];

  return (
    <aside className="admin-main__sidebar">
      <nav>
        <div>
          {topItems.map(({ name, state: itemState, onClick, Icon }) => (
            <SidebarNavButton
              key={name}
              ariaLabel={name}
              tooltip={name}
              active={itemState ? state === itemState : undefined}
              onClick={onClick}>
              <Icon className={`admin-main__sidebar-icon ${name.toLowerCase()}`} />
            </SidebarNavButton>
          ))}
        </div>
        <div>
          {bottomItems.map(({ name, state: itemState, onClick, Icon }) => (
            <SidebarNavButton
              key={name}
              ariaLabel={name}
              tooltip={name}
              active={itemState ? state === itemState : undefined}
              onClick={onClick}>
              <Icon className={`admin-main__sidebar-icon ${name.toLowerCase()}`} />
            </SidebarNavButton>
          ))}
        </div>
      </nav>
    </aside>
  );
};

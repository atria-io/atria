import * as Icon from "lucide-react";
import * as deps from "../deps.js";
import { Navigation } from "./sidebar/Navigation.js";

export interface SidebarProps {
  state: deps.State;
}

function navigateTo(nextState: deps.State): void {
  const pathname = nextState === "dashboard" ? "/" : `/${nextState}`;
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Sidebar({ state }: SidebarProps) {
  const { logout } = deps.useLogout();
  const topItems: deps.SidebarItem[] = [
    {
      name: "Pages",
      state: "pages",
      href: "/pages",
      onClick: () => navigateTo("pages"),
      Icon: Icon.Layers,
    },
    {
      name: "Theme",
      state: "theme",
      href: "/theme",
      onClick: () => navigateTo("theme"),
      Icon: Icon.LayoutTemplate,
    },
  ];
  const bottomItems: deps.SidebarItem[] = [
    {
      name: "Translations",
      state: "translations",
      href: "/translations",
      onClick: () => navigateTo("translations"),
      Icon: Icon.Languages,
    },
    {
      name: "Settings",
      state: "settings",
      href: "/settings",
      onClick: () => navigateTo("settings"),
      Icon: Icon.Settings,
    },
    {
      name: "Logout",
      onClick: () => {
        void logout();
      },
      Icon: Icon.LogOut,
    },
  ];

  return (
    <aside className="admin-main__sidebar">
      <nav>
        <Navigation state={state} items={topItems} />
        <Navigation state={state} items={bottomItems} />
      </nav>
    </aside>
  );
}

export { Sidebar };

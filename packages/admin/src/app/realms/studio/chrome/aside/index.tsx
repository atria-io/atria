import * as React from "react";
import * as Icon from "lucide-react";
import type { Props } from "../../model/studio.types.js";
import { Button } from "@atria/ui";
import { useLogout } from "@/app/realms/auth/model/uselogout.js";

interface SidebarItem {
  name: "Pages" | "Settings" | "Logout";
  state?: Props["state"];
  onClick: () => void;
  Icon: typeof Icon.Layers2;
}

interface SidebarNavButtonProps {
  ariaLabel: string;
  tooltip: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SidebarNavButton({
  ariaLabel,
  tooltip,
  active,
  onClick,
  children,
}: SidebarNavButtonProps) {
  return (
    <Button
      variant="overlay"
      className="admin-main__sidebar-button"
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      data-active={active}
      onClick={onClick}
      type="button">
      {children}
    </Button>
  );
}

function SidebarSection({
  state,
  items,
}: {
  state: Props["state"];
  items: SidebarItem[];
}) {
  return (
    <div>
      {items.map(({ name, state: itemState, onClick, Icon }) => (
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
  );
}

function TopItems({ state }: Pick<Props, "state">) {
  const navigateTo = (nextState: Props["state"]): void => {
    const pathname = nextState === "dashboard" ? "/" : `/${nextState}`;
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const items: SidebarItem[] = [
    {
      name: "Pages",
      state: "pages",
      onClick: () => navigateTo("pages"),
      Icon: Icon.Layers
    },
  ];

  return <SidebarSection state={state} items={items} />;
}

function BottomItems({ state }: Pick<Props, "state">) {
  const { logout } = useLogout();
  const navigateTo = (nextState: Props["state"]): void => {
    const pathname = nextState === "dashboard" ? "/" : `/${nextState}`;
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const items: SidebarItem[] = [
    {
      name: "Settings",
      state: "settings",
      onClick: () => navigateTo("settings"),
      Icon: Icon.Settings
    },
    {
      name: "Logout",
      onClick: () => {
        void logout();
      },
      Icon: Icon.LogOut
    },
  ];

  return <SidebarSection state={state} items={items} />;
}

const Sidebar = ({ state }: Props) => {
  return (
    <aside className="admin-main__sidebar">
      <nav>
        <TopItems state={state} />
        <BottomItems state={state} />
      </nav>
    </aside>
  );
};

export { Sidebar };

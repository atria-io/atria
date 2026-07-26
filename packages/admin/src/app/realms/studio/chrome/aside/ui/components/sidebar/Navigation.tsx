import * as React from "react";
import { Button } from "@atria/ui";
import * as deps from "../../deps.js";

interface SidebarControlProps {
  ariaLabel: string;
  tooltip: string;
  active?: boolean;
  children: React.ReactNode;
}

function SidebarNavButton({
  ariaLabel,
  tooltip,
  active,
  onClick,
  children,
}: SidebarControlProps & { onClick: () => void }) {
  return (
    <Button
      variant="overlay"
      className="admin-main__sidebar-button"
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      data-state={active}
      onClick={onClick}
      type="button">
      {children}
    </Button>
  );
}

function SidebarNavAnchor({
  ariaLabel,
  tooltip,
  href,
  active,
  onClick,
  children,
}: SidebarControlProps & {
  href: string;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      className="button button--overlay admin-main__sidebar-button"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      data-tooltip={tooltip}
      data-state={active}
      href={href}
      onClick={onClick}>
      {children}
    </a>
  );
}

function Navigation({
  state,
  items,
}: {
  state: deps.State;
  items: deps.SidebarItem[];
}) {
  return (
    <div>
      {items.map(({ name, state: itemState, href, onClick, Icon }) => {
        const active = itemState ? state === itemState : undefined;
        const icon = <Icon className={`admin-main__sidebar-icon ${name.toLowerCase()}`} />;

        if (href) {
          return (
            <SidebarNavAnchor
              key={name}
              ariaLabel={name}
              tooltip={name}
              href={href}
              active={active}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return;
                }
                event.preventDefault();
                onClick();
              }}>
              {icon}
            </SidebarNavAnchor>
          );
        }

        return (
          <SidebarNavButton
            key={name}
            ariaLabel={name}
            tooltip={name}
            active={active}
            onClick={onClick}>
            {icon}
          </SidebarNavButton>
        );
      })}
    </div>
  );
}

export { Navigation };

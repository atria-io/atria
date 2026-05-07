import type { ReactNode } from "react";

interface SidebarNavButtonProps {
  ariaLabel: string;
  tooltip: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export const SidebarNavButton = (
  {
    ariaLabel,
    tooltip,
    active,
    onClick,
    children,
  }: SidebarNavButtonProps
) => {
  return (
    <button
      className="button button--overlay admin-main__sidebar-button"
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      data-active={active}
      onClick={onClick}
      type="button">
      {children}
    </button>
  );
};

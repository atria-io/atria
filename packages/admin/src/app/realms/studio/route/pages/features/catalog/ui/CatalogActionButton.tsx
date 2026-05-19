import * as React from "react";
import type * as Icon from "lucide-react";

interface CatalogActionButtonProps {
  actionClassName: string;
  ariaLabel: string;
  tooltip: string;
  Icon: Icon.LucideIcon;
  iconSize: number;
  active?: boolean;
  onClick?: () => void;
}

export function CatalogActionButton({
  actionClassName,
  ariaLabel,
  tooltip,
  Icon,
  iconSize,
  active = false,
  onClick,
}: CatalogActionButtonProps) {
  const rootRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    if (active) {
      root.setAttribute("active", "");
      return;
    }

    root.removeAttribute("active");
  }, [active]);

  return (
    <button
      ref={rootRef}
      type="button"
      className={`button button--square button--overlay button--icon ${actionClassName}`}
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      onClick={onClick}
    >
      <div className="button__icon">
        <Icon size={iconSize} />
      </div>
    </button>
  );
}

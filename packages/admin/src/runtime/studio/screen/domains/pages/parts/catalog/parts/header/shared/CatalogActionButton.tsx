import type { LucideIcon } from "lucide-react";

interface CatalogActionButtonProps {
  actionClassName: string;
  ariaLabel: string;
  tooltip: string;
  Icon: LucideIcon;
  iconSize: number;
  onClick?: () => void;
}

export function CatalogActionButton({
  actionClassName,
  ariaLabel,
  tooltip,
  Icon,
  iconSize,
  onClick,
}: CatalogActionButtonProps) {
  return (
    <button
      type="button"
      className={`button button--square button--overlay button--has-icon ${actionClassName}`}
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

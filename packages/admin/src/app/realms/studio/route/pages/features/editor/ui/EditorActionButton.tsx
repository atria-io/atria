import type * as Icon from "lucide-react";

interface EditorActionButtonProps {
  ariaLabel: string;
  label?: string;
  tooltip?: string;
  icon?: Icon.LucideIcon;
  iconSize?: number;
  onClick?: () => void;
}

export function EditorActionButton({
  ariaLabel,
  label,
  tooltip,
  icon: Icon,
  iconSize = 16,
  onClick,
}: EditorActionButtonProps) {
  const className = Icon
    ? "button button--square button--overlay button--icon"
    : "button button--fill button--sm button--overlay button--center";

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      data-tooltip={tooltip}
      onClick={onClick}
    >
      {Icon ? (
        <div className="button__icon">
          <Icon size={iconSize} />
        </div>
      ) : label}
    </button>
  );
}

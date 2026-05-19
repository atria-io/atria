import * as React from "react";

type PopoverSize = "xs" | "sm" | "md" | "lg";
type PopoverTextSize = "xs" | "sm" | "md";

export type PopoverProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  size?: PopoverSize;
  textSize?: PopoverTextSize;
  open?: boolean;
  closing?: boolean;
  mounted?: boolean;
  scope?: string;
};

const sizeClasses: Record<PopoverSize, string> = {
  xs: "popover--xs",
  sm: "popover--sm",
  md: "popover--md",
  lg: "popover--lg",
};

const textSizeClasses: Record<PopoverTextSize, string> = {
  xs: "popover--text-xs",
  sm: "popover--text-sm",
  md: "popover--text-md",
};

const getPopoverClass = ({
  size,
  textSize,
  open,
  closing,
  scope,
  className,
}: {
  size?: PopoverSize;
  textSize?: PopoverTextSize;
  open: boolean;
  closing: boolean;
  scope: string;
  className: string;
}): string =>
  [
    "popover",
    scope ? `${scope}-popover` : "",
    size ? sizeClasses[size] : "",
    textSize ? textSizeClasses[textSize] : "",
    open ? "popover--open" : "",
    closing ? "popover--closing" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

function Popover({
  children,
  className = "",
  size,
  textSize,
  open = false,
  closing = false,
  mounted = true,
  scope = "",
  ...props
}: PopoverProps) {
  if (!mounted) {
    return null;
  }

  const popoverClass = getPopoverClass({
    size,
    textSize,
    open,
    closing,
    scope,
    className,
  });
  const surfaceClass = ["popover__surface", scope ? `${scope}-popover__surface` : ""]
    .filter(Boolean)
    .join(" ");
  const contentClass = ["popover__content", scope ? `${scope}-popover__content` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={popoverClass} {...props}>
      <div className={surfaceClass}>
        <div className={contentClass}>{children}</div>
      </div>
    </div>
  );
}

export { Popover };

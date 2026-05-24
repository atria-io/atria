import * as React from "react";

type ButtonVariant =
  | "solid"
  | "fill"
  | "overlay"
  | "ghost"
  | "link"
  | "link_muted"
  | "accent"
  | "danger"
  | "danger_hover"
  | "success"
  | "warning"
  | "destructive";
type ButtonSize = "xs" | "sm" | "md" | "lg";
type ButtonFont = "xs" | "sm" | "md" | "lg";
type ButtonAlign = "start" | "center" | "end";

export type ButtonProps = React.ComponentProps<"button"> & {
  children?: React.ReactNode;
  label?: React.ReactNode;
  variant?: ButtonVariant | ButtonVariant[];
  size?: ButtonSize;
  font?: ButtonFont;
  align?: ButtonAlign;
  full?: boolean;
  square?: boolean;
  icon?: boolean;
  loading?: boolean;
  scope?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  solid: "button--solid",
  fill: "button--fill",
  overlay: "button--overlay",
  ghost: "button--ghost",
  link: "button--link",
  link_muted: "button--link-muted",
  accent: "button--accent",
  danger: "button--danger",
  danger_hover: "button--danger-hover",
  success: "button--success",
  warning: "button--warning",
  destructive: "button--destructive",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "button--xs",
  sm: "button--sm",
  md: "button--md",
  lg: "button--lg",
};

const fontClasses: Record<ButtonFont, string> = {
  xs: "button--text-xs",
  sm: "button--text-sm",
  md: "button--text-md",
  lg: "button--text-lg",
};

const alignClasses: Record<ButtonAlign, string> = {
  start: "button--start",
  center: "button--center",
  end: "button--end",
};

function renderContent(
  loading: boolean,
  icon: boolean,
  label: React.ReactNode | undefined,
  children: React.ReactNode,
) {
  if (loading) {
    return <span className="button__spinner" aria-hidden="true" />;
  }
  if (label && icon) {
    return (
      <>
        <span className="button__icon" aria-hidden="true">{children}</span>
        <div className="button__label">{label}</div>
      </>
    );
  }
  if (!label && icon) {
    return <span className="button__icon" aria-hidden="true">{children}</span>;
  }
  if (!label) return children;
  return <div className="button__label">{label}</div>;
}

const getButtonClass = ({
  variant,
  size,
  font,
  align,
  full,
  square,
  icon,
  loading,
  scope,
  className,
}: {
  variant?: ButtonVariant | ButtonVariant[];
  size?: ButtonSize;
  font?: ButtonFont;
  align?: ButtonAlign;
  full: boolean;
  square: boolean;
  icon: boolean;
  loading: boolean;
  scope: string;
  className: string;
}): string => {
  const variants = Array.isArray(variant) ? variant : variant ? [variant] : [];
  const variantClassNames = variants
    .flatMap((item) => variantClasses[item].split(" "))
    .filter(Boolean);

  return [
    "button",
    scope ? `${scope}-button` : "",
    ...variantClassNames,
    size ? sizeClasses[size] : "",
    font ? fontClasses[font] : "",
    align ? alignClasses[align] : "",
    full ? "button--full" : "",
    square ? "button--square" : "",
    icon ? "button--icon" : "",
    loading ? "loading" : "",
    scope ? `${scope}-button` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
};

function Button({
  children,
  label,
  className = "",
  variant,
  size,
  font,
  align,
  full = false,
  square = false,
  icon = false,
  loading = false,
  scope = "",
  type = "button",
  ...props
}: ButtonProps) {
  const buttonClass = getButtonClass({
    variant,
    size,
    font,
    align,
    full,
    square,
    icon,
    loading,
    scope,
    className,
  });
  const content = renderContent(loading, icon, label, children);

  return (
    <button type={type} className={buttonClass} {...props}>
      {content}
    </button>
  );
}

export { Button };

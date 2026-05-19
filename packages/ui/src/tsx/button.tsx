import * as React from "react";

type ButtonVariant = "solid" | "fill" | "overlay" | "ghost" | "danger" | "danger_solid";
type ButtonSize = "sm" | "md" | "lg";
type ButtonAlign = "start" | "center" | "end";

export type ButtonProps = React.ComponentProps<"button"> & {
  children?: React.ReactNode;
  label?: React.ReactNode;
  variant?: ButtonVariant | ButtonVariant[];
  size?: ButtonSize;
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
  danger: "button--danger",
  danger_solid: "button--danger-solid",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "button--sm",
  md: "button--md",
  lg: "button--lg",
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
        <span className="button__label">{label}</span>
      </>
    );
  }
  if (!label && icon) {
    return <span className="button__icon" aria-hidden="true">{children}</span>;
  }
  if (!label) return children;
  return <span className="button__label">{label}</span>;
}

const getButtonClass = ({
  variant,
  size,
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
  align?: ButtonAlign;
  full: boolean;
  square: boolean;
  icon: boolean;
  loading: boolean;
  scope: string;
  className: string;
}): string => {
  const variants = Array.isArray(variant) ? variant : variant ? [variant] : [];
  const variantClassNames = variants.map((item) => variantClasses[item]).filter(Boolean);

  return [
    "button",
    scope ? `${scope}-button` : "",
    ...variantClassNames,
    size ? sizeClasses[size] : "",
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

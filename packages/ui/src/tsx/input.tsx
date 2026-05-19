import * as React from "react";

type InputVariant = "solid" | "ghost";
type InputSize = "sm" | "md" | "lg";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  variant?: InputVariant;
  size?: InputSize;
  full?: boolean;
  interactive?: boolean;
  subtle?: boolean;
  focusLine?: boolean;
  focusColor?: boolean;
};

const variantClasses: Record<InputVariant, string> = {
  solid: "input--solid",
  ghost: "input--ghost",
};

const sizeClasses: Record<InputSize, string> = {
  sm: "input--sm",
  md: "input--md",
  lg: "input--lg",
};

const getInputClass = ({
  variant,
  size,
  full,
  interactive,
  subtle,
  focusLine,
  focusColor,
  className,
}: {
  variant: InputVariant;
  size: InputSize;
  full: boolean;
  interactive: boolean;
  subtle: boolean;
  focusLine: boolean;
  focusColor: boolean;
  className: string;
}): string =>
  [
    "input",
    variantClasses[variant],
    sizeClasses[size],
    full ? "input--full" : "",
    interactive ? "input--interactive" : "",
    subtle ? "input--subtle" : "",
    focusLine ? "input--focus-line" : "",
    focusColor ? "input--focus-color" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

function Input({
  className = "",
  variant = "solid",
  size = "sm",
  full = false,
  interactive = false,
  subtle = false,
  focusLine = false,
  focusColor = false,
  ...props
}: InputProps) {
  const inputClass = getInputClass({
    variant,
    size,
    full,
    interactive,
    subtle,
    focusLine,
    focusColor,
    className,
  });

  return (
    <input className={inputClass} {...props} />
  );
}

export { Input };

import * as React from "react";

type LabelSize = "xs" | "sm" | "md" | "lg";
type FieldGap = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<LabelSize, string> = {
  xs: "field--label-xs",
  sm: "field--label-sm",
  md: "field--label-md",
  lg: "field--label-lg",
};

const gapClasses: Record<FieldGap, string> = {
  xs: "field--gap-xs",
  sm: "field--gap-sm",
  md: "field--gap-md",
  lg: "field--gap-lg",
  xl: "field--gap-xl",
};

function Field({
  className = "",
  gap = "md",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  gap?: FieldGap;
  children: React.ReactNode;
}) {
  const fieldClass = ["field", gapClasses[gap], className].filter(Boolean).join(" ");
  return (
    <div className={fieldClass} {...props}>
      {children}
    </div>
  );
}

function FieldLabel({
  className = "",
  size = "sm",
  label,
  children,
  ...props
}: React.ComponentProps<"label"> & {
  size?: LabelSize;
  label?: React.ReactNode;
}) {
  const labelClass = ["field__label", sizeClasses[size], className]
    .filter(Boolean)
    .join(" ");

  return <label className={labelClass} {...props}>{label ?? children}</label>;
}

function FieldHint({
  className = "",
  ...props
}: React.ComponentProps<"p">) {
  const hintClass = ["field__hint", className].filter(Boolean).join(" ");
  return <p className={hintClass} {...props} />;
}

function FieldError({
  className = "",
  ...props
}: React.ComponentProps<"p">) {
  const errorClass = ["field__error", className].filter(Boolean).join(" ");
  return <p className={errorClass} {...props} />;
}

const Label = FieldLabel;

export { Field, FieldLabel, FieldHint, FieldError, Label };

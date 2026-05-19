import * as React from "react";

type DialogSize = "sm" | "md" | "lg";
type DialogVariant = "default" | "destructive";

type DialogBaseProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  open?: boolean;
  mounted?: boolean;
  size?: DialogSize;
  variant?: DialogVariant;
  scope?: string;
  onBackdropClick?: () => void;
};

type DialogSectionProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const sizeClasses: Record<DialogSize, string> = {
  sm: "dialog--sm",
  md: "dialog--md",
  lg: "dialog--lg",
};

const variantClasses: Record<DialogVariant, string> = {
  default: "",
  destructive: "dialog--destructive",
};

function getDialogClass({
  size,
  variant,
  open,
  scope,
  className,
}: {
  size?: DialogSize;
  variant?: DialogVariant;
  open: boolean;
  scope: string;
  className: string;
}): string {
  return [
    "dialog",
    scope ? `${scope}-dialog` : "",
    size ? sizeClasses[size] : "",
    variant ? variantClasses[variant] : "",
    open ? "dialog--open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Dialog({
  children,
  className = "",
  open = false,
  mounted = true,
  size,
  variant = "default",
  scope = "",
  onBackdropClick,
  ...props
}: DialogBaseProps) {
  if (!mounted) {
    return null;
  }

  return (
    <div
      className={getDialogClass({ size, variant, open, scope, className })}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      <div
        className={["dialog__backdrop", scope ? `${scope}-dialog__backdrop` : ""].filter(Boolean).join(" ")}
        onClick={onBackdropClick}
      />
        <div className={["dialog__container", scope ? `${scope}-dialog__container` : ""].filter(Boolean).join(" ")}>
          <div className={["dialog__surface", scope ? `${scope}-dialog__surface` : ""].filter(Boolean).join(" ")}>
            {children}
          </div>
        </div>
    </div>
  );
}

function DialogHeader({ children, className = "", ...props }: DialogSectionProps) {
  return (
    <div className={["dialog__header", className].filter(Boolean).join(" ")} {...props}>
      <h3 className="dialog__header-title">
        {children}
      </h3>
    </div>
  );
}

function DialogBody({ children, className = "", ...props }: DialogSectionProps) {
  return (
    <div className={["dialog__body", className].filter(Boolean).join(" ")} {...props}>
      <p className="dialog__body-text">
        {children}
      </p>
    </div>
  );
}

function DialogFooter({ children, className = "", ...props }: DialogSectionProps) {
  return (
    <div className={["dialog__footer", className].filter(Boolean).join(" ")} {...props}>
      <div className="dialog__footer-actions">
        {children}
      </div>
    </div>
  );
}

export { Dialog, DialogHeader, DialogBody, DialogFooter };

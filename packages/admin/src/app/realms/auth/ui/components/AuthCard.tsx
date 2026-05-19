import * as React from "react";

function AuthCard({ children }: { children: React.ReactNode }) {
  return <div className="auth-card">{children}</div>;
}

function AuthCardHeader({ children }: { children: React.ReactNode }) {
  return <div className="auth-card__header">{children}</div>;
}

function AuthCardTitle({
  children,
  as: Tag = "h1",
}: {
  children: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <Tag className="auth-card__title">
      <span>{children}</span>
    </Tag>
  );
}

function AuthCardHeaderText({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-card__header-text">
      <span>{children}</span>
    </div>
  );
}

function AuthCardContent({
  className = "",
  children,
  ...props
}: React.ComponentProps<"div">) {
  const contentClass = ["auth-card__content", className].filter(Boolean).join(" ");
  return (
    <div className={contentClass} {...props}>
      {children}
    </div>
  );
}

function AuthCardText({ className = "", ...props }: React.ComponentProps<"p">) {
  const textClass = ["auth-card__text", className].filter(Boolean).join(" ");
  return <p className={textClass} {...props} />;
}

function AuthCardErrorMessage({
  errorMessage,
}: {
  errorMessage: string | null;
}) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="auth-screen__message">
      <p className="auth-card__error">{errorMessage}</p>
    </div>
  );
}

export {
  AuthCard,
  AuthCardHeader,
  AuthCardTitle,
  AuthCardHeaderText,
  AuthCardContent,
  AuthCardText,
  AuthCardErrorMessage,
};

import React from "react";
import type { TranslateFn } from "../../../../i18n/client.js";
import { LoginForm, type LoginValues } from "../forms/Login.js";
import { RegisterForm, type RegisterValues } from "../forms/Register.js";

interface AuthViewEmailFormProps {
  mode: "login" | "create";
  isBusy: boolean;
  formError: string | null;
  onLogin: (values: LoginValues) => Promise<void> | void;
  onRegister: (values: RegisterValues) => Promise<void> | void;
  t: TranslateFn;
}

export function AuthViewEmailForm(props: AuthViewEmailFormProps): React.JSX.Element {
  const {
    mode,
    isBusy,
    formError,
    onLogin,
    onRegister,
    t
  } = props;

  const isLogin = mode === "login";

  return (
    <>
      <p className="auth-card__text">
        {t(isLogin ? "auth.message.emailLoginLead" : "auth.message.emailCreateLead")}
      </p>

      {isLogin ? (
        <LoginForm disabled={isBusy} errorMessage={formError} onSubmit={onLogin} t={t} />
      ) : (
        <RegisterForm disabled={isBusy} errorMessage={formError} onSubmit={onRegister} t={t} />
      )}
    </>
  );
}

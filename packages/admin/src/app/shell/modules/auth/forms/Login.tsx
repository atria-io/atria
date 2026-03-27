import React, { useState } from "react";
import type { TranslateFn } from "../../../../../i18n/client.js";

export interface LoginValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  disabled: boolean;
  errorMessage: string | null;
  onSubmit: (values: LoginValues) => Promise<void> | void;
  t: TranslateFn;
}

export function LoginForm({ disabled, errorMessage, onSubmit, t }:
    LoginFormProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    void onSubmit({
      email: email.trim(),
      password
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__field">
        <label htmlFor="auth-login-email" className="auth-form__label">
          {t("auth.form.email.label")}
        </label>
        <input
          id="auth-login-email"
          className="auth-form__input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disabled}
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-form__field">
        <label htmlFor="auth-login-password" className="auth-form__label">
          {t("auth.form.password.label")}
        </label>
        <input
          id="auth-login-password"
          className="auth-form__input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>

      <span className="auth-form__hint">{t("auth.form.login.forgot")}</span>

      {errorMessage ? <p className="auth-form__error">{errorMessage}</p> : null}

      <button
        type="submit"
        className="auth-card__button auth-card__button--primary"
        disabled={disabled}>
          {t("auth.form.login.submit")}
      </button>
    </form>
  );
}

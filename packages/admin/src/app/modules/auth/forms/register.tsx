import React, { useState } from "react";
import type { TranslateFn } from "../../../../i18n/client.js";

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

interface RegisterFormProps {
  disabled: boolean;
  errorMessage: string | null;
  onSubmit: (values: RegisterValues) => Promise<void> | void;
  t: TranslateFn;
}

export function RegisterForm({ disabled, errorMessage, onSubmit, t }:
    RegisterFormProps): React.JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setLocalError(t("auth.error.passwordMismatch"));
      return;
    }

    setLocalError(null);

    const mergedName = [firstName.trim(), lastName.trim()].filter((value) =>
      value.length > 0).join(" ");

    void onSubmit({
      name: mergedName,
      email: email.trim(),
      password
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__field">
        <label htmlFor="auth-register-first-name" className="auth-form__label">
          {t("auth.form.firstName.label")}
        </label>
        <input
          id="auth-register-first-name"
          className="auth-form__input"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          disabled={disabled}
          autoComplete="given-name"
          maxLength={80}
          required
        />
      </div>

      <div className="auth-form__field">
        <label htmlFor="auth-register-last-name" className="auth-form__label">
          {t("auth.form.lastName.label")}
        </label>
        <input
          id="auth-register-last-name"
          className="auth-form__input"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          disabled={disabled}
          autoComplete="family-name"
          maxLength={80}
          required
        />
      </div>

      <div className="auth-form__field">
        <label htmlFor="auth-register-email" className="auth-form__label">
          {t("auth.form.email.label")}
        </label>
        <input
          id="auth-register-email"
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
        <label htmlFor="auth-register-password" className="auth-form__label">
          {t("auth.form.password.label")}
        </label>
        <input
          id="auth-register-password"
          className="auth-form__input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="auth-form__field">
        <label htmlFor="auth-register-confirm-password" className="auth-form__label">
          {t("auth.form.confirmPassword.label")}
        </label>
        <input
          id="auth-register-confirm-password"
          className="auth-form__input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {localError ? <p className="auth-form__error">{localError}</p> : null}
      {errorMessage ? <p className="auth-form__error">{errorMessage}</p> : null}

      <button type="submit" className="auth-card__button auth-card__button--primary" disabled={disabled}>
        {t("auth.form.create.submit")}
      </button>
    </form>
  );
}

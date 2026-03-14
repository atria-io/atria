import React, { useState } from "react";
import type { TranslateFn } from "../../../i18n/client.js";

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

export function RegisterForm({ disabled, errorMessage, onSubmit, t }: RegisterFormProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    void onSubmit({
      name: name.trim(),
      email: email.trim(),
      password
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__field">
        <label htmlFor="auth-register-name" className="auth-form__label">
          {t("auth.form.name.label")}
        </label>
        <input
          id="auth-register-name"
          className="auth-form__input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={disabled}
          autoComplete="name"
          maxLength={120}
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

      {errorMessage ? <p className="auth-form__error">{errorMessage}</p> : null}

      <button type="submit" className="auth-card__button auth-card__button--primary" disabled={disabled}>
        {t("auth.form.create.submit")}
      </button>
    </form>
  );
}

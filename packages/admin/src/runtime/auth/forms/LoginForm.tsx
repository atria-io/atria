import { useState, type SubmitEventHandler } from "react";
import type { LoginValues } from "../AuthTypes.js";

interface LoginFormProps {
  disabled?: boolean;
  errorMessage?: string | null;
  onBack?: (() => void) | undefined;
  onSubmit: (values: LoginValues) => Promise<void> | void;
}

export const LoginForm = ({
  disabled = false,
  errorMessage = null,
  onBack,
  onSubmit,
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event): void => {
    event.preventDefault();
    void onSubmit({ email: email.trim(), password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__field">
        <label htmlFor="auth-login-email">Email</label>
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
        <label htmlFor="auth-login-password">Password</label>
        <input
          id="auth-login-password"
          className="auth-form__input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          autoComplete="current-password"
          required
        />
      </div>

      {errorMessage ? <p className="auth-form__error">{errorMessage}</p> : null}

      <button type="submit" className="auth-card__button" disabled={disabled}>
        Login
      </button>

      {onBack ? (
        <button type="button" className="auth-card__switch" onClick={onBack} disabled={disabled}>
          Other sign in options
        </button>
      ) : null}
    </form>
  );
};

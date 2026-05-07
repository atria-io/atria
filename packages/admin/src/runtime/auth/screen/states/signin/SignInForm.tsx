import { useState, type SubmitEventHandler } from "react";
import type { SignInValues } from "../../../types.js";

interface SignInFormProps {
  disabled?: boolean;
  errorMessage?: string | null;
  onBack?: (() => void) | undefined;
  onSubmit: (values: SignInValues) => Promise<void> | void;
}

export const SignInForm = ({
  disabled = false,
  errorMessage = null,
  onBack,
  onSubmit,
}: SignInFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event): void => {
    event.preventDefault();
    void onSubmit({ email: email.trim(), password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__fields">
        <div className="field">
          <label className="field__label" htmlFor="auth-signin-email">
            Email
          </label>

          <input
            id="auth-signin-email"
            className="input input--sm input--full"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled}
            placeholder="joe@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="auth-signin-password">
            Password
          </label>

          <input
            id="auth-signin-password"
            className="input input--sm input--full"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={disabled}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="field__error">{errorMessage}</p>
      ) : null}

      <div className="auth-form__actions">
        <button
          className="button button--solid button--sm button--full"
          type="submit"
          disabled={disabled}
        >
          <span className="button__label">Sign in</span>
        </button>

        {onBack ? (
          <button
            className="button"
            type="button"
            onClick={onBack}
            disabled={disabled}
          >
            <span className="button__label">← Other sign in options</span>
          </button>
        ) : null}
      </div>
    </form>
  );
};

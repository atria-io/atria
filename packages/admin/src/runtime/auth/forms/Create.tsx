import { useState, type SubmitEventHandler } from "react";

export interface CreateValues {
  name: string;
  email: string;
  password: string;
}

interface CreateFormProps {
  disabled?: boolean;
  errorMessage?: string | null;
  onBack?: (() => void) | undefined;
  onSubmit: (values: CreateValues) => Promise<void> | void;
}

export const CreateForm = ({
  disabled = false,
  errorMessage = null,
  onBack,
  onSubmit,
}: CreateFormProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event): void => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setLocalError(null);
    const name = [firstName.trim(), lastName.trim()].filter((value) => value !== "").join(" ");
    void onSubmit({ name, email: email.trim(), password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="auth-card__text">Use your email and password to create the owner account.</p>

      <div className="auth-form__field">
        <label htmlFor="auth-create-first-name">First name</label>
        <input
          id="auth-create-first-name"
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
        <label htmlFor="auth-create-last-name">Last name</label>
        <input
          id="auth-create-last-name"
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
        <label htmlFor="auth-create-email">Email</label>
        <input
          id="auth-create-email"
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
        <label htmlFor="auth-create-password">Password</label>
        <input
          id="auth-create-password"
          className="auth-form__input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          required
        />
      </div>

      <div className="auth-form__field">
        <label htmlFor="auth-create-confirm-password">Confirm password</label>
        <input
          id="auth-create-confirm-password"
          className="auth-form__input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          required
        />
      </div>

      {localError ? <p className="auth-form__error">{localError}</p> : null}
      {errorMessage ? <p className="auth-form__error">{errorMessage}</p> : null}

      <button type="submit" className="auth-card__button" disabled={disabled}>
        Create account
      </button>

      {onBack ? (
        <button type="button" className="auth-card__switch" onClick={onBack} disabled={disabled}>
          Other sign in options
        </button>
      ) : null}
    </form>
  );
};

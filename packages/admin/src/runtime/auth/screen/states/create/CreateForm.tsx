import { toLoadingButtonClass } from "../../../services/models/loading.js";
import type { CreateOwnerValues } from "../../../types.js";
import { useCreateFormModel } from "./modelForm.js";

interface CreateOwnerFormProps {
  disabled?: boolean;
  errorMessage?: string | null;
  onBack?: (() => void) | undefined;
  onSubmit: (values: CreateOwnerValues) => Promise<void> | void;
}

export const CreateForm = ({
  disabled = false,
  errorMessage = null,
  onBack,
  onSubmit,
}: CreateOwnerFormProps) => {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    localError,
    handleSubmit
  } = useCreateFormModel({ onSubmit });

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="auth-card__text">
        Use your email and password to create the owner account.
      </p>

      <div className="auth-form__fields">
        <div className="field">
          <label
            className="field__label"
            htmlFor="auth-create-first-name"
          >
            First name
          </label>

          <input
            id="auth-create-first-name"
            className="input input--sm input--full"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={disabled}
            placeholder="Joe"
            autoComplete="given-name"
            maxLength={80}
            required
          />
        </div>

        <div className="field">
          <label
            className="field__label"
            htmlFor="auth-create-last-name"
          >
            Last name
          </label>

          <input
            id="auth-create-last-name"
            className="input input--sm input--full"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={disabled}
            placeholder="Doe"
            autoComplete="family-name"
            maxLength={80}
            required
          />
        </div>

        <div className="field">
          <label
            className="field__label"
            htmlFor="auth-create-email"
          >
            Email
          </label>

          <input
            id="auth-create-email"
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
          <label
            className="field__label"
            htmlFor="auth-create-password"
          >
            Password
          </label>

          <input
            id="auth-create-password"
            className="input input--sm input--full"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={disabled}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="field">
          <label
            className="field__label"
            htmlFor="auth-create-confirm-password"
          >
            Confirm password
          </label>

          <input
            id="auth-create-confirm-password"
            className="input input--sm input--full"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={disabled}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {(localError || errorMessage) ? (
        <div className="auth-form__feedback">
          {localError ? <p className="field__error">{localError}</p> : null}
          {errorMessage ? <p className="field__error">{errorMessage}</p> : null}
        </div>
      ) : null}

      <div className="auth-form__actions">
        <button
          type="submit"
          className={toLoadingButtonClass(
            "button button--solid button--sm button--full",
            disabled
          )}
          disabled={disabled}
        >
          {disabled ? (
            <span className="button__spinner" aria-hidden="true" />
          ) : (
            <span className="button__label">Create account</span>
          )}
        </button>

        {onBack ? (
          <button
            type="button"
            className="button"
            onClick={onBack}
            disabled={disabled}
          >
            <span className="button__label">
              ← Other sign up options
            </span>
          </button>
        ) : null}
      </div>
    </form>
  );
};

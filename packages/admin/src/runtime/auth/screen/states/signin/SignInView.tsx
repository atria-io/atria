import { SignInForm } from "./SignInForm.js";
import { useSignIn } from "../../../services/models/signIn.js";
import { ButtonProviders } from "../../shared/ButtonProviders.js";

export const SignInView = () => {
  const {
    errorMessage,
    showEmailForm,
    onEnableEmailForm,
    onBackToProviderOptions,
    onSubmitSignIn,
  } = useSignIn();

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">
          <span>Sign in</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Access your workspace</span>
        </div>
      </div>

      <div
        key={showEmailForm ? "email" : "providers"}
        className="auth-card__content card-transition">
        {!showEmailForm ? (
          <>
            <ButtonProviders mode="sign-in" />
            <div className="auth-card__actions">
              <button
                type="button"
                className="button button--solid button--sm button--full auth-provider-button"
                onClick={onEnableEmailForm}
              >
                <span className="button__label">Continue with Email</span>
              </button>
            </div>
          </>
        ) : (
          <SignInForm errorMessage={null} onSubmit={onSubmitSignIn} onBack={onBackToProviderOptions} />
        )}
      </div>
      {errorMessage ? <div className="auth-screen__message">
        <p className="auth-card__error">{errorMessage}</p>
      </div> : null}
    </div>
  );
};

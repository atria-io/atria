import { LoginForm } from "../forms/LoginForm.js";
import { useSignIn } from "../logic/signIn.js";
import { AuthProviderActions } from "./AuthProviderActions.js";

export const LoginView = () => {
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
          <span>Login</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Access your workspace</span>
        </div>
      </div>

      {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}

      <div className="auth-card__content">
        {!showEmailForm ? (
          <>
            <AuthProviderActions mode="login" />
            <div className="auth-card__actions">
              <button
                type="button"
                className="auth-provider-button auth-provider-button--plain"
                onClick={onEnableEmailForm}
              >
                <span>Continue with Email</span>
              </button>
            </div>
          </>
        ) : (
          <LoginForm errorMessage={null} onSubmit={onSubmitSignIn} onBack={onBackToProviderOptions} />
        )}
      </div>
    </div>
  );
};

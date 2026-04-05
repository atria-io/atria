import { useEffect, useState } from "react";
import { LoginForm } from "../forms/Login.js";
import { AuthProviderActions } from "./AuthProviderActions.js";
import { clearAuthLoginErrorCookie, readAuthLoginErrorCookie } from "./authLoginErrorCookie.js";

const LOGIN_ERROR_MESSAGE = "Could not complete browser sign-in. Please try again.";

export const LoginView = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const signal = readAuthLoginErrorCookie();
    if (signal === "oauth_failed") {
      setErrorMessage(LOGIN_ERROR_MESSAGE);
      clearAuthLoginErrorCookie();
    }
  }, []);

  const handleLogin = async (values: { email: string; password: string }): Promise<void> => {
    setErrorMessage(null);

    const response = await fetch("/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setErrorMessage(LOGIN_ERROR_MESSAGE);
  };

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
                onClick={() => {
                  setErrorMessage(null);
                  setShowEmailForm(true);
                }}
              >
                <span>Continue with Email</span>
              </button>
            </div>
          </>
        ) : (
          <LoginForm
            errorMessage={null}
            onSubmit={handleLogin}
            onBack={() => {
              setErrorMessage(null);
              setShowEmailForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

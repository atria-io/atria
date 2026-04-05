import { useEffect, useState } from "react";
import { CreateForm } from "../forms/Create.js";
import { AuthProviderActions } from "./AuthProviderActions.js";
import { clearAuthLoginErrorCookie, readAuthLoginErrorCookie } from "./authLoginErrorCookie.js";

const OAUTH_ERROR_MESSAGE = "Could not complete browser sign-in. Please try again.";

export const CreateOwnerView = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const signal = readAuthLoginErrorCookie();
    if (signal === "oauth_failed") {
      setErrorMessage(OAUTH_ERROR_MESSAGE);
      clearAuthLoginErrorCookie();
    }
  }, []);

  const handleCreateOwner = async (values: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> => {
    setErrorMessage(null);

    const response = await fetch("/auth/create-owner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setErrorMessage("Could not create owner account. Please try again.");
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">
          <span>Create owner</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Create the first user</span>
        </div>
      </div>

      <div className="auth-card__content">
        {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}

        {!showEmailForm ? (
          <>
            <AuthProviderActions mode="create" />
            <div className="auth-card__actions">
              <button
                type="button"
                className="auth-provider-button auth-provider-button--plain"
                onClick={() => setShowEmailForm(true)}
              >
                <span>Continue with Email</span>
              </button>
            </div>
          </>
        ) : (
          <CreateForm
            errorMessage={errorMessage}
            onSubmit={handleCreateOwner}
            onBack={() => setShowEmailForm(false)}
          />
        )}
      </div>
    </div>
  );
};

import { CreateOwnerForm } from "../forms/CreateOwnerForm.js";
import { useCreateOwner } from "../logic/createOwner.js";
import { AuthProviderActions } from "./AuthProviderActions.js";

export const CreateOwnerView = () => {
  const {
    errorMessage,
    showEmailForm,
    onEnableEmailForm,
    onBackToProviderOptions,
    onSubmitCreateOwner,
  } = useCreateOwner();

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
                onClick={onEnableEmailForm}
              >
                <span>Continue with Email</span>
              </button>
            </div>
          </>
        ) : (
          <CreateOwnerForm
            errorMessage={errorMessage}
            onSubmit={onSubmitCreateOwner}
            onBack={onBackToProviderOptions}
          />
        )}
      </div>
    </div>
  );
};

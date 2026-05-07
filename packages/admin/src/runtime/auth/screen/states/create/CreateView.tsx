import { CreateForm } from "./CreateForm.js";
import { useCreateOwner } from "../../../services/models/createOwner.js";
import { ButtonProviders } from "../../shared/ButtonProviders.js";

export const CreateView = () => {
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

      <div
        key={showEmailForm ? "email" : "providers"}
        className="auth-card__content card-transition">
        {!showEmailForm ? (
          <>
            <ButtonProviders mode="create" />
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
          <CreateForm
            errorMessage={errorMessage}
            onSubmit={onSubmitCreateOwner}
            onBack={onBackToProviderOptions}
          />
        )}
      </div>
      {errorMessage ? <div className="auth-screen__message">
        <p className="auth-card__error">{errorMessage}</p>
      </div> : null}
    </div>
  );
};

import { CreateForm } from "./CreateForm.js";
import { useCreateOwner } from "../../../services/models/createOwner.js";
import { ButtonProviders } from "../../shared/ButtonProviders.js";
import {
  toLoadingButtonClass,
  useEmailFormLoading
} from "../../../services/models/loading.js";

export const CreateView = () => {
  const {
    errorMessage,
    showEmailForm,
    onEnableEmailForm,
    onBackToProviderOptions,
    onSubmitCreateOwner,
  } = useCreateOwner();

  const { isEmailSubmitting, onEnableEmailFormWithLoading } = useEmailFormLoading(
    showEmailForm,
    onEnableEmailForm
  );

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">
          <span>Create owner</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Create the first workspace account</span>
        </div>
      </div>

      <div
        key={showEmailForm ? "email" : "providers"}
        className="auth-card__content">
        {!showEmailForm ? (
          <>
            <ButtonProviders mode="create" />
            <div className="auth-card__actions">
              <button
                type="button"
                className={toLoadingButtonClass(
                  "button button--solid button--sm button--full auth-provider-button",
                  isEmailSubmitting
                )}
                onClick={onEnableEmailFormWithLoading}
                disabled={isEmailSubmitting}
              >
                {isEmailSubmitting ? (
                  <span className="button__spinner" aria-hidden="true" />
                ) : (
                  <span className="button__label">Continue with Email</span>
                )}
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

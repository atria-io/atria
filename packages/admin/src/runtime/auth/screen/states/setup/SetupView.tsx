import { useState } from "react";
import { initializeWorkspace } from "../../../services/http/authApi.js";
import { toLoadingButtonClass } from "../../../services/models/loading.js";

export const SetupView = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetup = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const response = await initializeWorkspace();
    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">
          <span>Setup</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Initialize the workspace</span>
        </div>
      </div>

      <div className="auth-card__content">
        <button
          type="button"
          className={toLoadingButtonClass(
            "button button--solid button--md button--full auth-provider-button",
            isSubmitting
          )}
          onClick={() => void handleSetup()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="button__spinner" aria-hidden="true" />
          ) : (
            <span className="button__label">Continue</span>
          )}
        </button>
      </div>
    </div>
  );
};

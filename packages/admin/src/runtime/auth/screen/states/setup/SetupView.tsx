import { initializeWorkspace } from "../../../services/http/authApi.js";

export const SetupView = () => {
  const handleSetup = async (): Promise<void> => {
    const response = await initializeWorkspace();
    if (response.status === 204) {
      window.location.reload();
    }
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
          className="button button--solid button--sm button--full auth-provider-button"
          onClick={() => void handleSetup()}
        >
          <span className="button__label">Continue</span>
        </button>
      </div>
    </div>
  );
};

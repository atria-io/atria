import { useBrokerConsent } from "../../../services/models/brokerConsent.js";
import { toLoadingButtonClass } from "../../../services/models/loading.js";

export const BrokerView = () => {
  const {
    isSubmitting,
    failure,
    onSubmitConfirm,
    onBackToSignIn
  } = useBrokerConsent();

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">
          <span>Confirm sign-in</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Authorize access to your workspace</span>
        </div>
      </div>

      <div className="auth-card__content">
        {failure ? (
          <>
            <h2 className="auth-card__title">{failure.title}</h2>
            <p className="auth-card__text">{failure.message}</p>
            {failure.retryable ? (
              <form onSubmit={onSubmitConfirm}>
                <button
                  type="submit"
                  className="button button--solid button--md button--full button--has-icon auth-provider-button"
                  disabled={isSubmitting}
                >
                  <span className="button__label">
                    {isSubmitting ? "Retrying..." : "Retry"}
                  </span>
                </button>
              </form>
            ) : null}
            {failure.backToSignIn ? (
              <button type="button" onClick={onBackToSignIn}>
                <span className="button__label">← Back to sign in</span>
              </button>
            ) : null}
          </>
        ) : (
          <>
            <form onSubmit={onSubmitConfirm}>
              <button
              type="submit"
              className={toLoadingButtonClass(
                "button button--solid button--md button--full button--has-icon auth-provider-button",
                isSubmitting
              )}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="button__spinner" aria-hidden="true" />
              ) : (
                <span className="button__label">Confirm</span>
              )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

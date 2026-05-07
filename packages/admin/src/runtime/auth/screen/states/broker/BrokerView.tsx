import { useBrokerConsent } from "../../../services/models/brokerConsent.js";

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
          <span>Broker consent</span>
        </h1>
        <div className="auth-card__header-text">
          <span>Authorize broker access to continue</span>
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
                  className="
                    button button--solid button--sm button--full auth-provider-button"
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
            <p className="auth-card__text">
              Placeholder screen for broker consent confirmation.
            </p>
            <form onSubmit={onSubmitConfirm}>
              <button
              type="submit"
              className="button button--solid button--sm button--full auth-provider-button"
              disabled={isSubmitting}>
                <span className="button__label">
                  {isSubmitting ? "Confirming..." : "Confirm consent"}
                </span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

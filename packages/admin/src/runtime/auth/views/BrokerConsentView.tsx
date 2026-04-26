import { useBrokerConsent } from "../logic/brokerConsent.js";

export const BrokerConsentView = () => {
  const { isSubmitting, failure, onSubmitConfirm, onBackToSignIn } = useBrokerConsent();

  return (
    <section className="auth-screen">
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
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Retrying..." : "Retry"}
                  </button>
                </form>
              ) : null}
              {failure.backToSignIn ? (
                <button type="button" onClick={onBackToSignIn}>
                  Back to sign in
                </button>
              ) : null}
            </>
          ) : (
            <>
              <p className="auth-card__text">
                Placeholder screen for broker consent confirmation.
              </p>
              <form onSubmit={onSubmitConfirm}>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Confirming..." : "Confirm consent"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

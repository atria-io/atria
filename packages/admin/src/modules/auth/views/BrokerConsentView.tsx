export const BrokerConsentView = () => {
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
          <p className="auth-card__text">Placeholder screen for future broker consent flow.</p>
        </div>

        <div className="auth-card__footer">
          <span>Provider flow not connected yet</span>
        </div>
      </div>
    </section>
  );
};

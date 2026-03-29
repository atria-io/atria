import { useMemo, useState, type FormEvent } from "react";

export const BrokerConsentView = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const brokerPayload = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      provider: params.get("provider") ?? "",
      project_id: params.get("project_id") ?? "",
      broker_consent_token: params.get("broker_consent_token") ?? "",
    };
  }, []);

  const handleConfirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setHasError(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/broker/confirm", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(brokerPayload),
      });

      if (response.status === 204) {
        window.location.reload();
        return;
      }

      setHasError(true);
    } catch {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <p className="auth-card__text">Placeholder screen for broker consent confirmation.</p>
          <form onSubmit={(event) => void handleConfirm(event)}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Confirming..." : "Confirm consent"}
            </button>
          </form>
          {hasError ? <p className="auth-card__error">Unable to confirm broker consent.</p> : null}
        </div>

        <div className="auth-card__footer">
          <span>OAuth exchange and broker verification are not connected yet</span>
        </div>
      </div>
    </section>
  );
};

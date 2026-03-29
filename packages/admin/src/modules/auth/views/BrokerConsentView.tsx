import { useMemo, useState, type FormEvent } from "react";

interface BrokerConfirmErrorState {
  title: string;
  message: string;
  retryable: boolean;
  backToLogin: boolean;
}

export const BrokerConsentView = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<BrokerConfirmErrorState | null>(null);

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
    setFailure(null);
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

      const defaultFailure: BrokerConfirmErrorState = {
        title: "Consent confirmation failed",
        message: "Unable to confirm broker consent.",
        retryable: true,
        backToLogin: false,
      };

      try {
        const payload = (await response.json()) as {
          error?: {
            title?: unknown;
            message?: unknown;
            retryable?: unknown;
            backToLogin?: unknown;
          };
        };
        const error = payload.error;
        if (error) {
          setFailure({
            title: typeof error.title === "string" ? error.title : defaultFailure.title,
            message: typeof error.message === "string" ? error.message : defaultFailure.message,
            retryable: typeof error.retryable === "boolean" ? error.retryable : defaultFailure.retryable,
            backToLogin:
              typeof error.backToLogin === "boolean" ? error.backToLogin : defaultFailure.backToLogin,
          });
          return;
        }
      } catch {
        // fall through to default failure
      }

      setFailure(defaultFailure);
    } catch {
      setFailure({
        title: "Connection error",
        message: "Unable to reach broker confirmation endpoint.",
        retryable: true,
        backToLogin: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = (): void => {
    window.location.assign("/");
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
          {failure ? (
            <>
              <h2 className="auth-card__title">{failure.title}</h2>
              <p className="auth-card__text">{failure.message}</p>
              {failure.retryable ? (
                <form onSubmit={(event) => void handleConfirm(event)}>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Retrying..." : "Retry"}
                  </button>
                </form>
              ) : null}
              {failure.backToLogin ? (
                <button type="button" onClick={handleBackToLogin}>
                  Back to login
                </button>
              ) : null}
            </>
          ) : (
            <>
              <p className="auth-card__text">Placeholder screen for broker consent confirmation.</p>
              <form onSubmit={(event) => void handleConfirm(event)}>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Confirming..." : "Confirm consent"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="auth-card__footer">
          <span>OAuth exchange and broker verification are not connected yet</span>
        </div>
      </div>
    </section>
  );
};

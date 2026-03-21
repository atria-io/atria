import React from "react";
import type { TranslateFn } from "../../../i18n/client.js";
import type { ProviderId } from "../../../types/auth.js";

interface AuthBrokerViewProps {
  provider: ProviderId | null;
  projectId: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void> | void;
  t: TranslateFn;
}

export function AuthBrokerView(props: AuthBrokerViewProps): React.JSX.Element {
  const { provider, projectId, errorMessage, isSubmitting, onConfirm, t } = props;

  const providerLabel =
    provider === "google" || provider === "github" ? t(`auth.provider.${provider}`) : "OAuth";

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">{t("auth.title.consent")}</h1>
        <p className="auth-card__text">{t("auth.message.consentLead", { provider: providerLabel })}</p>
        {projectId ? (
          <p className="auth-card__text">{t("auth.message.consentProject", { projectId })}</p>
        ) : null}
        {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}
        <div className="auth-card__actions">
          <button
            type="button"
            className="auth-card__button auth-card__button--primary"
            disabled={isSubmitting}
            onClick={() => {
              void onConfirm();
            }}
          >
            {t("auth.form.consent.submit")}
          </button>
        </div>
      </div>
    </section>
  );
}

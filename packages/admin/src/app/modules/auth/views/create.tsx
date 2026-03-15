import React, { useEffect, useState } from "react";
import type { TranslateFn } from "../../../../i18n/client.js";
import type { ProviderId } from "../../../../types/auth.js";
import { RegisterForm, type RegisterValues } from "../forms/register.js";
import { OAuthProviderButton, type OAuthProvider } from "../components/OAuthProviderButton.js";

interface CreateViewProps {
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isLoading: boolean;
  isFinalizing: boolean;
  isSubmitting: boolean;
  brokerError: boolean;
  formError: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onRegister: (values: RegisterValues) => Promise<void> | void;
  t: TranslateFn;
}

const oauthProviderOrder: OAuthProvider[] = ["google", "github"];

export function CreateView(props: CreateViewProps): React.JSX.Element {
  const {
    providers,
    selectedProvider,
    isLoading,
    isFinalizing,
    isSubmitting,
    brokerError,
    formError,
    onProviderSelect,
    onRegister,
    t
  } = props;

  const [showEmailForm, setShowEmailForm] = useState(selectedProvider === "email");

  useEffect(() => {
    if (selectedProvider === "email") {
      setShowEmailForm(true);
    }
  }, [selectedProvider]);

  const startEmailFlow = (): void => {
    setShowEmailForm(true);
    onProviderSelect("email");
  };

  const backToOptions = (): void => {
    setShowEmailForm(false);
  };

  const hasBrokerError = brokerError && !showEmailForm;

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">{t("auth.title.create")}</h1>

        {isLoading || isFinalizing ? (
          <p className="auth-card__text">{t("auth.message.finalizing")}</p>
        ) : showEmailForm ? (
          <>
            <p className="auth-card__text">{t("auth.message.emailCreateLead")}</p>

            <RegisterForm
              disabled={isSubmitting}
              errorMessage={formError}
              onSubmit={onRegister}
              t={t}
            />

            <button
              type="button"
              className="auth-card__switch"
              disabled={isSubmitting}
              onClick={backToOptions}
            >
              {t("auth.form.otherOptions")}
            </button>
          </>
        ) : (
          <>
            <div className="auth-card__actions">
              {oauthProviderOrder.map((provider) => (
                <OAuthProviderButton
                  key={provider}
                  provider={provider}
                  disabled={isSubmitting || !providers.includes(provider)}
                  onSelect={onProviderSelect}
                  t={t}
                />
              ))}
            </div>

            <p className="auth-card__divider">{t("auth.form.orEmail")}</p>

            <button
              type="button"
              className="auth-provider-button auth-provider-button--plain"
              disabled={isSubmitting || !providers.includes("email")}
              onClick={startEmailFlow}
            >
              <span>{t("auth.provider.email")}</span>
            </button>

            {hasBrokerError ? <p className="auth-card__error">{t("auth.message.brokerFailed")}</p> : null}
          </>
        )}
      </div>
    </section>
  );
}

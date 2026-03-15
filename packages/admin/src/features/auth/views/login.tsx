import React, { useEffect, useState } from "react";
import type { TranslateFn } from "../../../i18n/client.js";
import type { ProviderId } from "../../../types/auth.js";
import { LoginForm, type LoginValues } from "../forms/login.js";
import { OAuthProviderButton, type OAuthProvider } from "../components/OAuthProviderButton.js";

interface LoginViewProps {
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isLoading: boolean;
  isFinalizing: boolean;
  isSubmitting: boolean;
  brokerError: boolean;
  formError: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onLogin: (values: LoginValues) => Promise<void> | void;
  t: TranslateFn;
}

const oauthProviderOrder: OAuthProvider[] = ["google", "github"];

export function LoginView(props: LoginViewProps): React.JSX.Element {
  const {
    providers,
    selectedProvider,
    isLoading,
    isFinalizing,
    isSubmitting,
    brokerError,
    formError,
    onProviderSelect,
    onLogin,
    t
  } = props;

  const [showEmailForm, setShowEmailForm] = useState(selectedProvider === "email");

  useEffect(() => {
    if (selectedProvider === "email") {
      setShowEmailForm(true);
    }
  }, [selectedProvider]);

  const openEmailForm = (): void => {
    setShowEmailForm(true);
    onProviderSelect("email");
  };

  const openProviderOptions = (): void => {
    setShowEmailForm(false);
  };

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">{showEmailForm ? t("auth.title.login") : t("auth.title.chooseProvider")}</h1>

        {isLoading || isFinalizing ? (
          <p className="auth-card__text">{t("auth.message.finalizing")}</p>
        ) : showEmailForm ? (
          <>
            <p className="auth-card__text">{t("auth.message.emailLoginLead")}</p>

            <LoginForm
              disabled={isSubmitting}
              errorMessage={formError}
              onSubmit={onLogin}
              t={t}
            />

            <button
              type="button"
              className="auth-card__switch"
              disabled={isSubmitting}
              onClick={openProviderOptions}
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
              onClick={openEmailForm}
            >
              <span>{t("auth.provider.email")}</span>
            </button>

            {brokerError ? <p className="auth-card__error">{t("auth.message.brokerFailed")}</p> : null}
          </>
        )}
      </div>
    </section>
  );
}

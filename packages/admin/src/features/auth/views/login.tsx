import React from "react";
import type { TranslateFn } from "../../../i18n/client.js";
import type { ProviderId } from "../../../types/auth.js";
import { LoginForm, type LoginValues } from "../forms/login.js";

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

const oauthProviderOrder: ProviderId[] = ["google", "github"];

const providerLabelKey: Record<ProviderId, string> = {
  google: "auth.provider.google",
  github: "auth.provider.github",
  email: "auth.provider.email"
};

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

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">{t("auth.title.login")}</h1>

        {isLoading || isFinalizing ? (
          <p className="auth-card__text">{t("auth.message.finalizing")}</p>
        ) : (
          <>
            <p className="auth-card__text">{t("auth.message.loginLead")}</p>
            <p className="auth-card__text">
              {selectedProvider
                ? t("auth.message.selectedMethod", { provider: t(providerLabelKey[selectedProvider]) })
                : t("auth.message.chooseMethod")}
            </p>
            <p className="auth-card__text">{t("auth.message.loginHelp")}</p>

            {brokerError ? <p className="auth-card__error">{t("auth.message.brokerFailed")}</p> : null}

            <div className="auth-card__actions">
              {oauthProviderOrder.map((provider) => {
                const disabled = isSubmitting || !providers.includes(provider);

                return (
                  <button
                    key={provider}
                    type="button"
                    className="auth-card__button"
                    disabled={disabled}
                    onClick={() => onProviderSelect(provider)}
                  >
                    {t(providerLabelKey[provider])}
                  </button>
                );
              })}
            </div>

            <p className="auth-card__divider">{t("auth.form.orEmail")}</p>

            <LoginForm
              disabled={isSubmitting}
              errorMessage={formError}
              onSubmit={onLogin}
              t={t}
            />
          </>
        )}
      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";
import type { TranslateFn } from "../../../../i18n/client.js";
import type { ProviderId } from "../../../../types/auth.js";
import { OAuthProviderButton, type OAuthProvider } from "../components/OAuthProviderButton.js";
import { LoginForm, type LoginValues } from "../forms/login.js";
import { RegisterForm, type RegisterValues } from "../forms/register.js";

interface AuthViewProps {
  mode: "login" | "create";
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isSubmitting: boolean;
  brokerError: boolean;
  formError: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onLogin: (values: LoginValues) => Promise<void> | void;
  onRegister: (values: RegisterValues) => Promise<void> | void;
  t: TranslateFn;
}

const oauthProviders: OAuthProvider[] = ["google", "github"];

export function AuthView(props: AuthViewProps): React.JSX.Element {
  const {
    mode,
    providers,
    selectedProvider,
    isSubmitting,
    brokerError,
    formError,
    onProviderSelect,
    onLogin,
    onRegister,
    t
  } = props;

  const [showEmailForm, setShowEmailForm] = useState(selectedProvider === "email");

  useEffect(() => {
    if (selectedProvider === "email") {
      setShowEmailForm(true);
    }
  }, [selectedProvider]);

  const isLogin = mode === "login";

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">
          {showEmailForm
            ? t(isLogin ? "auth.title.login" : "auth.title.create")
            : t(isLogin ? "auth.title.chooseProvider" : "auth.title.create")}
        </h1>

        {showEmailForm ? (
          <>
            <p className="auth-card__text">
              {t(isLogin ? "auth.message.emailLoginLead" : "auth.message.emailCreateLead")}
            </p>

            {isLogin ? (
              <LoginForm disabled={isSubmitting} errorMessage={formError} onSubmit={onLogin} t={t} />
            ) : (
              <RegisterForm
                disabled={isSubmitting}
                errorMessage={formError}
                onSubmit={onRegister}
                t={t}
              />
            )}

            <button
              type="button"
              className="auth-card__switch"
              disabled={isSubmitting}
              onClick={() => setShowEmailForm(false)}
            >
              {t("auth.form.otherOptions")}
            </button>
          </>
        ) : (
          <>
            <div className="auth-card__actions">
              {oauthProviders.map((provider) => (
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
              onClick={() => {
                setShowEmailForm(true);
                onProviderSelect("email");
              }}
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

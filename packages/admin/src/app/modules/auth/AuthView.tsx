import React, { useEffect, useState } from "react";
import type { TranslateFn } from "../../../i18n/client.js";
import type { ProviderId } from "../../../types/auth.js";
import { OAuthProviderButton, type OAuthProvider } from "./components/OAuthProviderButton.js";
import { LoginForm, type LoginValues } from "./forms/Login.js";
import { RegisterForm, type RegisterValues } from "./forms/Register.js";

interface AuthViewProps {
  mode: "login" | "create";
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isSubmitting: boolean;
  isOAuthRedirecting: boolean;
  brokerError: boolean;
  formError: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onLogin: (values: LoginValues) => Promise<void> | void;
  onRegister: (values: RegisterValues) => Promise<void> | void;
  t: TranslateFn;
}

const oauthProviders: OAuthProvider[] = ["google", "github"];
type FooterView = "auth" | "privacy" | "help";

export function AuthView(props: AuthViewProps): React.JSX.Element {
  const {
    mode,
    providers,
    selectedProvider,
    isSubmitting,
    isOAuthRedirecting,
    brokerError,
    formError,
    onProviderSelect,
    onLogin,
    onRegister,
    t
  } = props;

  const [showEmailForm, setShowEmailForm] = useState(selectedProvider === "email");
  const [footerView, setFooterView] = useState<FooterView>("auth");

  useEffect(() => {
    if (selectedProvider === "email") {
      setShowEmailForm(true);
    }
  }, [selectedProvider]);

  const isLogin = mode === "login";
  const isBusy = isSubmitting || isOAuthRedirecting;

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">
            <span>
              {showEmailForm
                ? t(isLogin ? "auth.title.login" : "auth.title.create")
                : t(isLogin ? "auth.title.chooseProvider" : "auth.title.create")}
            </span>
          </h1>
          <div className="auth-card__header-text">
            <span>
              This studio is not registered and cannot access your content yet. Choose how you want to connect it.
            </span>
          </div>
        </div>
        <div className="auth-card__content">
          {footerView === "auth"
            ? (showEmailForm ? (
              <>
                <p className="auth-card__text">
                  {t(isLogin ? "auth.message.emailLoginLead" : "auth.message.emailCreateLead")}
                </p>

                {isLogin ? (
                  <LoginForm disabled={isBusy} errorMessage={formError} onSubmit={onLogin} t={t} />
                ) : (
                  <RegisterForm
                    disabled={isBusy}
                    errorMessage={formError}
                    onSubmit={onRegister}
                    t={t}
                  />
                )}

                <button
                  type="button"
                  className="auth-card__switch"
                  disabled={isBusy}
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
                      disabled={isBusy || !providers.includes(provider)}
                      isLoading={isBusy && selectedProvider === provider}
                      onSelect={onProviderSelect}
                      t={t}
                    />
                  ))}
                </div>

                <div className="auth-card__divider">
                  <span className="auth-card__divider-text">{t("auth.form.orEmail")}</span>
                </div>

                <div className="auth-card__actions">
                  <button
                    type="button"
                    className="auth-provider-button auth-provider-button--plain"
                    disabled={isBusy || !providers.includes("email")}
                    onClick={() => {
                      setShowEmailForm(true);
                      onProviderSelect("email");
                    }}
                  >
                    <span>{t("auth.provider.email")}</span>
                  </button>
                </div>

                {brokerError ? <p className="auth-card__error">{t("auth.message.brokerFailed")}</p> : null}
              </>
            ))
            : (
              <>
                <p className="auth-card__text">
                  {footerView === "privacy"
                    ? "Privacy page placeholder."
                    : "Help page placeholder."}
                </p>
                <button
                  type="button"
                  className="auth-card__switch"
                  onClick={() => setFooterView("auth")}
                >
                  Back
                </button>
              </>
            )}
        </div>
        <div className="auth-card__footer">
          <button
            type="button"
            className="auth-card__footer-link"
            onClick={() => setFooterView("privacy")}
          >
            <span>Privacy</span>
          </button>
          <button
            type="button"
            className="auth-card__footer-link"
            onClick={() => setFooterView("help")}
          >
            <span>Need help -&gt;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

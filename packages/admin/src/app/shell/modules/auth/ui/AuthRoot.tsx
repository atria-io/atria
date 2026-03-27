import React from "react";
import type { ProviderId } from "../../../../types/auth.js";
import type { LoginValues } from "../forms/Login.js";
import type { RegisterValues } from "../forms/Register.js";
import { AuthViewCreateLogin } from "../views/AuthViewCreateLogin.js";
import { AuthViewEmailForm } from "../views/AuthViewEmailForm.js";
import { AuthViewNeedHelp } from "../views/AuthViewNeedHelp.js";
import { AuthViewPrivacy } from "../views/AuthViewPrivacy.js";
import { AuthViewBrokerConsent } from "../views/AuthViewBrokerConsent.js";
import type { AuthScreen } from "../core/reducer.js";

interface AuthRootProps {
  screen: AuthScreen;
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isBusy: boolean;
  brokerError: boolean;
  formError: string | null;
  isPendingSetup: boolean;
  showBackButton: boolean;
  hasPendingBrokerConsent: boolean;
  brokerProvider: ProviderId | null;
  brokerProjectId: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onLogin: (values: LoginValues) => Promise<void> | void;
  onRegister: (values: RegisterValues) => Promise<void> | void;
  onOpenEmailForm: () => void;
  onBack: () => void;
  onOpenPrivacy: () => void;
  onOpenHelp: () => void;
  onBrokerConsentConfirm: () => Promise<void>;
  t: (key: string) => string;
}

/**
 * Pure auth UI shell. Renders screen based on state.
 * Zero URL handling, zero fetch, zero complex logic.
 */
export function AuthRoot(props: AuthRootProps): React.JSX.Element {
  const {
    screen,
    providers,
    selectedProvider,
    isBusy,
    brokerError,
    formError,
    isPendingSetup,
    showBackButton,
    hasPendingBrokerConsent,
    brokerProvider,
    brokerProjectId,
    onProviderSelect,
    onLogin,
    onRegister,
    onOpenEmailForm,
    onBack,
    onOpenPrivacy,
    onOpenHelp,
    onBrokerConsentConfirm,
    t
  } = props;

  const title = screen === "email"
    ? t(isPendingSetup ? "auth.title.create" : "auth.title.login")
    : t(isPendingSetup ? "auth.title.create" : "auth.title.chooseProvider");

  const footerLinkClassName = "auth-card__footer-link";
  const footerLinksClassName = "auth-card__footer-links";

  // If broker consent is pending, render that view instead
  if (hasPendingBrokerConsent) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <AuthViewBrokerConsent
            provider={brokerProvider}
            projectId={brokerProjectId}
            errorMessage={formError}
            isSubmitting={isBusy}
            onConfirm={onBrokerConsentConfirm}
            t={t}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">
            <span>{title}</span>
          </h1>
          <div className="auth-card__header-text">
            <span>
              {t("auth.message.unregisteredStudioLead")}
            </span>
          </div>
        </div>
        <div className="auth-card__content">
          {screen === "email" ? (
            <AuthViewEmailForm
              mode={isPendingSetup ? "create" : "login"}
              isBusy={isBusy}
              formError={formError}
              onLogin={onLogin}
              onRegister={onRegister}
              t={t}
            />
          ) : screen === "provider" ? (
            <AuthViewCreateLogin
              providers={providers}
              selectedProvider={selectedProvider}
              isBusy={isBusy}
              brokerError={brokerError}
              onProviderSelect={onProviderSelect}
              onOpenEmailForm={onOpenEmailForm}
              t={t}
            />
          ) : screen === "privacy" ? (
            <AuthViewPrivacy />
          ) : (
            <AuthViewNeedHelp />
          )}
        </div>
        <div className="auth-card__footer">
          {showBackButton ? (
            <>
              <button
                type="button"
                className={footerLinkClassName}
                disabled={isBusy}
                onClick={onBack}
              >
                <span>
                  ← {screen === "email" ? t("auth.form.otherOptions") : t("auth.footer.back")}
                </span>
              </button>
              {screen === "privacy" ? (
                <button
                  type="button"
                  className={footerLinkClassName}
                  onClick={onOpenHelp}
                >
                  <span>{t("auth.footer.needHelpArrow")}</span>
                </button>
              ) : screen === "help" ? (
                <button
                  type="button"
                  className={footerLinkClassName}
                  onClick={onOpenPrivacy}
                >
                  <span>{t("auth.footer.privacy")}</span>
                </button>
              ) : (
                <div className={footerLinksClassName}>
                  <button
                    type="button"
                    className={footerLinkClassName}
                    onClick={onOpenPrivacy}
                  >
                    <span>{t("auth.footer.privacy")}</span>
                  </button>
                  <span className="auth-card__footer-separator">&bull;</span>
                  <button
                    type="button"
                    className={footerLinkClassName}
                    onClick={onOpenHelp}
                  >
                    <span>{t("auth.footer.needHelp")}</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className={footerLinkClassName}
                onClick={onOpenPrivacy}
              >
                <span>{t("auth.footer.privacy")}</span>
              </button>
              <button
                type="button"
                className={footerLinkClassName}
                onClick={onOpenHelp}
              >
                <span>{t("auth.footer.needHelpArrow")}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

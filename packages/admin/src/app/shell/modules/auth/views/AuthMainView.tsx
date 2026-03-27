import React from "react";
import type { TranslateFn } from "../../../../../i18n/client.js";
import type { ProviderId } from "../../../../../types/auth.js";
import type { LoginValues } from "../forms/Login.js";
import type { RegisterValues } from "../forms/Register.js";
import { AuthViewCreateLogin } from "./AuthViewCreateLogin.js";
import { AuthViewEmailForm } from "./AuthViewEmailForm.js";
import { AuthViewNeedHelp } from "./AuthViewNeedHelp.js";
import { AuthViewPrivacy } from "./AuthViewPrivacy.js";

type AuthMainScreen = "provider" | "email" | "privacy" | "help";

interface AuthMainViewProps {
  mode: "login" | "create";
  title: string;
  screen: AuthMainScreen;
  showBackFooter: boolean;
  contentClassName: string;
  footerTransitionClassName: string;
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isBusy: boolean;
  brokerError: boolean;
  formError: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onLogin: (values: LoginValues) => Promise<void> | void;
  onRegister: (values: RegisterValues) => Promise<void> | void;
  onOpenEmailForm: () => void;
  onOpenPrivacyRoute: () => void;
  onOpenNeedHelpRoute: () => void;
  onBackFromRoutePage: () => void;
  t: TranslateFn;
}

export function AuthMainView(props: AuthMainViewProps): React.JSX.Element {
  const {
    mode,
    title,
    screen,
    showBackFooter,
    contentClassName,
    footerTransitionClassName,
    providers,
    selectedProvider,
    isBusy,
    brokerError,
    formError,
    onProviderSelect,
    onLogin,
    onRegister,
    onOpenEmailForm,
    onOpenPrivacyRoute,
    onOpenNeedHelpRoute,
    onBackFromRoutePage,
    t
  } = props;
  const footerLinkClassName = [
    "auth-card__footer-link",
    footerTransitionClassName
  ]
    .filter(Boolean)
    .join(" ");
  const footerLinksClassName = [
    "auth-card__footer-links",
    footerTransitionClassName
  ]
    .filter(Boolean)
    .join(" ");

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
        <div className={contentClassName}>
          {screen === "email" ? (
            <AuthViewEmailForm
              mode={mode}
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
          {showBackFooter ? (
            <>
              <button
                type="button"
                className={footerLinkClassName}
                disabled={isBusy}
                onClick={onBackFromRoutePage}
              >
                <span>
                  ← {screen === "email" ? t("auth.form.otherOptions") : t("auth.footer.back")}
                </span>
              </button>
              {screen === "privacy" ? (
                <button
                  type="button"
                  className={footerLinkClassName}
                  onClick={onOpenNeedHelpRoute}
                >
                  <span>{t("auth.footer.needHelpArrow")}</span>
                </button>
              ) : screen === "help" ? (
                <button
                  type="button"
                  className={footerLinkClassName}
                  onClick={onOpenPrivacyRoute}
                >
                  <span>{t("auth.footer.privacy")}</span>
                </button>
              ) : (
                <div className={footerLinksClassName}>
                  <button
                    type="button"
                    className={footerLinkClassName}
                    onClick={onOpenPrivacyRoute}
                  >
                    <span>{t("auth.footer.privacy")}</span>
                  </button>
                  <span className="auth-card__footer-separator">&bull;</span>
                  <button
                    type="button"
                    className={footerLinkClassName}
                    onClick={onOpenNeedHelpRoute}
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
                onClick={onOpenPrivacyRoute}
              >
                <span>{t("auth.footer.privacy")}</span>
              </button>
              <button
                type="button"
                className={footerLinkClassName}
                onClick={onOpenNeedHelpRoute}
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

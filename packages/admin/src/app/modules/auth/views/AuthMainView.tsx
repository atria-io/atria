import React from "react";
import type { TranslateFn } from "../../../../i18n/client.js";
import type { ProviderId } from "../../../../types/auth.js";
import type { LoginValues } from "../forms/Login.js";
import type { RegisterValues } from "../forms/Register.js";
import { AuthViewCreateLogin } from "./AuthViewCreateLogin.js";
import { AuthViewEmailForm } from "./AuthViewEmailForm.js";
import { AuthViewNeedHelp } from "./AuthViewNeedHelp.js";
import { AuthViewPrivacy } from "./AuthViewPrivacy.js";

interface AuthMainViewProps {
  mode: "login" | "create";
  title: string;
  footerView: "auth" | "privacy" | "help";
  showEmailForm: boolean;
  showCreateRouteFooter: boolean;
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
    footerView,
    showEmailForm,
    showCreateRouteFooter,
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
          {footerView === "auth" ? (
            showEmailForm ? (
              <AuthViewEmailForm
                mode={mode}
                isBusy={isBusy}
                formError={formError}
                onLogin={onLogin}
                onRegister={onRegister}
                t={t}
              />
            ) : (
              <AuthViewCreateLogin
                providers={providers}
                selectedProvider={selectedProvider}
                isBusy={isBusy}
                brokerError={brokerError}
                onProviderSelect={onProviderSelect}
                onOpenEmailForm={onOpenEmailForm}
                t={t}
              />
            )
          ) : footerView === "privacy" ? (
            <AuthViewPrivacy />
          ) : (
            <AuthViewNeedHelp />
          )}
        </div>
        <div className="auth-card__footer">
          {showCreateRouteFooter ? (
            <>
              <button
                type="button"
                className={footerLinkClassName}
                disabled={isBusy}
                onClick={onBackFromRoutePage}
              >
                <span>
                  ← {showEmailForm && footerView === "auth" ? t("auth.form.otherOptions") : t("auth.footer.back")}
                </span>
              </button>
              {footerView === "privacy" ? (
                <button
                  type="button"
                  className={footerLinkClassName}
                  onClick={onOpenNeedHelpRoute}
                >
                  <span>{t("auth.footer.needHelpArrow")}</span>
                </button>
              ) : footerView === "help" ? (
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

import React from "react";
import type { TranslateFn } from "../../../../i18n/client.js";
import type { ProviderId } from "../../../../types/auth.js";
import { OAuthProviderButton, type OAuthProvider } from "../components/OAuthProviderButton.js";

interface AuthViewCreateLoginProps {
  providers: ProviderId[];
  selectedProvider: ProviderId | null;
  isBusy: boolean;
  brokerError: boolean;
  onProviderSelect: (provider: ProviderId) => void;
  onOpenEmailForm: () => void;
  t: TranslateFn;
}

const oauthProviders: OAuthProvider[] = ["google", "github"];

export function AuthViewCreateLogin(props: AuthViewCreateLoginProps): React.JSX.Element {
  const {
    providers,
    selectedProvider,
    isBusy,
    brokerError,
    onProviderSelect,
    onOpenEmailForm,
    t
  } = props;

  return (
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
          onClick={onOpenEmailForm}
        >
          <span>{t("auth.provider.email")}</span>
        </button>
      </div>

      {brokerError ? <p className="auth-card__error">{t("auth.message.brokerFailed")}</p> : null}
    </>
  );
}

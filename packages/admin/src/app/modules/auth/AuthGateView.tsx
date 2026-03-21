import React from "react";
import type { TranslateFn } from "../../../i18n/client.js";
import type { ProviderId } from "../../../types/auth.js";
import type { RegisterValues } from "./forms/register.js";
import type { LoginValues } from "./forms/login.js";
import { AuthView } from "./AuthView.js";
import { AuthBrokerView } from "./AuthBrokerView.js";

interface AuthGateViewProps {
  isLoading: boolean;
  isFinalizing: boolean;
  hasPendingBrokerConsent: boolean;
  provider: ProviderId | null;
  projectId: string | null;
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
  onBrokerConsentConfirm: () => Promise<void> | void;
  t: TranslateFn;
}

export function AuthGateView(props: AuthGateViewProps): React.JSX.Element {
  const {
    isLoading,
    isFinalizing,
    hasPendingBrokerConsent,
    provider,
    projectId,
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
    onBrokerConsentConfirm,
    t
  } = props;

  if (isLoading || isFinalizing) {
    return <section className="auth-screen" aria-hidden="true" />;
  }

  if (hasPendingBrokerConsent) {
    return (
      <AuthBrokerView
        provider={provider}
        projectId={projectId}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onConfirm={onBrokerConsentConfirm}
        t={t}
      />
    );
  }

  return (
    <AuthView
      mode={mode}
      providers={providers}
      selectedProvider={selectedProvider}
      isSubmitting={isSubmitting}
      isOAuthRedirecting={isOAuthRedirecting}
      brokerError={brokerError}
      formError={formError}
      onProviderSelect={onProviderSelect}
      onLogin={onLogin}
      onRegister={onRegister}
      t={t}
    />
  );
}

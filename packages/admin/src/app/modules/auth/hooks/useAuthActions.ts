import { useCallback } from "react";
import { resolveBasePathUrl } from "../../../../state/api.client.js";
import type { ProviderId } from "../../../../types/auth.js";
import type { RegisterValues } from "../forms/register.js";
import type { LoginValues } from "../forms/login.js";
import {
  confirmBrokerConsent,
  loginWithEmail,
  registerWithEmail
} from "../http/auth.api.js";

interface UseAuthActionsOptions {
  basePath: string;
  nextPath: string;
  brokerConsentToken: string | null;
  t: (key: string) => string;
  setActiveProvider: (provider: ProviderId | null) => void;
  setAuthError: (value: string | null) => void;
  setIsAuthSubmitting: (value: boolean) => void;
  startOAuthRedirect: (provider: ProviderId) => void;
}

interface UseAuthActionsResult {
  handleProviderSelect: (provider: ProviderId) => void;
  handleRegister: (values: RegisterValues) => Promise<void>;
  handleLogin: (values: LoginValues) => Promise<void>;
  handleBrokerConsentConfirm: () => Promise<void>;
  handleLogout: () => void;
}

export const useAuthActions = (options: UseAuthActionsOptions): UseAuthActionsResult => {
  const {
    basePath,
    nextPath,
    brokerConsentToken,
    t,
    setActiveProvider,
    setAuthError,
    setIsAuthSubmitting,
    startOAuthRedirect
  } = options;

  const handleProviderSelect = useCallback(
    (provider: ProviderId): void => {
      if (provider === "email") {
        setActiveProvider(provider);
        setAuthError(null);
        return;
      }

      startOAuthRedirect(provider);
    },
    [setActiveProvider, setAuthError, startOAuthRedirect]
  );

  const handleRegister = useCallback(
    async (values: RegisterValues): Promise<void> => {
      setActiveProvider("email");
      setAuthError(null);
      setIsAuthSubmitting(true);

      const result = await registerWithEmail(basePath, values);

      if (result.ok && result.authenticated) {
        window.location.replace(nextPath);
        return;
      }

      setAuthError(result.error ?? t("auth.error.createDefault"));
      setIsAuthSubmitting(false);
    },
    [basePath, nextPath, setActiveProvider, setAuthError, setIsAuthSubmitting, t]
  );

  const handleLogin = useCallback(
    async (values: LoginValues): Promise<void> => {
      setActiveProvider("email");
      setAuthError(null);
      setIsAuthSubmitting(true);

      const result = await loginWithEmail(basePath, values);

      if (result.ok && result.authenticated) {
        window.location.replace(nextPath);
        return;
      }

      setAuthError(result.error ?? t("auth.error.loginDefault"));
      setIsAuthSubmitting(false);
    },
    [basePath, nextPath, setActiveProvider, setAuthError, setIsAuthSubmitting, t]
  );

  const handleBrokerConsentConfirm = useCallback(
    async (): Promise<void> => {
      if (!brokerConsentToken) {
        return;
      }

      setAuthError(null);
      setIsAuthSubmitting(true);

      const result = await confirmBrokerConsent(basePath, brokerConsentToken);
      if (result.ok && result.authenticated) {
        window.location.replace(nextPath);
        return;
      }

      setAuthError(result.error ?? t("auth.error.brokerConsentDefault"));
      setIsAuthSubmitting(false);
    },
    [basePath, brokerConsentToken, nextPath, setAuthError, setIsAuthSubmitting, t]
  );

  const handleLogout = useCallback((): void => {
    const logoutUrl = resolveBasePathUrl(basePath, "/api/auth/logout");
    const loginUrl = resolveBasePathUrl(basePath, "/");

    void fetch(logoutUrl, {
      method: "POST",
      credentials: "include"
    }).finally(() => {
      window.location.replace(loginUrl);
    });
  }, [basePath]);

  return {
    handleProviderSelect,
    handleRegister,
    handleLogin,
    handleBrokerConsentConfirm,
    handleLogout
  };
};

import { useCallback, useEffect, useRef, useState } from "react";
import { buildOAuthStartUrl } from "../http/auth.api.js";
import type { ProviderId } from "../../../../types/auth.js";

const OAUTH_REDIRECT_DELAY_MS = 220;

interface UseOAuthRedirectOptions {
  basePath: string;
  authMode: "login" | "create";
  nextPath: string;
  needsAuthentication: boolean;
  hasPendingBrokerConsent: boolean;
  isLoading: boolean;
  isFinalizing: boolean;
  selectedProvider: ProviderId | null;
  providers: ProviderId[];
  setActiveProvider: (provider: ProviderId | null) => void;
  setAuthError: (value: string | null) => void;
  setBrokerError: (value: boolean) => void;
  setIsAuthSubmitting: (value: boolean) => void;
}

interface UseOAuthRedirectResult {
  isOAuthRedirecting: boolean;
  startOAuthRedirect: (provider: ProviderId) => void;
}

/**
 * Coordinates provider redirect lifecycle so one click produces one
 * redirect attempt. Timer/reset logic prevents stale spinner state when
 * the page is restored from bfcache.
 *
 * @param {UseOAuthRedirectOptions} options
 * @returns {UseOAuthRedirectResult}
 */
export const useOAuthRedirect = (options: UseOAuthRedirectOptions): UseOAuthRedirectResult => {
  const {
    basePath,
    authMode,
    nextPath,
    needsAuthentication,
    hasPendingBrokerConsent,
    isLoading,
    isFinalizing,
    selectedProvider,
    providers,
    setActiveProvider,
    setAuthError,
    setBrokerError,
    setIsAuthSubmitting
  } = options;
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);
  const hasAutoStartedProviderRef = useRef(false);
  const oauthRedirectTimerRef = useRef<number | null>(null);
  const isOAuthRedirectingRef = useRef(false);

  const resetOAuthRedirectState = useCallback((): void => {
    if (oauthRedirectTimerRef.current !== null) {
      window.clearTimeout(oauthRedirectTimerRef.current);
      oauthRedirectTimerRef.current = null;
    }

    isOAuthRedirectingRef.current = false;
    setIsOAuthRedirecting(false);
    setIsAuthSubmitting(false);
  }, [setIsAuthSubmitting]);

  useEffect(
    () => () => {
      resetOAuthRedirectState();
    },
    [resetOAuthRedirectState]
  );

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent): void => {
      if (!event.persisted) {
        return;
      }

      resetOAuthRedirectState();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [resetOAuthRedirectState]);

  const startOAuthRedirect = useCallback(
    (provider: ProviderId): void => {
      if (provider === "email" || isOAuthRedirecting || isOAuthRedirectingRef.current) {
        return;
      }

      isOAuthRedirectingRef.current = true;
      setActiveProvider(provider);
      setAuthError(null);
      setBrokerError(false);
      setIsAuthSubmitting(true);
      setIsOAuthRedirecting(true);

      const target = buildOAuthStartUrl(basePath, provider, authMode, nextPath);
      oauthRedirectTimerRef.current = window.setTimeout(() => {
        oauthRedirectTimerRef.current = null;
        window.location.href = target;
      }, OAUTH_REDIRECT_DELAY_MS);
    },
    [authMode, basePath, isOAuthRedirecting, nextPath, setActiveProvider, setAuthError, setBrokerError, setIsAuthSubmitting]
  );

  useEffect(() => {
    if (
      !needsAuthentication ||
      isLoading ||
      isFinalizing ||
      hasPendingBrokerConsent ||
      hasAutoStartedProviderRef.current
    ) {
      return;
    }

    if (!selectedProvider || selectedProvider === "email") {
      return;
    }

    if (!providers.includes(selectedProvider)) {
      return;
    }

    hasAutoStartedProviderRef.current = true;
    startOAuthRedirect(selectedProvider);
  }, [
    hasPendingBrokerConsent,
    isFinalizing,
    isLoading,
    needsAuthentication,
    providers,
    selectedProvider,
    startOAuthRedirect
  ]);

  return {
    isOAuthRedirecting,
    startOAuthRedirect
  };
};

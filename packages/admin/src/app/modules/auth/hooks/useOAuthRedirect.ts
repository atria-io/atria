import { useCallback, useEffect, useRef, useState } from "react";
import { buildOAuthStartUrl } from "../http/auth.api.js";
import type { ProviderId } from "../../../../types/auth.js";

const OAUTH_BOOT_REVEAL_DELAY_MS = 120;
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

const ensureBootOverlay = (): HTMLElement => {
  const existing = document.getElementById("atria-boot");
  if (existing) {
    return existing;
  }

  const styleId = "atria-boot-fallback-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
#atria-boot {
  inset: 0;
  display: grid;
  position: fixed;
  place-items: center;
  background: var(--boot-bg);
  transition: opacity 0.2s ease;
  z-index: 999999999;
}
#atria-boot.is-hidden {
  opacity: 0;
  pointer-events: none;
}
.atria-boot__spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  animation: atria-boot-spin 0.8s linear infinite;
  border: 2px solid var(--boot-spinner-track);
  border-top-color: var(--boot-spinner);
}
@keyframes atria-boot-spin {
  to {
    transform: rotate(360deg);
  }
}
`;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.id = "atria-boot";
  overlay.setAttribute("aria-hidden", "true");

  const spinner = document.createElement("div");
  spinner.className = "atria-boot__spinner";
  overlay.appendChild(spinner);
  document.body.appendChild(overlay);

  return overlay;
};

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
  const bootRevealTimerRef = useRef<number | null>(null);
  const oauthRedirectTimerRef = useRef<number | null>(null);
  const isOAuthRedirectingRef = useRef(false);

  const resetOAuthRedirectState = useCallback((): void => {
    if (bootRevealTimerRef.current !== null) {
      window.clearTimeout(bootRevealTimerRef.current);
      bootRevealTimerRef.current = null;
    }

    if (oauthRedirectTimerRef.current !== null) {
      window.clearTimeout(oauthRedirectTimerRef.current);
      oauthRedirectTimerRef.current = null;
    }

    isOAuthRedirectingRef.current = false;
    setIsOAuthRedirecting(false);
    setIsAuthSubmitting(false);

    const bootOverlay = document.getElementById("atria-boot");
    if (bootOverlay) {
      bootOverlay.classList.add("is-hidden");
    }
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

      bootRevealTimerRef.current = window.setTimeout(() => {
        bootRevealTimerRef.current = null;
        ensureBootOverlay().classList.remove("is-hidden");
      }, OAUTH_BOOT_REVEAL_DELAY_MS);

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

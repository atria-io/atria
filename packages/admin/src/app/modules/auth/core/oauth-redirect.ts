import { useCallback, useEffect, useRef, Dispatch } from "react";
import type { AuthAction, AuthState } from "./reducer.js";
import { buildOAuthStartUrl } from "../http/auth.api.js";
import type { ProviderId } from "../../../../types/auth.js";

const OAUTH_REDIRECT_DELAY_MS = 220;

interface UseOAuthRedirectOptions {
  basePath: string;
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
}

/**
 * Manages OAuth provider redirect lifecycle.
 * One user click = one redirect attempt (timer + ref prevent duplicates).
 * Auto-starts provider redirect if needed (selectedProvider + !email + ready).
 */
export const useOAuthRedirect = (options: UseOAuthRedirectOptions): {
  isOAuthRedirecting: boolean;
  startOAuthRedirect: (provider: ProviderId) => void;
} => {
  const { basePath, state, dispatch } = options;
  const isOAuthRedirectingRef = useRef(false);
  const oauthRedirectTimerRef = useRef<number | null>(null);
  const hasAutoStartedProviderRef = useRef(false);

  const resetOAuthRedirectState = useCallback((): void => {
    if (oauthRedirectTimerRef.current !== null) {
      window.clearTimeout(oauthRedirectTimerRef.current);
      oauthRedirectTimerRef.current = null;
    }

    isOAuthRedirectingRef.current = false;
    dispatch({ type: "SUBMIT_SUCCESS" });
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      resetOAuthRedirectState();
    };
  }, [resetOAuthRedirectState]);

  // Restore state on bfcache restore
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
      if (
        provider === "email" ||
        isOAuthRedirectingRef.current ||
        state.isBusy
      ) {
        return;
      }

      isOAuthRedirectingRef.current = true;
      dispatch({ type: "SUBMIT_START" });
      dispatch({
        type: "PROVIDER_SELECT",
        payload: { provider }
      });

      const authMode = state.setupStatus.pending ? "create" : "login";
      const target = buildOAuthStartUrl(basePath, provider, authMode, "/");

      oauthRedirectTimerRef.current = window.setTimeout(() => {
        oauthRedirectTimerRef.current = null;
        window.location.href = target;
      }, OAUTH_REDIRECT_DELAY_MS);
    },
    [basePath, state.setupStatus.pending, state.isBusy, dispatch]
  );

  // Auto-start OAuth if provider is pre-selected and ready
  useEffect(() => {
    if (
      !state.selectedProvider ||
      state.selectedProvider === "email" ||
      hasAutoStartedProviderRef.current ||
      state.isLoading ||
      state.isFinalizing ||
      !state.localeBundle
    ) {
      return;
    }

    if (!state.providers.includes(state.selectedProvider)) {
      return;
    }

    hasAutoStartedProviderRef.current = true;
    startOAuthRedirect(state.selectedProvider);
  }, [
    state.selectedProvider,
    state.isLoading,
    state.isFinalizing,
    state.localeBundle,
    state.providers,
    startOAuthRedirect
  ]);

  return {
    isOAuthRedirecting: isOAuthRedirectingRef.current,
    startOAuthRedirect
  };
};

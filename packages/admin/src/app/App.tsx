import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  buildOAuthStartUrl,
  confirmBrokerConsent,
  exchangeBrokerCode,
  loadAuthBootstrapState,
  loginWithEmail,
  registerWithEmail
} from "./modules/auth/auth.api.js";
import { readAuthQueryState } from "./modules/auth/auth.query.js";
import { AuthView } from "./modules/auth/views/AuthView.js";
import { BrokerConsentView } from "./modules/auth/views/BrokerConsentView.js";
import { DashboardScreen } from "./modules/dashboard/DashboardScreen.js";
import { RuntimeStatusView, type RuntimeFlagReason } from "./kernel/runtime/components/RuntimeStatusView.js";
import {
  createTranslator,
  loadLocaleBundle,
  readPreferredLocale
} from "../i18n/client.js";
import type { LocaleBundle } from "../i18n/client.js";
import { createApiClient, resolveBasePathUrl } from "../state/api.client.js";
import type { ProviderId, SessionPayload, SetupStatus } from "../types/auth.js";
import { resolveAdminRoute } from "./kernel/Routes.js";
import { StudioShell } from "./kernel/shell/StudioShell.js";
import { applyRouteStyles } from "./kernel/StyleManager.js";
import type { RegisterValues } from "./modules/auth/forms/register.js";
import type { LoginValues } from "./modules/auth/forms/login.js";

const STUDIO_READY_EVENT = "atria:studio:ready";
const COLOR_SCHEME_STORAGE_KEY = "atria:color-scheme";
const AUTH_STYLE_FILES = ["styles/modules/auth.css"];
const OAUTH_BOOT_REVEAL_DELAY_MS = 120;
const OAUTH_REDIRECT_DELAY_MS = 220;
const SERVER_HEARTBEAT_DELAY_MS = 2_000;
const SERVER_HEARTBEAT_TIMEOUT_MS = 1_500;
const SERVER_HEARTBEAT_PATH = "/api/setup/status";

type ColorScheme = "light" | "dark";
type ColorSchemePreference = "system" | ColorScheme;

declare global {
  interface Window {
    __ATRIA_INITIAL_SCHEME?: string;
  }
}

export interface AdminAppProps {
  basePath: string;
}

const parseColorScheme = (value: string | null | undefined): ColorScheme | null => {
  if (value === "light" || value === "dark") {
    return value;
  }

  return null;
};

const parseColorSchemePreference = (
  value: string | null | undefined
): ColorSchemePreference | null => {
  if (value === "system" || value === "light" || value === "dark") {
    return value;
  }

  return null;
};

const resolveSystemColorScheme = (): ColorScheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolveInitialColorSchemePreference = (): ColorSchemePreference => {
  try {
    const stored = parseColorSchemePreference(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY));
    if (stored) {
      return stored;
    }
  } catch (_error) {}

  const fromWindow = parseColorScheme(window.__ATRIA_INITIAL_SCHEME);
  if (fromWindow) {
    return fromWindow;
  }

  return "system";
};

const clearBrokerQueryParamsFromLocation = (): void => {
  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.delete("broker_code");
  targetUrl.searchParams.delete("code");
  targetUrl.searchParams.delete("broker_consent_token");
  targetUrl.searchParams.delete("project_id");
  targetUrl.searchParams.delete("provider");

  const queryString = targetUrl.searchParams.toString();
  const nextLocation = queryString.length > 0 ? `${targetUrl.pathname}?${queryString}` : targetUrl.pathname;
  window.history.replaceState({}, "", nextLocation);
};

const normalizeLegacyBrokerConsentParamInLocation = (): void => {
  const targetUrl = new URL(window.location.href);
  const legacyToken = targetUrl.searchParams.get("broker_consent_token");
  if (!legacyToken || targetUrl.searchParams.has("code")) {
    return;
  }

  targetUrl.searchParams.set("code", legacyToken);
  targetUrl.searchParams.delete("broker_consent_token");

  const queryString = targetUrl.searchParams.toString();
  const nextLocation = queryString.length > 0 ? `${targetUrl.pathname}?${queryString}` : targetUrl.pathname;
  window.history.replaceState({}, "", nextLocation);
};

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

/**
 * Orchestrates admin bootstrap, auth gating, and shell rendering.
 * This is the only place where setup/session/provider state is synchronized from API responses.
 */
export function AdminApp({ basePath }: AdminAppProps): React.JSX.Element {
  const route = resolveAdminRoute(window.location.pathname);
  const queryState = readAuthQueryState(window.location.search);

  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    pending: true,
    preferredAuthMethod: null
  });
  const [providers, setProviders] = useState<ProviderId[]>([]);
  const [session, setSession] = useState<SessionPayload>({
    authenticated: false,
    user: null
  });
  const [activeProvider, setActiveProvider] = useState<ProviderId | null>(queryState.provider);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [areStylesReady, setAreStylesReady] = useState(false);
  const [brokerError, setBrokerError] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [runtimeFlagReason, setRuntimeFlagReason] = useState<RuntimeFlagReason | null>(null);
  const [colorSchemePreference, setColorSchemePreference] = useState<ColorSchemePreference>(
    resolveInitialColorSchemePreference
  );
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(resolveSystemColorScheme);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  const [localeBundle, setLocaleBundle] = useState<LocaleBundle | null>(null);
  const hasAutoStartedProviderRef = useRef(false);
  const hasDispatchedReadyRef = useRef(false);
  const bootRevealTimerRef = useRef<number | null>(null);
  const oauthRedirectTimerRef = useRef<number | null>(null);
  const isOAuthRedirectingRef = useRef(false);

  const needsAuthentication = setupStatus.pending || !session.authenticated;
  const authMode = setupStatus.pending ? "create" : "login";
  const hasPendingBrokerConsent =
    authMode === "create" &&
    queryState.brokerConsentToken !== null &&
    queryState.brokerCode === null;
  const selectedProvider = activeProvider ?? setupStatus.preferredAuthMethod;
  const activeStyleFiles = needsAuthentication ? AUTH_STYLE_FILES : route.styleFiles;
  const colorScheme = colorSchemePreference === "system" ? systemColorScheme : colorSchemePreference;

  useEffect(() => {
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, colorSchemePreference);
    } catch (_error) {}
  }, [colorSchemePreference]);

  useEffect(() => {
    window.__ATRIA_INITIAL_SCHEME = colorScheme;
  }, [colorScheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent): void => {
      setSystemColorScheme(event.matches ? "dark" : "light");
    };

    setSystemColorScheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    normalizeLegacyBrokerConsentParamInLocation();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;
    let timeoutId: number | null = null;
    let abortController: AbortController | null = null;

    const clearTimers = (): void => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleHeartbeat = (delayMs: number): void => {
      if (cancelled) {
        return;
      }

      timerId = window.setTimeout(() => {
        void checkServerHeartbeat();
      }, delayMs);
    };

    const checkServerHeartbeat = async (): Promise<void> => {
      if (cancelled) {
        return;
      }

      if (!window.navigator.onLine) {
        setRuntimeFlagReason("network_offline");
        scheduleHeartbeat(SERVER_HEARTBEAT_DELAY_MS);
        return;
      }

      abortController = new AbortController();
      timeoutId = window.setTimeout(() => {
        abortController?.abort();
      }, SERVER_HEARTBEAT_TIMEOUT_MS);

      try {
        const response = await fetch(resolveBasePathUrl(basePath, SERVER_HEARTBEAT_PATH), {
          credentials: "include",
          cache: "no-store",
          signal: abortController.signal
        });

        setRuntimeFlagReason(response.ok ? null : "server_unavailable");
      } catch {
        if (!cancelled) {
          setRuntimeFlagReason("server_unreachable");
        }
      } finally {
        abortController = null;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      }

      if (!cancelled) {
        scheduleHeartbeat(SERVER_HEARTBEAT_DELAY_MS);
      }
    };

    const handleOffline = (): void => {
      setRuntimeFlagReason("network_offline");
    };

    const handleOnline = (): void => {
      clearTimers();
      void checkServerHeartbeat();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    void checkServerHeartbeat();

    return () => {
      cancelled = true;
      clearTimers();
      if (abortController) {
        abortController.abort();
      }
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [basePath]);

  useEffect(() => {
    let cancelled = false;
    setAreStylesReady(false);

    void applyRouteStyles(basePath, activeStyleFiles).finally(() => {
      if (!cancelled) {
        setAreStylesReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basePath, activeStyleFiles]);

  useEffect(() => {
    let cancelled = false;

    /**
     * Load locale messages before auth bootstrap to keep all visible errors/transitions translated.
     * Broker exchange is part of bootstrap and must complete before leaving loading state.
     */
    const bootstrap = async (): Promise<void> => {
      const apiClient = createApiClient(basePath);
      const requestedLocale = readPreferredLocale();
      const nextLocaleBundle = await loadLocaleBundle(apiClient, requestedLocale);

      if (cancelled) {
        return;
      }

      setLocaleBundle(nextLocaleBundle);

      const bootstrapState = await loadAuthBootstrapState(apiClient);
      if (cancelled) {
        return;
      }

      setSetupStatus(bootstrapState.setupStatus);
      setProviders(bootstrapState.providers);
      setSession(bootstrapState.session);

      const shouldFinalizeBrokerCode = queryState.brokerCode !== null;
      const shouldFinalizeBrokerConsentForLogin =
        queryState.brokerConsentToken !== null &&
        queryState.brokerCode === null &&
        bootstrapState.setupStatus.pending === false;

      if (shouldFinalizeBrokerCode || shouldFinalizeBrokerConsentForLogin) {
        setIsFinalizing(true);

        const oauthResult = shouldFinalizeBrokerCode
          ? await exchangeBrokerCode(basePath, queryState.brokerCode as string)
          : await confirmBrokerConsent(basePath, queryState.brokerConsentToken as string);

        if (cancelled) {
          return;
        }

        if (oauthResult.ok && oauthResult.authenticated) {
          window.location.replace(queryState.nextPath);
          return;
        }

        if (!bootstrapState.setupStatus.pending) {
          clearBrokerQueryParamsFromLocation();
          setActiveProvider(null);
          setAuthError(null);
        } else {
          setAuthError(oauthResult.error);
        }

        setBrokerError(true);
        setIsFinalizing(false);
      }

      setIsLoading(false);
    };

    void bootstrap().catch((error) => {
      if (!cancelled) {
        setFatalError(error instanceof Error ? error.message : String(error));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basePath, queryState.brokerCode, queryState.brokerConsentToken, queryState.nextPath]);

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
  }, []);

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

      const target = buildOAuthStartUrl(basePath, provider, authMode, queryState.nextPath);
      oauthRedirectTimerRef.current = window.setTimeout(() => {
        oauthRedirectTimerRef.current = null;
        window.location.href = target;
      }, OAUTH_REDIRECT_DELAY_MS);
    },
    [authMode, basePath, isOAuthRedirecting, queryState.nextPath]
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

    /**
     * Preselected OAuth provider should trigger exactly one redirect per page load.
     * Re-running this effect before navigation would create redirect loops.
     */
    hasAutoStartedProviderRef.current = true;
    startOAuthRedirect(selectedProvider);
  }, [
    hasPendingBrokerConsent,
    isOAuthRedirecting,
    isFinalizing,
    isLoading,
    needsAuthentication,
    providers,
    selectedProvider,
    startOAuthRedirect
  ]);

  useEffect(() => {
    if (isLoading || isFinalizing || !areStylesReady || hasDispatchedReadyRef.current) {
      return;
    }

    /**
     * Runtime bootstrap waits for this event to hide the loading overlay.
     * Dispatching early causes unstyled flashes; dispatching multiple times creates racey UI transitions.
     */
    hasDispatchedReadyRef.current = true;
    window.dispatchEvent(new CustomEvent(STUDIO_READY_EVENT));
  }, [areStylesReady, isFinalizing, isLoading]);

  const translator = localeBundle ? createTranslator(localeBundle) : null;
  if (runtimeFlagReason || fatalError) {
    return (
      <RuntimeStatusView
        reason={runtimeFlagReason}
        fatalError={fatalError}
        t={translator}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  if (!localeBundle) {
    return <section className="auth-screen" aria-hidden="true" />;
  }

  const t = translator;
  if (!t) {
    return <section className="auth-screen" aria-hidden="true" />;
  }

  const handleProviderSelect = (provider: ProviderId): void => {
    if (provider === "email") {
      setActiveProvider(provider);
      setAuthError(null);
      return;
    }

    startOAuthRedirect(provider);
  };

  const handleRegister = async (values: RegisterValues): Promise<void> => {
    setActiveProvider("email");
    setAuthError(null);
    setIsAuthSubmitting(true);

    const result = await registerWithEmail(basePath, values);

    if (result.ok && result.authenticated) {
      window.location.replace(queryState.nextPath);
      return;
    }

    setAuthError(result.error ?? t("auth.error.createDefault"));
    setIsAuthSubmitting(false);
  };

  const handleLogin = async (values: LoginValues): Promise<void> => {
    setActiveProvider("email");
    setAuthError(null);
    setIsAuthSubmitting(true);

    const result = await loginWithEmail(basePath, values);

    if (result.ok && result.authenticated) {
      window.location.replace(queryState.nextPath);
      return;
    }

    setAuthError(result.error ?? t("auth.error.loginDefault"));
    setIsAuthSubmitting(false);
  };

  const handleLogout = (): void => {
    const logoutUrl = resolveBasePathUrl(basePath, "/api/auth/logout");
    const loginUrl = resolveBasePathUrl(basePath, "/");

    void fetch(logoutUrl, {
      method: "POST",
      credentials: "include"
    }).finally(() => {
      window.location.replace(loginUrl);
    });
  };

  const handleBrokerConsentConfirm = async (): Promise<void> => {
    if (!queryState.brokerConsentToken) {
      return;
    }

    setAuthError(null);
    setIsAuthSubmitting(true);

    const result = await confirmBrokerConsent(basePath, queryState.brokerConsentToken);
    if (result.ok && result.authenticated) {
      window.location.replace(queryState.nextPath);
      return;
    }

    setAuthError(result.error ?? t("auth.error.brokerConsentDefault"));
    setIsAuthSubmitting(false);
  };

  return (
    <StudioShell
      routeId={needsAuthentication ? authMode : route.id}
      colorScheme={colorScheme}
      colorSchemePreference={colorSchemePreference}
      onColorSchemeChange={setColorSchemePreference}
      user={session.user}
      showHeader={!needsAuthentication}
      menuLabels={{
        system: t("shell.scheme.system"),
        dark: t("shell.scheme.dark"),
        light: t("shell.scheme.light"),
        signOut: t("shell.logout"),
        defaultName: t("shell.user.defaultName"),
        defaultEmail: t("shell.user.defaultEmail")
      }}
      onLogout={!needsAuthentication ? handleLogout : undefined}
    >
      {needsAuthentication ? (
        isLoading || isFinalizing ? (
          <section className="auth-screen" aria-hidden="true" />
        ) : hasPendingBrokerConsent ? (
          <BrokerConsentView
            provider={queryState.provider}
            projectId={queryState.brokerProjectId}
            errorMessage={authError}
            isSubmitting={isAuthSubmitting}
            onConfirm={handleBrokerConsentConfirm}
            t={t}
          />
        ) : (
          <AuthView
            mode={authMode}
            providers={providers}
            selectedProvider={selectedProvider}
            isSubmitting={isAuthSubmitting}
            isOAuthRedirecting={isOAuthRedirecting}
            brokerError={brokerError}
            formError={authError}
            onProviderSelect={handleProviderSelect}
            onLogin={handleLogin}
            onRegister={handleRegister}
            t={t}
          />
        )
      ) : (
        <DashboardScreen />
      )}
    </StudioShell>
  );
}

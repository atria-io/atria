import React, { useEffect, useRef, useState } from "react";
import {
  buildOAuthStartUrl,
  exchangeBrokerCode,
  loadAuthBootstrapState,
  loginWithEmail,
  registerWithEmail
} from "./modules/auth/auth.api.js";
import { readAuthQueryState } from "./modules/auth/auth.query.js";
import { AuthView } from "./modules/auth/views/AuthView.js";
import { DashboardScreen } from "./modules/dashboard/DashboardScreen.js";
import {
  createTranslator,
  loadLocaleBundle,
  persistPreferredLocale,
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

type ColorScheme = "light" | "dark";

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

const resolveInitialColorScheme = (): ColorScheme => {
  const fromWindow = parseColorScheme(window.__ATRIA_INITIAL_SCHEME);
  if (fromWindow) {
    return fromWindow;
  }

  try {
    const stored = parseColorScheme(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY));
    if (stored) {
      return stored;
    }
  } catch (_error) {}

  return "light";
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
  const [loadedAt, setLoadedAt] = useState(() => new Date().toLocaleString());
  const [colorScheme] = useState<ColorScheme>(resolveInitialColorScheme);

  const [localeBundle, setLocaleBundle] = useState<LocaleBundle | null>(null);
  const hasAutoStartedProviderRef = useRef(false);
  const hasDispatchedReadyRef = useRef(false);

  const needsAuthentication = setupStatus.pending || !session.authenticated;
  const authMode = setupStatus.pending ? "create" : "login";
  const selectedProvider = activeProvider ?? setupStatus.preferredAuthMethod;
  const activeStyleFiles = needsAuthentication ? AUTH_STYLE_FILES : route.styleFiles;

  useEffect(() => {
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, colorScheme);
    } catch (_error) {}

    window.__ATRIA_INITIAL_SCHEME = colorScheme;
  }, [colorScheme]);

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

      if (queryState.brokerCode) {
        setIsFinalizing(true);

        const exchanged = await exchangeBrokerCode(apiClient, queryState.brokerCode);
        if (cancelled) {
          return;
        }

        if (exchanged) {
          window.location.replace(queryState.nextPath);
          return;
        }

        setBrokerError(true);
        setIsFinalizing(false);
      }

      setLoadedAt(new Date().toLocaleString());
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
  }, [basePath, queryState.brokerCode, queryState.nextPath]);

  useEffect(() => {
    if (!needsAuthentication || isLoading || isFinalizing || hasAutoStartedProviderRef.current) {
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
    const timer = window.setTimeout(() => {
      const target = buildOAuthStartUrl(basePath, selectedProvider, authMode, queryState.nextPath);
      window.location.href = target;
    }, 70);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    authMode,
    basePath,
    isFinalizing,
    isLoading,
    needsAuthentication,
    providers,
    queryState.nextPath,
    selectedProvider
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

  if (fatalError) {
    return (
      <section className="auth-screen">
        <div className="auth-card">
          <p className="auth-card__error">{fatalError}</p>
        </div>
      </section>
    );
  }

  if (!localeBundle) {
    return <section className="auth-screen" aria-hidden="true" />;
  }

  const t = createTranslator(localeBundle);

  const handleProviderSelect = (provider: ProviderId): void => {
    setActiveProvider(provider);
    setAuthError(null);

    if (provider === "email") {
      return;
    }

    const target = buildOAuthStartUrl(basePath, provider, authMode, queryState.nextPath);
    window.location.href = target;
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

  const handleLocaleChange = (locale: string): void => {
    persistPreferredLocale(locale);
    void loadLocaleBundle(createApiClient(basePath), locale).then(setLocaleBundle);
  };

  const title = needsAuthentication
    ? authMode === "login"
      ? t("auth.title.login")
      : t("auth.title.create")
    : t("dashboard.title");

  const subtitle = t(needsAuthentication ? "shell.subtitle.auth" : route.subtitleKey);
  const accountLine =
    session.user?.email ?? session.user?.name ?? session.user?.id ?? t("dashboard.user.fallback");

  return (
    <StudioShell
      title={title}
      subtitle={subtitle}
      routeId={needsAuthentication ? authMode : route.id}
      colorScheme={colorScheme}
      locale={localeBundle.locale}
      locales={localeBundle.availableLocales}
      showHeader={!needsAuthentication}
      onLocaleChange={handleLocaleChange}
      onLogout={!needsAuthentication ? handleLogout : undefined}
      t={t}
    >
      {needsAuthentication ? (
        isLoading || isFinalizing ? (
          <section className="auth-screen" aria-hidden="true" />
        ) : (
          <AuthView
            mode={authMode}
            providers={providers}
            selectedProvider={selectedProvider}
            isSubmitting={isAuthSubmitting}
            brokerError={brokerError}
            formError={authError}
            onProviderSelect={handleProviderSelect}
            onLogin={handleLogin}
            onRegister={handleRegister}
            t={t}
          />
        )
      ) : (
        <DashboardScreen accountLine={accountLine} loadedAt={loadedAt} t={t} />
      )}
    </StudioShell>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildOAuthStartUrl,
  exchangeBrokerCode,
  loadAuthBootstrapState,
  loginWithEmail,
  registerWithEmail
} from "./modules/auth/auth.api.js";
import { readAuthQueryState } from "./modules/auth/auth.query.js";
import { LoginView } from "./modules/auth/views/login.js";
import { CreateView } from "./modules/auth/views/create.js";
import { DashboardScreen } from "./modules/dashboard/DashboardScreen.js";
import {
  createInitialLocaleBundle,
  createTranslator,
  loadLocaleBundle,
  persistPreferredLocale,
  readPreferredLocale
} from "../i18n/client.js";
import { createApiClient } from "../state/api.client.js";
import type { AuthMode, ProviderId } from "../types/auth.js";
import { resolveAdminRoute } from "./kernel/Routes.js";
import { StudioShell } from "./kernel/shell/StudioShell.js";
import { applyRouteStyles } from "./kernel/StyleManager.js";
import type { RegisterValues } from "./modules/auth/forms/register.js";
import type { LoginValues } from "./modules/auth/forms/login.js";

const STUDIO_READY_EVENT = "atria:studio:ready";
const COLOR_SCHEME_STORAGE_KEY = "atria:color-scheme";
const LEGACY_COLOR_SCHEME_STORAGE_KEY = "darkMode";

type ColorScheme = "light" | "dark";

declare global {
  interface Window {
    __ATRIA_INITIAL_SCHEME?: string;
  }
}

export interface AdminAppProps {
  basePath: string;
}

const normalizeBasePath = (basePath: string): string =>
  !basePath || basePath === "/" ? "/" : basePath.endsWith("/") ? basePath : `${basePath}/`;

const toBasePathUrl = (basePath: string, path: string): string => {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBasePath}${normalizedPath}`;
};

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

  try {
    const legacy = localStorage.getItem(LEGACY_COLOR_SCHEME_STORAGE_KEY);
    if (legacy === "enabled") {
      return "dark";
    }
    if (legacy === "disabled") {
      return "light";
    }
  } catch (_error) {}

  return "light";
};

export function AdminApp({ basePath }: AdminAppProps): React.JSX.Element {
  const route = useMemo(() => resolveAdminRoute(window.location.pathname), []);
  const queryState = useMemo(() => readAuthQueryState(window.location.search), []);
  const apiClient = useMemo(() => createApiClient(basePath), [basePath]);

  const [setupStatus, setSetupStatus] = useState({
    pending: true,
    preferredAuthMethod: null as ProviderId | null
  });
  const [providers, setProviders] = useState<ProviderId[]>([]);
  const [session, setSession] = useState({
    authenticated: false,
    user: null as {
      id: string;
      email: string | null;
      name: string | null;
      avatarUrl: string | null;
    } | null
  });
  const [activeProvider, setActiveProvider] = useState<ProviderId | null>(queryState.provider);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [areStylesReady, setAreStylesReady] = useState(false);
  const [brokerError, setBrokerError] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date>(new Date());
  const [colorScheme] = useState<ColorScheme>(resolveInitialColorScheme);

  const [localeBundle, setLocaleBundle] = useState(createInitialLocaleBundle);
  const hasAutoStartedProviderRef = useRef(false);
  const hasDispatchedReadyRef = useRef(false);

  const t = useMemo(() => createTranslator(localeBundle), [localeBundle]);

  const needsAuthentication = setupStatus.pending || !session.authenticated;
  const authMode: AuthMode = setupStatus.pending ? "create" : "login";
  const selectedProvider = activeProvider ?? setupStatus.preferredAuthMethod;
  const effectiveRouteId = needsAuthentication ? authMode : route.id;
  const effectiveSubtitleKey = needsAuthentication ? "shell.subtitle.auth" : route.subtitleKey;
  const activeStyleFiles = useMemo(
    () => (needsAuthentication ? ["styles/modules/auth.css"] : route.styleFiles),
    [needsAuthentication, route.styleFiles]
  );

  useEffect(() => {
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, colorScheme);
      localStorage.setItem(
        LEGACY_COLOR_SCHEME_STORAGE_KEY,
        colorScheme === "dark" ? "enabled" : "disabled"
      );
    } catch (_error) {}

    window.__ATRIA_INITIAL_SCHEME = colorScheme;
  }, [colorScheme]);

  useEffect(() => {
    let cancelled = false;
    setAreStylesReady(false);

    void applyRouteStyles(basePath, activeStyleFiles)
      .then(() => {
        if (!cancelled) {
          setAreStylesReady(true);
        }
      })
      .catch(() => {
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

    const bootstrap = async (): Promise<void> => {
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

      if (queryState.provider) {
        setActiveProvider(queryState.provider);
      }

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

      setLoadedAt(new Date());
      setIsLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiClient, queryState.brokerCode, queryState.nextPath, queryState.provider]);

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

    hasDispatchedReadyRef.current = true;
    window.dispatchEvent(new CustomEvent(STUDIO_READY_EVENT));
  }, [areStylesReady, isFinalizing, isLoading]);

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

    const result = await registerWithEmail(basePath, {
      email: values.email,
      password: values.password,
      name: values.name
    });

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

    const result = await loginWithEmail(basePath, {
      email: values.email,
      password: values.password
    });

    if (result.ok && result.authenticated) {
      window.location.replace(queryState.nextPath);
      return;
    }

    setAuthError(result.error ?? t("auth.error.loginDefault"));
    setIsAuthSubmitting(false);
  };

  const handleLogout = (): void => {
    const logoutUrl = toBasePathUrl(basePath, "/api/auth/logout");
    const loginUrl = toBasePathUrl(basePath, "/");

    void fetch(logoutUrl, {
      method: "POST",
      credentials: "include"
    }).finally(() => {
      window.location.replace(loginUrl);
    });
  };

  const handleLocaleChange = (locale: string): void => {
    persistPreferredLocale(locale);

    void loadLocaleBundle(apiClient, locale).then((nextBundle) => {
      setLocaleBundle(nextBundle);
    });
  };

  const title = needsAuthentication
    ? authMode === "login"
      ? t("auth.title.login")
      : t("auth.title.create")
    : t("dashboard.title");

  const subtitle = t(effectiveSubtitleKey);
  const showHeader = !needsAuthentication;

  const accountLine =
    session.user?.email ?? session.user?.name ?? session.user?.id ?? t("dashboard.user.fallback");

  const authViewProps = {
    providers,
    selectedProvider,
    isLoading,
    isFinalizing,
    isSubmitting: isAuthSubmitting,
    brokerError,
    formError: authError,
    onProviderSelect: handleProviderSelect,
    t
  };

  return (
    <StudioShell
      title={title}
      subtitle={subtitle}
      routeId={effectiveRouteId}
      colorScheme={colorScheme}
      locale={localeBundle.locale}
      locales={localeBundle.availableLocales}
      showHeader={showHeader}
      onLocaleChange={handleLocaleChange}
      onLogout={showHeader ? handleLogout : undefined}
      t={t}
    >
      {needsAuthentication ? (
        authMode === "login" ? (
          <LoginView {...authViewProps} onLogin={handleLogin} />
        ) : (
          <CreateView {...authViewProps} onRegister={handleRegister} />
        )
      ) : (
        <DashboardScreen accountLine={accountLine} loadedAt={loadedAt.toLocaleString()} t={t} />
      )}
    </StudioShell>
  );
}

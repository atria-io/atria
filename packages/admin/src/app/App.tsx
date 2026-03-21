import React from "react";
import { readAuthQueryState } from "./modules/auth/http/auth.query.js";
import { AuthGateView } from "./modules/auth/AuthGateView.js";
import { useAuthActions } from "./modules/auth/hooks/useAuthActions.js";
import { useAuthBootstrap } from "./modules/auth/hooks/useAuthBootstrap.js";
import { useOAuthRedirect } from "./modules/auth/hooks/useOAuthRedirect.js";
import { DashboardScreen } from "./modules/dashboard/DashboardScreen.js";
import { CriticalStatusView } from "./modules/critical/CriticalStatusView.js";
import { useRuntimeHealth } from "./modules/critical/hooks/useRuntimeHealth.js";
import { createTranslator } from "../i18n/client.js";
import { AUTH_ROUTE_STYLE_FILES, resolveAdminRoute } from "./kernel/routing/Routes.js";
import { useStudioReady } from "./kernel/runtime/useStudioReady.js";
import { StudioShell } from "./kernel/layout/StudioShell.js";
import { useColorScheme } from "./kernel/layout/hooks/useColorScheme.js";

const STUDIO_READY_EVENT = "atria:studio:ready";
const COLOR_SCHEME_STORAGE_KEY = "atria:color-scheme";
const CRITICAL_STYLE_FILES: string[] = [];
const SERVER_HEARTBEAT_DELAY_MS = 2_000;
const SERVER_HEARTBEAT_TIMEOUT_MS = 1_500;
const SERVER_HEARTBEAT_PATH = "/api/setup/status";

export interface AdminAppProps {
  basePath: string;
}

/**
 * Orchestrates admin bootstrap, auth gating, and shell rendering.
 * This is the only place where setup/session/provider state is synchronized from API responses.
 */
export function AdminApp({ basePath }: AdminAppProps): React.JSX.Element {
  const route = resolveAdminRoute(window.location.pathname);
  const queryState = readAuthQueryState(window.location.search);

  const {
    setupStatus,
    providers,
    session,
    activeProvider,
    isLoading,
    isFinalizing,
    isAuthSubmitting,
    authError,
    brokerError,
    fatalError,
    localeBundle,
    setActiveProvider,
    setIsAuthSubmitting,
    setAuthError,
    setBrokerError
  } = useAuthBootstrap({
    basePath,
    queryState
  });

  const runtimeFlagReason = useRuntimeHealth({
    basePath,
    serverHeartbeatPath: SERVER_HEARTBEAT_PATH,
    heartbeatDelayMs: SERVER_HEARTBEAT_DELAY_MS,
    heartbeatTimeoutMs: SERVER_HEARTBEAT_TIMEOUT_MS
  });

  const { colorScheme, colorSchemePreference, setColorSchemePreference } = useColorScheme({
    storageKey: COLOR_SCHEME_STORAGE_KEY
  });

  const needsAuthentication = setupStatus.pending || !session.authenticated;
  const authMode = setupStatus.pending ? "create" : "login";
  const hasPendingBrokerConsent =
    authMode === "create" &&
    queryState.brokerConsentToken !== null &&
    queryState.brokerCode === null;
  const selectedProvider = activeProvider ?? setupStatus.preferredAuthMethod;

  const { isOAuthRedirecting, startOAuthRedirect } = useOAuthRedirect({
    basePath,
    authMode,
    nextPath: queryState.nextPath,
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
  });

  const activeStyleFiles = React.useMemo(
    () =>
      runtimeFlagReason || fatalError
        ? CRITICAL_STYLE_FILES
        : needsAuthentication
          ? AUTH_ROUTE_STYLE_FILES
          : route.styleFiles,
    [fatalError, needsAuthentication, route.styleFiles, runtimeFlagReason]
  );

  useStudioReady({
    basePath,
    styleFiles: activeStyleFiles,
    isLoading,
    isFinalizing,
    readyEventName: STUDIO_READY_EVENT
  });

  const locale = localeBundle ? createTranslator(localeBundle) : null;
  const translate = (key: string): string => {
    if (!locale) {
      throw new Error("Translator is unavailable.");
    }

    return locale(key);
  };

  const {
    handleProviderSelect,
    handleRegister,
    handleLogin,
    handleBrokerConsentConfirm,
    handleLogout
  } = useAuthActions({
    basePath,
    nextPath: queryState.nextPath,
    brokerConsentToken: queryState.brokerConsentToken,
    t: translate,
    setActiveProvider,
    setAuthError,
    setIsAuthSubmitting,
    startOAuthRedirect
  });

  const isCritical = runtimeFlagReason !== null || fatalError !== null;

  if (!localeBundle || !locale) {
    return <section className="auth-screen" aria-hidden="true" />;
  }

  const routeId = isCritical ? "critical" : needsAuthentication ? authMode : route.id;
  const showHeader = isCritical || !needsAuthentication;
  const onLogout =
    session.authenticated && (isCritical || !needsAuthentication) ? handleLogout : undefined;

  let content: React.JSX.Element;
  if (isCritical) {
    content = (
      <CriticalStatusView
        reason={runtimeFlagReason}
        fatalError={fatalError}
        t={locale}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  } else if (needsAuthentication) {
    content = (
      <AuthGateView
        isLoading={isLoading}
        isFinalizing={isFinalizing}
        hasPendingBrokerConsent={hasPendingBrokerConsent}
        provider={queryState.provider}
        projectId={queryState.brokerProjectId}
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
        onBrokerConsentConfirm={handleBrokerConsentConfirm}
        t={locale}
      />
    );
  } else {
    content = <DashboardScreen />;
  }

  return (
    <StudioShell
      routeId={routeId}
      colorScheme={colorScheme}
      colorSchemePreference={colorSchemePreference}
      onColorSchemeChange={setColorSchemePreference}
      locale={locale}
      user={session.user}
      showHeader={showHeader}
      onLogout={onLogout}
    >
      {content}
    </StudioShell>
  );
}

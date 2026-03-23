import React from "react";
import { useAuthFeature } from "./modules/auth/index.js";
import { AuthRoot } from "./modules/auth/ui/AuthRoot.js";
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
const SERVER_HEARTBEAT_DELAY_MS = 2_000;
const SERVER_HEARTBEAT_TIMEOUT_MS = 1_500;
const SERVER_HEARTBEAT_PATH = "/api/setup/status";
const RUNTIME_RECOVERY_FADE_MS = 180;
const DEFAULT_DOCUMENT_TITLE = "Atria";
const CREATE_DOCUMENT_TITLE = "Atria - Create";

export interface AdminAppProps {
  basePath: string;
}

export function AdminApp({ basePath }: AdminAppProps): React.JSX.Element {
  const route = resolveAdminRoute(window.location.pathname);
  const authFeature = useAuthFeature({ basePath });

  const runtimeFlagReason = useRuntimeHealth({
    basePath,
    serverHeartbeatPath: SERVER_HEARTBEAT_PATH,
    heartbeatDelayMs: SERVER_HEARTBEAT_DELAY_MS,
    heartbeatTimeoutMs: SERVER_HEARTBEAT_TIMEOUT_MS
  });

  const { colorScheme, colorSchemePreference, setColorSchemePreference } = useColorScheme({
    storageKey: COLOR_SCHEME_STORAGE_KEY
  });

  const flowRouteId = authFeature.needsAuthentication ? authFeature.authMode : route.id;
  const nonCriticalStyleFiles = authFeature.needsAuthentication
    ? AUTH_ROUTE_STYLE_FILES
    : route.styleFiles;
  const previousNonCriticalStyleFilesRef = React.useRef<string[]>(nonCriticalStyleFiles);
  const [isRecoveringFromRuntimeCritical, setIsRecoveringFromRuntimeCritical] = React.useState(false);
  const [isRouteTransitioning, setIsRouteTransitioning] = React.useState(false);
  const hadRuntimeCriticalRef = React.useRef(false);
  const previousFlowRouteIdRef = React.useRef(flowRouteId);

  React.useEffect(() => {
    if (runtimeFlagReason !== null || authFeature.fatalError !== null) {
      return;
    }

    previousNonCriticalStyleFilesRef.current = nonCriticalStyleFiles;
  }, [authFeature.fatalError, nonCriticalStyleFiles, runtimeFlagReason]);

  React.useEffect(() => {
    if (runtimeFlagReason !== null) {
      hadRuntimeCriticalRef.current = true;
      setIsRecoveringFromRuntimeCritical(false);
      return;
    }

    if (!hadRuntimeCriticalRef.current) {
      return;
    }

    hadRuntimeCriticalRef.current = false;
    setIsRecoveringFromRuntimeCritical(true);

    const timeoutId = window.setTimeout(() => {
      setIsRecoveringFromRuntimeCritical(false);
    }, RUNTIME_RECOVERY_FADE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [runtimeFlagReason]);

  React.useEffect(() => {
    if (runtimeFlagReason !== null || authFeature.fatalError !== null) {
      previousFlowRouteIdRef.current = flowRouteId;
      return;
    }

    if (previousFlowRouteIdRef.current === flowRouteId) {
      return;
    }

    previousFlowRouteIdRef.current = flowRouteId;
    setIsRouteTransitioning(false);

    const frameId = window.requestAnimationFrame(() => {
      setIsRouteTransitioning(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [authFeature.fatalError, flowRouteId, runtimeFlagReason]);

  const activeStyleFiles = React.useMemo(
    () => (runtimeFlagReason || authFeature.fatalError
      ? previousNonCriticalStyleFilesRef.current
      : nonCriticalStyleFiles),
    [authFeature.fatalError, nonCriticalStyleFiles, runtimeFlagReason]
  );

  useStudioReady({
    basePath,
    styleFiles: activeStyleFiles,
    isLoading: authFeature.isLoading,
    isFinalizing: authFeature.isFinalizing,
    readyEventName: STUDIO_READY_EVENT
  });

  const translate = authFeature.translator
    ? authFeature.translator
    : (key: string) => key;

  const isCritical = runtimeFlagReason !== null || authFeature.fatalError !== null;

  React.useEffect(() => {
    document.title = authFeature.needsAuthentication && authFeature.authMode === "create"
      ? CREATE_DOCUMENT_TITLE
      : DEFAULT_DOCUMENT_TITLE;
  }, [authFeature.authMode, authFeature.needsAuthentication]);

  if (!authFeature.localeBundle || !authFeature.translator) {
    return <section className="auth-screen" aria-hidden="true" />;
  }

  const routeId = isCritical ? "critical" : authFeature.needsAuthentication ? authFeature.authMode : route.id;
  const showHeader = isCritical || !authFeature.needsAuthentication;
  const onLogout = authFeature.session.authenticated && (isCritical || !authFeature.needsAuthentication)
    ? authFeature.onLogout
    : undefined;
  const contentClassName = [
    "admin-shell__content",
    isRecoveringFromRuntimeCritical ? "admin-shell__content--recovering" : "",
    isRouteTransitioning ? "admin-shell__content--route-transition" : ""
  ]
    .filter(Boolean)
    .join(" ");

  let content: React.JSX.Element;
  if (isCritical) {
    content = (
      <CriticalStatusView
        reason={runtimeFlagReason}
        fatalError={authFeature.fatalError}
        t={translate}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  } else if (authFeature.needsAuthentication) {
    content = (
      <AuthRoot
        screen={authFeature.screen}
        providers={authFeature.providers}
        selectedProvider={authFeature.selectedProvider}
        isBusy={authFeature.isBusy}
        brokerError={authFeature.brokerError}
        formError={authFeature.formError}
        isPendingSetup={authFeature.setupStatus.pending}
        showBackButton={authFeature.shouldShowBack}
        hasPendingBrokerConsent={authFeature.hasPendingBrokerConsent}
        brokerProvider={authFeature.brokerProvider}
        brokerProjectId={authFeature.brokerProjectId}
        onProviderSelect={authFeature.onProviderSelect}
        onLogin={authFeature.onLogin}
        onRegister={authFeature.onRegister}
        onBrokerConsentConfirm={authFeature.onBrokerConsentConfirm}
        onOpenEmailForm={authFeature.onOpenEmailForm}
        onBack={authFeature.onBack}
        onOpenPrivacy={authFeature.onOpenPrivacy}
        onOpenHelp={authFeature.onOpenHelp}
        t={translate}
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
      locale={translate}
      user={authFeature.session.user}
      showHeader={showHeader}
      onLogout={onLogout}
    >
      <div
        className={contentClassName}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          if (event.animationName === "admin-shell-route-enter") {
            setIsRouteTransitioning(false);
          }
        }}
      >
        {content}
      </div>
    </StudioShell>
  );
}

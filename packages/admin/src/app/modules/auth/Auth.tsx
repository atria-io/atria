import React, { useEffect, useRef, useState } from "react";
import {
  AUTH_ROUTE_QUERY_KEY,
  parseAuthRouteView,
  type AuthRouteView
} from "@atria/shared/auth-route";
import type { TranslateFn } from "../../../i18n/client.js";
import type { ProviderId } from "../../../types/auth.js";
import type { RegisterValues } from "./forms/Register.js";
import type { LoginValues } from "./forms/Login.js";
import { AuthMainView } from "./views/AuthMainView.js";
import { AuthViewBrokerConsent } from "./views/AuthViewBrokerConsent.js";

interface AuthProps {
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

type AuthScreen = "provider" | "email" | "privacy" | "help";

const LOGIN_PATHNAME = "/login";
const CREATE_PATHNAME = "/create";
const ROUTE_TRANSITION_DURATION_MS = 180;

const normalizePathname = (pathname: string): string => pathname.replace(/\/+$/, "") || "/";

const readAuthRouteQuery = (): AuthRouteView | null =>
  parseAuthRouteView(new URLSearchParams(window.location.search).get(AUTH_ROUTE_QUERY_KEY));

const buildPathWithRouteQuery = (
  pathname: string,
  routeQuery: AuthRouteView | null
): string => {
  const params = new URLSearchParams(window.location.search);
  if (routeQuery === null) {
    params.delete(AUTH_ROUTE_QUERY_KEY);
  } else {
    params.set(AUTH_ROUTE_QUERY_KEY, routeQuery);
  }

  const query = params.toString();
  return `${pathname}${query.length > 0 ? `?${query}` : ""}${window.location.hash}`;
};

const currentPathWithRouteQuery = (): string =>
  `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`;

const routeQueryToScreen = (routeQuery: AuthRouteView | null): AuthScreen | null => {
  if (routeQuery === "privacy") {
    return "privacy";
  }

  if (routeQuery === "need-help") {
    return "help";
  }

  if (routeQuery === "email") {
    return "email";
  }

  return null;
};

const screenToRouteQuery = (
  screen: AuthScreen,
  isCreate: boolean
): AuthRouteView | null => {
  if (screen === "privacy") {
    return "privacy";
  }

  if (screen === "help") {
    return "need-help";
  }

  if (screen === "email" && isCreate) {
    return "email";
  }

  return null;
};

export function Auth(props: AuthProps): React.JSX.Element {
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
  const isCreate = mode === "create";
  const isLogin = !isCreate;
  const isBusy = isSubmitting || isOAuthRedirecting;
  const [screen, setScreen] = useState<AuthScreen>(
    selectedProvider === "email" ? "email" : "provider"
  );
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const previousScreenRef = useRef(screen);

  useEffect(() => {
    const syncRouteToAuthState = (): void => {
      const normalizedPath = normalizePathname(window.location.pathname);
      const routeQuery = readAuthRouteQuery();
      const targetPath = isCreate ? CREATE_PATHNAME : LOGIN_PATHNAME;

      if (normalizedPath !== targetPath) {
        window.history.replaceState({}, "", buildPathWithRouteQuery(targetPath, routeQuery));
      }

      const routeScreen = routeQueryToScreen(routeQuery);
      if (routeScreen) {
        setScreen(routeScreen);
        return;
      }

      setScreen(isCreate ? "provider" : selectedProvider === "email" ? "email" : "provider");
    };

    syncRouteToAuthState();

    const onPopState = (): void => {
      syncRouteToAuthState();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [isCreate, selectedProvider]);

  useEffect(() => {
    if (previousScreenRef.current === screen) {
      return;
    }

    previousScreenRef.current = screen;
    setIsRouteTransitioning(true);

    const timeoutId = window.setTimeout(() => {
      setIsRouteTransitioning(false);
    }, ROUTE_TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen]);

  if (isLoading || isFinalizing) {
    return <div className="auth-screen" aria-hidden="true" />;
  }

  if (hasPendingBrokerConsent) {
    return (
      <AuthViewBrokerConsent
        provider={provider}
        projectId={projectId}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onConfirm={onBrokerConsentConfirm}
        t={t}
      />
    );
  }

  const pushAuthRoute = (pathWithQuery: string): void => {
    window.history.pushState(
      { atriaFromPath: currentPathWithRouteQuery() },
      "",
      pathWithQuery
    );
  };

  const navigateToScreen = (nextScreen: AuthScreen): void => {
    const targetPath = isCreate ? CREATE_PATHNAME : LOGIN_PATHNAME;
    const routeQuery = screenToRouteQuery(nextScreen, isCreate);
    const targetPathWithQuery = buildPathWithRouteQuery(targetPath, routeQuery);

    if (currentPathWithRouteQuery() !== targetPathWithQuery) {
      pushAuthRoute(targetPathWithQuery);
    }

    setScreen(nextScreen);
  };

  const openPrivacyRoute = (): void => {
    navigateToScreen("privacy");
  };

  const openNeedHelpRoute = (): void => {
    navigateToScreen("help");
  };

  const openEmailForm = (): void => {
    navigateToScreen("email");
    onProviderSelect("email");
  };

  const goBackFromRoutePage = (): void => {
    if (screen === "email") {
      if (isCreate) {
        navigateToScreen("provider");
      }
      return;
    }

    if (screen === "privacy" || screen === "help") {
      if (isCreate) {
        navigateToScreen("provider");
      } else {
        navigateToScreen(selectedProvider === "email" ? "email" : "provider");
      }
      return;
    }
  };

  const showBackFooter = isCreate
    ? screen !== "provider"
    : screen === "privacy" || screen === "help";
  const contentClassName = [
    "auth-card__content",
    isRouteTransitioning ? "auth-card__content--route-transition" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const footerTransitionClassName = [
    isRouteTransitioning ? "auth-card__footer--route-transition" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const title = screen === "email"
    ? t(isLogin ? "auth.title.login" : "auth.title.create")
    : t(isLogin ? "auth.title.chooseProvider" : "auth.title.create");

  return (
    <AuthMainView
      mode={mode}
      title={title}
      screen={screen}
      showBackFooter={showBackFooter}
      contentClassName={contentClassName}
      footerTransitionClassName={footerTransitionClassName}
      providers={providers}
      selectedProvider={selectedProvider}
      isBusy={isBusy}
      brokerError={brokerError}
      formError={formError}
      onProviderSelect={onProviderSelect}
      onLogin={onLogin}
      onRegister={onRegister}
      onOpenEmailForm={openEmailForm}
      onOpenPrivacyRoute={openPrivacyRoute}
      onOpenNeedHelpRoute={openNeedHelpRoute}
      onBackFromRoutePage={goBackFromRoutePage}
      t={t}
    />
  );
}

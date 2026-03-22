import React, { useEffect, useRef, useState } from "react";
import {
  AUTH_ROUTE_QUERY_KEY,
  parseAuthRouteView,
  type AuthRouteView
} from "@atria/shared";
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

type FooterView = "auth" | "privacy" | "help";

const ROOT_LOGIN_PATHNAME = "/";
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
  const [showEmailForm, setShowEmailForm] = useState(selectedProvider === "email");
  const [footerView, setFooterView] = useState<FooterView>("auth");
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const routeViewKey = footerView === "auth" ? (showEmailForm ? "email" : "create") : footerView;
  const previousRouteViewKeyRef = useRef(routeViewKey);

  useEffect(() => {
    if (!isCreate && selectedProvider === "email") {
      setShowEmailForm(true);
    }
  }, [isCreate, selectedProvider]);

  useEffect(() => {
    const syncRouteToAuthState = (): void => {
      const normalizedPath = normalizePathname(window.location.pathname);
      const routeQuery = readAuthRouteQuery();
      let effectivePath = normalizedPath;

      if (isCreate && normalizedPath !== CREATE_PATHNAME) {
        window.history.replaceState({}, "", buildPathWithRouteQuery(CREATE_PATHNAME, routeQuery));
        effectivePath = CREATE_PATHNAME;
      }

      const isCreateQueryRoute = isCreate && effectivePath === CREATE_PATHNAME;
      const isLoginQueryRoute = !isCreate && effectivePath === LOGIN_PATHNAME;

      if (routeQuery === "privacy" && (isCreateQueryRoute || isLoginQueryRoute)) {
        setShowEmailForm(false);
        setFooterView("privacy");
        return;
      }

      if (routeQuery === "need-help" && (isCreateQueryRoute || isLoginQueryRoute)) {
        setShowEmailForm(false);
        setFooterView("help");
        return;
      }

      if (routeQuery === "email" && isCreateQueryRoute) {
        setShowEmailForm(true);
        setFooterView("auth");
        return;
      }

      if (
        !isCreate &&
        effectivePath !== ROOT_LOGIN_PATHNAME &&
        effectivePath !== LOGIN_PATHNAME
      ) {
        setShowEmailForm(selectedProvider === "email");
        setFooterView("auth");
        return;
      }

      setShowEmailForm(isCreate ? false : selectedProvider === "email");
      setFooterView("auth");
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
    if (previousRouteViewKeyRef.current === routeViewKey) {
      return;
    }

    previousRouteViewKeyRef.current = routeViewKey;
    setIsRouteTransitioning(true);

    const timeoutId = window.setTimeout(() => {
      setIsRouteTransitioning(false);
    }, ROUTE_TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [routeViewKey]);

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

  const openPrivacyRoute = (): void => {
    const targetPath = isCreate ? CREATE_PATHNAME : LOGIN_PATHNAME;
    const targetPathWithQuery = buildPathWithRouteQuery(targetPath, "privacy");
    if (currentPathWithRouteQuery() !== targetPathWithQuery) {
      pushAuthRoute(targetPathWithQuery);
    }

    setShowEmailForm(false);
    setFooterView("privacy");
  };

  const openNeedHelpRoute = (): void => {
    const targetPath = isCreate ? CREATE_PATHNAME : LOGIN_PATHNAME;
    const targetPathWithQuery = buildPathWithRouteQuery(targetPath, "need-help");
    if (currentPathWithRouteQuery() !== targetPathWithQuery) {
      pushAuthRoute(targetPathWithQuery);
    }

    setShowEmailForm(false);
    setFooterView("help");
  };

  const openEmailForm = (): void => {
    if (isCreate) {
      const targetPathWithQuery = buildPathWithRouteQuery(CREATE_PATHNAME, "email");
      if (currentPathWithRouteQuery() !== targetPathWithQuery) {
        pushAuthRoute(targetPathWithQuery);
      }
    }

    setShowEmailForm(true);
    setFooterView("auth");
    onProviderSelect("email");
  };

  const goBackFromRoutePage = (): void => {
    const fallbackPath = isCreate ? CREATE_PATHNAME : ROOT_LOGIN_PATHNAME;
    window.history.replaceState({}, "", buildPathWithRouteQuery(fallbackPath, null));

    const routeQuery = readAuthRouteQuery();
    if (isCreate && routeQuery === "email") {
      setShowEmailForm(true);
      setFooterView("auth");
      return;
    }

    if (routeQuery === "privacy") {
      setShowEmailForm(false);
      setFooterView("privacy");
      return;
    }

    if (routeQuery === "need-help") {
      setShowEmailForm(false);
      setFooterView("help");
      return;
    }

    setShowEmailForm(isCreate ? false : selectedProvider === "email");
    setFooterView("auth");
  };

  const showCreateRouteFooter = isCreate
    ? showEmailForm || footerView !== "auth"
    : footerView !== "auth";
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
  const title = showEmailForm
    ? t(isLogin ? "auth.title.login" : "auth.title.create")
    : t(isLogin ? "auth.title.chooseProvider" : "auth.title.create");

  return (
    <AuthMainView
      mode={mode}
      title={title}
      footerView={footerView}
      showEmailForm={showEmailForm}
      showCreateRouteFooter={showCreateRouteFooter}
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

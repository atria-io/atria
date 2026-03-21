import { useEffect, useState } from "react";
import {
  confirmBrokerConsent,
  exchangeBrokerCode,
  loadAuthBootstrapState
} from "../http/auth.api.js";
import type { AuthQueryState } from "../http/auth.query.js";
import {
  clearBrokerQueryParamsFromLocation,
  normalizeLegacyBrokerConsentParamInLocation
} from "../location/auth.location.js";
import {
  loadLocaleBundle,
  readPreferredLocale
} from "../../../../i18n/client.js";
import type { LocaleBundle } from "../../../../i18n/client.js";
import { createApiClient } from "../../../../state/api.client.js";
import type {
  ProviderId,
  SessionPayload,
  SetupStatus
} from "../../../../types/auth.js";

interface UseAuthBootstrapOptions {
  basePath: string;
  queryState: AuthQueryState;
}

interface UseAuthBootstrapResult {
  setupStatus: SetupStatus;
  providers: ProviderId[];
  session: SessionPayload;
  activeProvider: ProviderId | null;
  isLoading: boolean;
  isFinalizing: boolean;
  isAuthSubmitting: boolean;
  authError: string | null;
  brokerError: boolean;
  fatalError: string | null;
  localeBundle: LocaleBundle | null;
  setActiveProvider: (provider: ProviderId | null) => void;
  setIsAuthSubmitting: (value: boolean) => void;
  setAuthError: (value: string | null) => void;
  setBrokerError: (value: boolean) => void;
}

export const useAuthBootstrap = (options: UseAuthBootstrapOptions): UseAuthBootstrapResult => {
  const { basePath, queryState } = options;
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
  const [brokerError, setBrokerError] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [localeBundle, setLocaleBundle] = useState<LocaleBundle | null>(null);

  useEffect(() => {
    normalizeLegacyBrokerConsentParamInLocation();
  }, []);

  useEffect(() => {
    let cancelled = false;

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

  return {
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
  };
};

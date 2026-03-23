import { useEffect, useReducer, useCallback } from "react";
import {
  normalizeLegacyBrokerConsentParam,
  clearBrokerQueryParams,
  readAuthRouteQuery,
  syncRouteToAuthState
} from "./screen-sync.js";
import { authReducer, createInitialAuthState, type AuthState, type AuthAction } from "./reducer.js";
import {
  confirmBrokerConsent,
  exchangeBrokerCode,
  loadAuthBootstrapState,
  type AuthQueryState
} from "./api.js";
import {
  loadLocaleBundle,
  readPreferredLocale
} from "../../../../i18n/client.js";
import { createApiClient } from "../../../../state/api.client.js";

interface UseAuthBootstrapOptions {
  basePath: string;
  queryState: AuthQueryState;
}

interface UseAuthBootstrapResult {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

/**
 * Bootstrap core auth state from API.
 * Owns locale load, setup/session/providers fetch, and broker finalization.
 * Dispatches actions to reducer instead of managing multiple useState calls.
 * Returns both state and dispatch for public consumers.
 */
export const useAuthBootstrap = (options: UseAuthBootstrapOptions): UseAuthBootstrapResult => {
  const { basePath, queryState } = options;
  const [state, dispatch] = useReducer(authReducer, createInitialAuthState());

  // Normalize legacy broker params once
  useEffect(() => {
    normalizeLegacyBrokerConsentParam();
  }, []);

  // Main bootstrap flow
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      dispatch({ type: "BOOTSTRAP_START" });

      const apiClient = createApiClient(basePath);
      const requestedLocale = readPreferredLocale();
      const localeBundle = await loadLocaleBundle(apiClient, requestedLocale);

      if (cancelled) {
        return;
      }

      const bootstrapData = await loadAuthBootstrapState(apiClient);

      if (cancelled) {
        return;
      }

      dispatch({
        type: "BOOTSTRAP_SUCCESS",
        payload: {
          setupStatus: bootstrapData.setupStatus,
          providers: bootstrapData.providers,
          session: bootstrapData.session,
          localeBundle
        }
      });

      const shouldFinalizeBrokerCode = queryState.brokerCode !== null;
      const shouldFinalizeBrokerConsent =
        queryState.brokerConsentToken !== null &&
        queryState.brokerCode === null &&
        bootstrapData.setupStatus.pending === false;

      if (shouldFinalizeBrokerCode || shouldFinalizeBrokerConsent) {
        dispatch({ type: "FINALIZE_START" });

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

        if (!bootstrapData.setupStatus.pending) {
          clearBrokerQueryParams();
        }

        dispatch({
          type: "FINALIZE_FAIL",
          payload: { error: oauthResult.error }
        });
      }
    };

    void bootstrap().catch((error) => {
      if (!cancelled) {
        dispatch({
          type: "BOOTSTRAP_FAIL",
          payload: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basePath, queryState]);

  // Sync URL on startup and popstate
  useEffect(() => {
    if (state.isLoading) {
      return;
    }

    const currentRouteQuery = readAuthRouteQuery();
    const sync = syncRouteToAuthState({
      isPendingSetup: state.setupStatus.pending,
      selectedProvider: state.selectedProvider,
      currentRouteQuery
    });

    if (!sync.isUrlValid) {
      const routeQuery = readAuthRouteQuery();
      const targetPath = `${sync.targetPathname}${routeQuery ? `?view=${routeQuery}` : ""}`;
      window.history.replaceState({}, "", targetPath);
    }

    if (sync.targetScreen !== state.screen) {
      dispatch({ type: "SCREEN_CHANGE", payload: { screen: sync.targetScreen } });
    }

    const handlePopState = (): void => {
      const routeQuery = readAuthRouteQuery();
      const nextSync = syncRouteToAuthState({
        isPendingSetup: state.setupStatus.pending,
        selectedProvider: state.selectedProvider,
        currentRouteQuery: routeQuery
      });

      if (!nextSync.isUrlValid) {
        window.history.replaceState({}, "", nextSync.targetPathname);
      }

      if (nextSync.targetScreen !== state.screen) {
        dispatch({
          type: "SCREEN_CHANGE",
          payload: { screen: nextSync.targetScreen }
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [state.setupStatus.pending, state.selectedProvider, state.screen, state.isLoading]);

  return { state, dispatch };
};

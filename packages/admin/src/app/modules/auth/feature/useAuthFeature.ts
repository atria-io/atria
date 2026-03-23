import { useCallback } from "react";
import { useAuthBootstrap } from "../core/bootstrap.js";
import { useOAuthRedirect } from "../core/oauth-redirect.js";
import { navigateToScreen, getBackNavigationTarget, shouldShowBack } from "../core/auth-flow.js";
import {
  readAuthQueryState,
  loginWithEmail,
  registerWithEmail,
  confirmBrokerConsent,
  type LoginInput,
  type RegisterInput,
  type AuthQueryState
} from "../core/api.js";
import type { RegisterValues } from "../forms/Register.js";
import { resolveBasePathUrl } from "../../../../state/api.client.js";
import type { ProviderId } from "../../../../types/auth.js";
import type { AuthState } from "../core/reducer.js";
import type { AuthScreen } from "../core/reducer.js";

export interface UseAuthFeatureOptions {
  basePath: string;
}

export interface UseAuthFeatureResult {
  setupStatus: AuthState["setupStatus"];
  session: AuthState["session"];
  localeBundle: AuthState["localeBundle"];
  fatalError: AuthState["fatalError"];
  isLoading: AuthState["isLoading"];
  isFinalizing: AuthState["isFinalizing"];
  authMode: "login" | "create";
  needsAuthentication: boolean;
  screen: AuthState["screen"];
  isBusy: AuthState["isBusy"];
  formError: AuthState["formError"];
  brokerError: AuthState["brokerError"];
  selectedProvider: AuthState["selectedProvider"];
  providers: AuthState["providers"];
  shouldShowBack: boolean;
  hasPendingBrokerConsent: boolean;
  brokerProvider: ProviderId | null;
  brokerProjectId: string | null;
  onProviderSelect: (provider: ProviderId) => void;
  onLogin: (values: LoginInput) => Promise<void>;
  onRegister: (values: RegisterValues) => Promise<void>;
  onBrokerConsentConfirm: () => Promise<void>;
  onNavigateToScreen: (screen: AuthScreen) => void;
  onOpenEmailForm: () => void;
  onBack: () => void;
  onLogout: () => void;
  onOpenPrivacy: () => void;
  onOpenHelp: () => void;
  translator: ((key: string) => string) | null;
}

/**
 * Public auth feature hook.
 * Coordinates bootstrap, OAuth redirect, and user actions.
 * Returns minimal, closed contract for App integration.
 */
export const useAuthFeature = (
  options: UseAuthFeatureOptions
): UseAuthFeatureResult => {
  const { basePath } = options;
  const queryState = readAuthQueryState(window.location.search);

  const { state, dispatch } = useAuthBootstrap({ basePath, queryState });

  const { startOAuthRedirect } = useOAuthRedirect({
    basePath,
    state,
    dispatch
  });

  const authMode = state.setupStatus.pending ? "create" : "login";
  const needsAuthentication = state.setupStatus.pending || !state.session.authenticated;
  const translator = state.localeBundle
    ? (key: string) => (state.localeBundle as any)[key] || key
    : null;

  // Detect if broker consent is pending
  const hasPendingBrokerConsent =
    authMode === "create" &&
    queryState.brokerConsentToken !== null &&
    queryState.brokerCode === null;

  const onProviderSelect = useCallback(
    (provider: ProviderId): void => {
      startOAuthRedirect(provider);
    },
    [startOAuthRedirect]
  );

  const onNavigateToScreen = useCallback(
    (nextScreen: AuthScreen): void => {
      navigateToScreen({
        nextScreen,
        isPendingSetup: state.setupStatus.pending,
        currentScreenPush: (path: string) => {
          window.history.pushState({}, "", path);
        }
      });
    },
    [state.setupStatus.pending]
  );

  const onLogin = useCallback(
    async (values: LoginInput): Promise<void> => {
      dispatch({ type: "SUBMIT_START" });
      const result = await loginWithEmail(basePath, values);
      if (result.ok && result.authenticated) {
        dispatch({ type: "SUBMIT_SUCCESS" });
        window.location.replace(queryState.nextPath);
        return;
      }

      dispatch({
        type: "SUBMIT_FAIL",
        payload: { error: result.error }
      });
    },
    [basePath, queryState.nextPath, dispatch]
  );

  const onRegister = useCallback(
    async (values: RegisterValues): Promise<void> => {
      dispatch({ type: "SUBMIT_START" });
      const result = await registerWithEmail(basePath, values as RegisterInput);
      if (result.ok && result.authenticated) {
        dispatch({ type: "SUBMIT_SUCCESS" });
        window.location.replace(queryState.nextPath);
        return;
      }

      dispatch({
        type: "SUBMIT_FAIL",
        payload: { error: result.error }
      });
    },
    [basePath, queryState.nextPath, dispatch]
  );

  const onBrokerConsentConfirm = useCallback(
    async (): Promise<void> => {
      if (!queryState.brokerConsentToken) {
        return;
      }

      dispatch({ type: "SUBMIT_START" });
      const result = await confirmBrokerConsent(basePath, queryState.brokerConsentToken);
      if (result.ok && result.authenticated) {
        dispatch({ type: "SUBMIT_SUCCESS" });
        window.location.replace(queryState.nextPath);
        return;
      }

      dispatch({
        type: "SUBMIT_FAIL",
        payload: { error: result.error }
      });
    },
    [basePath, queryState.brokerConsentToken, queryState.nextPath, dispatch]
  );

  const onBack = useCallback((): void => {
    const target = getBackNavigationTarget({
      currentScreen: state.screen,
      isPendingSetup: state.setupStatus.pending,
      selectedProvider: state.selectedProvider
    });

    onNavigateToScreen(target);
  }, [state.screen, state.setupStatus.pending, state.selectedProvider, onNavigateToScreen]);

  const onOpenPrivacy = useCallback((): void => {
    onNavigateToScreen("privacy");
  }, [onNavigateToScreen]);

  const onOpenHelp = useCallback((): void => {
    onNavigateToScreen("help");
  }, [onNavigateToScreen]);

  const onOpenEmailForm = useCallback((): void => {
    onNavigateToScreen("email");
  }, [onNavigateToScreen]);

  const onLogout = useCallback((): void => {
    const logoutUrl = resolveBasePathUrl(basePath, "/api/auth/logout");
    const loginUrl = resolveBasePathUrl(basePath, "/");

    void fetch(logoutUrl, {
      method: "POST",
      credentials: "include"
    }).finally(() => {
      window.location.replace(loginUrl);
    });
  }, [basePath]);

  const backVisible = shouldShowBack({
    currentScreen: state.screen,
    isPendingSetup: state.setupStatus.pending
  });

  return {
    setupStatus: state.setupStatus,
    session: state.session,
    localeBundle: state.localeBundle,
    fatalError: state.fatalError,
    isLoading: state.isLoading,
    isFinalizing: state.isFinalizing,
    authMode,
    needsAuthentication,
    screen: state.screen,
    isBusy: state.isBusy,
    formError: state.formError,
    brokerError: state.brokerError,
    selectedProvider: state.selectedProvider,
    providers: state.providers,
    shouldShowBack: backVisible,
    hasPendingBrokerConsent,
    brokerProvider: queryState.provider ?? null,
    brokerProjectId: queryState.brokerProjectId ?? null,
    onProviderSelect,
    onLogin,
    onRegister,
    onBrokerConsentConfirm,
    onNavigateToScreen,
    onOpenEmailForm,
    onBack,
    onLogout,
    onOpenPrivacy,
    onOpenHelp,
    translator
  };
};

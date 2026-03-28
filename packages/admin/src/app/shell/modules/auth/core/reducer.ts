import type { ProviderId, SessionPayload, SetupStatus } from "../../../../../types/auth.js";
import type { LocaleBundle } from "../../../../../i18n/client.js";

export type AuthScreen = "provider" | "email" | "privacy" | "help" | "broker-consent";

export interface AuthState {
  setupStatus: SetupStatus;
  session: SessionPayload;
  providers: ProviderId[];
  localeBundle: LocaleBundle | null;
  fatalError: string | null;
  isLoading: boolean;
  isFinalizing: boolean;
  screen: AuthScreen;
  isBusy: boolean;
  formError: string | null;
  brokerError: boolean;
  selectedProvider: ProviderId | null;
}

export type AuthAction =
  | { type: "BOOTSTRAP_START" }
  | { type: "BOOTSTRAP_SUCCESS"; payload: { setupStatus: SetupStatus; providers: ProviderId[]; session: SessionPayload; localeBundle: LocaleBundle } }
  | { type: "BOOTSTRAP_FAIL"; payload: { error: string } }
  | { type: "FINALIZE_START" }
  | { type: "FINALIZE_SUCCESS" }
  | { type: "FINALIZE_FAIL"; payload: { error: string | null } }
  | { type: "SCREEN_CHANGE"; payload: { screen: AuthScreen } }
  | { type: "PROVIDER_SELECT"; payload: { provider: ProviderId } }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_FAIL"; payload: { error: string | null } }
  | { type: "BROKER_ERROR_SET"; payload: { value: boolean } }
  | { type: "FORM_ERROR_CLEAR" }
  | { type: "RESET_PROVIDER" };

/**
 * Canonical auth state reducer. All mutations flow through actions.
 * Screen transitions only occur via explicit actions.
 */
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "BOOTSTRAP_START":
      return { ...state, isLoading: true };

    case "BOOTSTRAP_SUCCESS":
      return {
        ...state,
        setupStatus: action.payload.setupStatus,
        providers: action.payload.providers,
        session: action.payload.session,
        localeBundle: action.payload.localeBundle,
        isLoading: false,
        fatalError: null
      };

    case "BOOTSTRAP_FAIL":
      return {
        ...state,
        isLoading: false,
        fatalError: action.payload.error
      };

    case "FINALIZE_START":
      return { ...state, isFinalizing: true };

    case "FINALIZE_SUCCESS":
      return { ...state, isFinalizing: false };

    case "FINALIZE_FAIL":
      return {
        ...state,
        isFinalizing: false,
        formError: action.payload.error,
        brokerError: true
      };

    case "SCREEN_CHANGE":
      return { ...state, screen: action.payload.screen };

    case "PROVIDER_SELECT":
      return {
        ...state,
        selectedProvider: action.payload.provider,
        formError: null,
        brokerError: false,
        ...(action.payload.provider === "email" ? { screen: "email" } : {})
      };

    case "SUBMIT_START":
      return { ...state, isBusy: true, formError: null };

    case "SUBMIT_SUCCESS":
      return { ...state, isBusy: false };

    case "SUBMIT_FAIL":
      return {
        ...state,
        isBusy: false,
        formError: action.payload.error
      };

    case "BROKER_ERROR_SET":
      return { ...state, brokerError: action.payload.value };

    case "FORM_ERROR_CLEAR":
      return { ...state, formError: null };

    case "RESET_PROVIDER":
      return { ...state, selectedProvider: null };

    default:
      return state;
  }
};

export const createInitialAuthState = (): AuthState => ({
  setupStatus: { pending: true, preferredAuthMethod: null },
  session: { authenticated: false, user: null },
  providers: [],
  localeBundle: null,
  fatalError: null,
  isLoading: true,
  isFinalizing: false,
  screen: "provider",
  isBusy: false,
  formError: null,
  brokerError: false,
  selectedProvider: null
});

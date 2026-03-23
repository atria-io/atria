import type { AuthScreen } from "./reducer.js";
import type { ProviderId } from "../../../../types/auth.js";
import {
  buildPathWithRouteQuery,
  currentPathWithRouteQuery,
  getCanonicalPathname,
  screenToRouteQuery
} from "./screen-sync.js";

/**
 * Navigation rules for auth screens.
 * Encodes valid transitions and URL synchronization.
 */
export const navigateToScreen = (options: {
  nextScreen: AuthScreen;
  isPendingSetup: boolean;
  currentScreenPush?: (path: string) => void;
}): void => {
  const { nextScreen, isPendingSetup, currentScreenPush } = options;

  const pathname = getCanonicalPathname(isPendingSetup);
  const routeQuery = screenToRouteQuery(nextScreen);
  const targetPath = buildPathWithRouteQuery(pathname, routeQuery);

  if (currentPathWithRouteQuery() !== targetPath && currentScreenPush) {
    currentScreenPush(targetPath);
  }
};

/**
 * Determines back button behavior from current screen.
 * Handles create vs login mode routing.
 */
export const getBackNavigationTarget = (options: {
  currentScreen: AuthScreen;
  isPendingSetup: boolean;
  selectedProvider: ProviderId | null;
}): AuthScreen => {
  const { currentScreen, isPendingSetup, selectedProvider } = options;

  if (currentScreen === "email") {
    return isPendingSetup ? "provider" : "provider";
  }

  if (currentScreen === "privacy" || currentScreen === "help") {
    if (isPendingSetup) {
      return "provider";
    }

    return selectedProvider === "email" ? "email" : "provider";
  }

  return "provider";
};

/**
 * Determines whether back button should render on current screen.
 */
export const shouldShowBack = (options: {
  currentScreen: AuthScreen;
  isPendingSetup: boolean;
}): boolean => {
  const { currentScreen, isPendingSetup } = options;

  if (isPendingSetup) {
    return currentScreen !== "provider";
  }

  return currentScreen === "privacy" || currentScreen === "help";
};

/**
 * Determines page title from screen and mode.
 */
export const getTitleForScreen = (options: {
  screen: AuthScreen;
  isPendingSetup: boolean;
  translate: (key: string) => string;
}): string => {
  const { screen, isPendingSetup, translate } = options;

  if (screen === "email") {
    return translate(isPendingSetup ? "auth.title.create" : "auth.title.login");
  }

  return translate(isPendingSetup ? "auth.title.create" : "auth.title.chooseProvider");
};

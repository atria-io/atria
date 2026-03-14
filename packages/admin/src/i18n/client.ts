import type { ApiClient } from "../state/api.client.js";
import { DEFAULT_MESSAGES_BY_LOCALE, FALLBACK_LOCALE, type AdminMessages } from "./messages.js";

export interface LocaleBundle {
  locale: string;
  availableLocales: string[];
  messages: AdminMessages;
}

interface LocaleListPayload {
  ok: boolean;
  locales: string[];
}

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const LOCALE_STORAGE_KEY = "atria.admin.locale";

const isMessageDictionary = (payload: unknown): payload is AdminMessages => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  return Object.values(payload).every((value) => typeof value === "string");
};

const normalizeLocaleToken = (value: string): string => value.trim();

const resolvePreferredLocale = (requestedLocale: string, availableLocales: string[]): string => {
  const normalizedRequested = normalizeLocaleToken(requestedLocale);

  if (availableLocales.includes(normalizedRequested)) {
    return normalizedRequested;
  }

  const requestedLanguage = normalizedRequested.split("-")[0]?.toLowerCase();
  if (requestedLanguage) {
    const languageMatch = availableLocales.find(
      (locale) => locale.split("-")[0]?.toLowerCase() === requestedLanguage
    );

    if (languageMatch) {
      return languageMatch;
    }
  }

  if (availableLocales.includes("pt-PT")) {
    return "pt-PT";
  }

  if (availableLocales.includes(FALLBACK_LOCALE)) {
    return FALLBACK_LOCALE;
  }

  return availableLocales[0] ?? FALLBACK_LOCALE;
};

const formatWithParams = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) => {
    const nextValue = params[token];
    return nextValue === undefined ? match : String(nextValue);
  });
};

const fallbackMessagesForLocale = (locale: string): AdminMessages => {
  return DEFAULT_MESSAGES_BY_LOCALE[locale] ?? DEFAULT_MESSAGES_BY_LOCALE[FALLBACK_LOCALE];
};

export const createInitialLocaleBundle = (): LocaleBundle => ({
  locale: FALLBACK_LOCALE,
  availableLocales: Object.keys(DEFAULT_MESSAGES_BY_LOCALE),
  messages: fallbackMessagesForLocale(FALLBACK_LOCALE)
});

export const createTranslator = (bundle: LocaleBundle): TranslateFn => {
  const fallback = DEFAULT_MESSAGES_BY_LOCALE[FALLBACK_LOCALE];

  return (key: string, params?: Record<string, string | number>): string => {
    const template = bundle.messages[key] ?? fallback[key] ?? key;
    return formatWithParams(template, params);
  };
};

export const readPreferredLocale = (): string => {
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (fromStorage && fromStorage.length > 0) {
      return fromStorage;
    }
  } catch {
    // Ignore storage unavailability.
  }

  return window.navigator.language || FALLBACK_LOCALE;
};

export const persistPreferredLocale = (locale: string): void => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage write errors.
  }
};

export const loadLocaleBundle = async (
  apiClient: ApiClient,
  requestedLocale: string
): Promise<LocaleBundle> => {
  const localeListPayload = await apiClient.getJson<LocaleListPayload>("/api/admin/i18n");
  const availableLocales =
    localeListPayload?.ok === true && Array.isArray(localeListPayload.locales)
      ? localeListPayload.locales.filter((locale) => typeof locale === "string")
      : Object.keys(DEFAULT_MESSAGES_BY_LOCALE);

  const locale = resolvePreferredLocale(requestedLocale, availableLocales);
  const remoteMessages = await apiClient.getJson<unknown>(`/api/admin/i18n/${encodeURIComponent(locale)}`);

  return {
    locale,
    availableLocales,
    messages: isMessageDictionary(remoteMessages)
      ? { ...fallbackMessagesForLocale(locale), ...remoteMessages }
      : fallbackMessagesForLocale(locale)
  };
};

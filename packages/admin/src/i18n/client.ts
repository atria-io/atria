import type { ApiClient } from "../state/api.client.js";

export type AdminMessages = Record<string, string>;
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface LocaleBundle {
  locale: string;
  availableLocales: string[];
  messages: AdminMessages;
}

const LOCALE_STORAGE_KEY = "atria.admin.locale";
const DEFAULT_LOCALE = "en-US";

const isMessageDictionary = (value: unknown): value is AdminMessages =>
  typeof value === "object" &&
  value !== null &&
  Object.values(value).every((entry) => typeof entry === "string");

const resolveLocale = (requestedLocale: string, availableLocales: string[]): string => {
  const locale = requestedLocale.trim();
  if (availableLocales.includes(locale)) {
    return locale;
  }

  if (availableLocales.includes(DEFAULT_LOCALE)) {
    return DEFAULT_LOCALE;
  }

  throw new Error(`Locale "${locale}" is not available.`);
};

const formatMessage = (template: string, params?: Record<string, string | number>): string =>
  !params
    ? template
    : template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) =>
        params[token] === undefined ? match : String(params[token])
      );

export const createTranslator = (bundle: LocaleBundle): TranslateFn => {
  return (key: string, params?: Record<string, string | number>): string => {
    const template = bundle.messages[key];
    if (!template) {
      throw new Error(`Missing message "${key}" for locale "${bundle.locale}".`);
    }

    return formatMessage(template, params);
  };
};

export const readPreferredLocale = (): string => {
  try {
    const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (locale) {
      return locale;
    }
  } catch {}

  return window.navigator.language || DEFAULT_LOCALE;
};

export const persistPreferredLocale = (locale: string): void => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
};

/**
 * Loads the locale list and the selected locale dictionary from the admin API.
 *
 * @param {ApiClient} apiClient
 * @param {string} requestedLocale
 * @returns {Promise<LocaleBundle>}
 */
export const loadLocaleBundle = async (
  apiClient: ApiClient,
  requestedLocale: string
): Promise<LocaleBundle> => {
  const localeList = await apiClient.getJson<{ ok: boolean; locales: string[] }>("/api/admin/i18n");
  const availableLocales = localeList?.ok === true ? localeList.locales.filter(Boolean) : [];
  if (availableLocales.length === 0) {
    throw new Error("Admin locales are unavailable.");
  }

  const locale = resolveLocale(requestedLocale, availableLocales);
  const messages = await apiClient.getJson<unknown>(`/api/admin/i18n/${encodeURIComponent(locale)}`);
  if (!isMessageDictionary(messages)) {
    throw new Error(`Locale "${locale}" is invalid.`);
  }

  return { locale, availableLocales, messages };
};

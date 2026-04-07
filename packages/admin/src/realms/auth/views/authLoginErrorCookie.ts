const isDocumentAvailable = (): boolean => typeof document !== "undefined";

export const readAuthLoginErrorCookie = (): string | null => {
  if (!isDocumentAvailable()) {
    return null;
  }

  const prefix = "atria_login_error=";
  for (const chunk of document.cookie.split(";")) {
    const value = chunk.trim();
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }

  return null;
};

export const clearAuthLoginErrorCookie = (): void => {
  if (!isDocumentAvailable()) {
    return;
  }

  document.cookie = "atria_login_error=; Path=/; Max-Age=0";
};

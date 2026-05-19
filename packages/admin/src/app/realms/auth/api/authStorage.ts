const isDocumentAvailable = (): boolean => typeof document !== "undefined";

export const readAuthSignInErrorCookie = (): string | null => {
  if (!isDocumentAvailable()) {
    return null;
  }

  const prefix = "atria_signin_error=";
  for (const chunk of document.cookie.split(";")) {
    const value = chunk.trim();
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }

  return null;
};

export const clearAuthSignInErrorCookie = (): void => {
  if (!isDocumentAvailable()) {
    return;
  }

  document.cookie = "atria_signin_error=; Path=/; Max-Age=0";
};

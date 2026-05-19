export const read = (): string | null => {
  if (typeof document === "undefined") {
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

export const clear = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "atria_signin_error=; Path=/; Max-Age=0";
};

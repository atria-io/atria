export const clearBrokerQueryParamsFromLocation = (): void => {
  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.delete("broker_code");
  targetUrl.searchParams.delete("code");
  targetUrl.searchParams.delete("broker_consent_token");
  targetUrl.searchParams.delete("project_id");
  targetUrl.searchParams.delete("provider");

  const queryString = targetUrl.searchParams.toString();
  const nextLocation = queryString.length > 0 ? `${targetUrl.pathname}?${queryString}` : targetUrl.pathname;
  window.history.replaceState({}, "", nextLocation);
};

export const normalizeLegacyBrokerConsentParamInLocation = (): void => {
  const targetUrl = new URL(window.location.href);
  const legacyToken = targetUrl.searchParams.get("broker_consent_token");
  if (!legacyToken || targetUrl.searchParams.has("code")) {
    return;
  }

  targetUrl.searchParams.set("code", legacyToken);
  targetUrl.searchParams.delete("broker_consent_token");

  const queryString = targetUrl.searchParams.toString();
  const nextLocation = queryString.length > 0 ? `${targetUrl.pathname}?${queryString}` : targetUrl.pathname;
  window.history.replaceState({}, "", nextLocation);
};

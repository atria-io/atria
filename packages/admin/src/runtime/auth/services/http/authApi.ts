import * as type from "../../types.js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const signInWithPassword = async (
  values: type.SignInValues
): Promise<Response> => {
  return fetch("/auth/sign-in", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(values),
  });
};

export const createOwnerAccount = async (
  values: type.CreateOwnerValues
): Promise<Response> => {
  return fetch("/auth/create-owner", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(values),
  });
};

export const initializeWorkspace = async (): Promise<Response> => {
  return fetch("/admin/setup", { method: "POST" });
};

export const confirmBrokerConsent = async (
  payload: type.BrokerConsentPayload
): Promise<Response> => {
  return fetch("/api/auth/broker/consent", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
};

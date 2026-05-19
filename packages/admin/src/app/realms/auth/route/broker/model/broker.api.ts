import type { BrokerConsentPayload } from "./broker.types.js";

export const confirmConsent = (
  payload: BrokerConsentPayload,
): Promise<Response> => {
  return fetch("/api/auth/broker/consent", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });
};

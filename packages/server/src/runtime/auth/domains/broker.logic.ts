import {
  createSessionForBrokerProfile,
  createSessionForLinkedProvider,
  type SessionResult,
} from "./broker.db.js";
import { confirmBrokerConsent, exchangeBrokerCode } from "./broker.fetch.js";

export type BrokerConfirmFailureCode =
  | "invalid_payload"
  | "consent_rejected"
  | "broker_confirm_failed"
  | "no_user_available"
  | "session_creation_failed";

export type BrokerConfirmOutcome =
  | { status: "ok"; sessionId: string }
  | { status: "error"; code: BrokerConfirmFailureCode };

export const resolveBrokerConfirm = async (params: {
  isSupportedProvider: boolean;
  projectId: string;
  brokerConsentToken: string;
  brokerCode: string;
}): Promise<BrokerConfirmOutcome> => {
  const { isSupportedProvider, projectId, brokerConsentToken, brokerCode } = params;

  if (
    !isSupportedProvider ||
    projectId === "" ||
    (brokerConsentToken === "" && brokerCode === "")
  ) {
    return { status: "error", code: "invalid_payload" };
  }

  const confirmResult =
    brokerCode !== ""
      ? { status: "ok" as const, brokerCode }
      : await confirmBrokerConsent(brokerConsentToken, projectId);

  if (confirmResult.status !== "ok" || confirmResult.brokerCode === "") {
    if (confirmResult.status === "rejected") {
      return { status: "error", code: "consent_rejected" };
    }

    return { status: "error", code: "broker_confirm_failed" };
  }

  const exchangeResult = await exchangeBrokerCode(confirmResult.brokerCode, projectId);
  if (exchangeResult.status !== "ok") {
    return { status: "error", code: "broker_confirm_failed" };
  }

  const sessionResult = await createSessionForBrokerProfile(exchangeResult.profile);
  if (sessionResult.status === "no-user") {
    return { status: "error", code: "no_user_available" };
  }

  if (sessionResult.status !== "ok") {
    return { status: "error", code: "session_creation_failed" };
  }

  return { status: "ok", sessionId: sessionResult.sessionId };
};

export const resolveBrokerCodeToSession = async (
  brokerCode: string,
  projectId: string
): Promise<SessionResult> => {
  const exchangeResult = await exchangeBrokerCode(brokerCode, projectId);
  if (exchangeResult.status !== "ok") {
    return { status: "failed", sessionId: "" };
  }

  return createSessionForBrokerProfile(exchangeResult.profile);
};

export const resolveLinkedProviderSession = async (
  provider: "google" | "github"
): Promise<SessionResult> => {
  return createSessionForLinkedProvider(provider);
};

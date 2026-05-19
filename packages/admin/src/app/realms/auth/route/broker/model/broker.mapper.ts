import type { BrokerConsentFailure } from "./broker.types.js";

interface BrokerConfirmErrorPayload {
  error?: {
    title?: unknown;
    message?: unknown;
    retryable?: unknown;
    backToSignIn?: unknown;
  };
}

const toBrokerConsentFailure = (error: {
  title?: unknown;
  message?: unknown;
  retryable?: unknown;
  backToSignIn?: unknown;
}): BrokerConsentFailure => {
  if (
    typeof error.title !== "string" ||
    typeof error.message !== "string" ||
    typeof error.retryable !== "boolean" ||
    typeof error.backToSignIn !== "boolean"
  ) {
    throw new Error("Invalid broker confirm error payload.");
  }

  return {
    title: error.title,
    message: error.message,
    retryable: error.retryable,
    backToSignIn: error.backToSignIn,
  };
};

export const mapBrokerConfirmError = async (
  response: Response,
): Promise<BrokerConsentFailure> => {
  const payload = (await response.json()) as BrokerConfirmErrorPayload;
  const error = payload.error;

  if (!error) {
    throw new Error("Missing broker confirm error payload.");
  }

  return toBrokerConsentFailure(error);
};

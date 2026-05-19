export interface BrokerConsentFailure {
  title: string;
  message: string;
  retryable: boolean;
  backToSignIn: boolean;
}

interface BrokerConfirmErrorPayload {
  error?: {
    title?: unknown;
    message?: unknown;
    retryable?: unknown;
    backToSignIn?: unknown;
  };
}

export const mapBrokerConfirmError = async (
  response: Response,
  fallback: BrokerConsentFailure
): Promise<BrokerConsentFailure> => {
  try {
    const payload = (await response.json()) as BrokerConfirmErrorPayload;
    const error = payload.error;
    if (!error) {
      return fallback;
    }

    return {
      title: typeof error.title === "string" ? error.title : fallback.title,
      message: typeof error.message === "string" ? error.message : fallback.message,
      retryable: typeof error.retryable === "boolean" ? error.retryable : fallback.retryable,
      backToSignIn: typeof error.backToSignIn === "boolean" ? error.backToSignIn : fallback.backToSignIn,
    };
  } catch {
    return fallback;
  }
};

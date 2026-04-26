export interface BrokerConsentFailure {
  title: string;
  message: string;
  retryable: boolean;
  backToLogin: boolean;
}

interface BrokerConfirmErrorPayload {
  error?: {
    title?: unknown;
    message?: unknown;
    retryable?: unknown;
    backToLogin?: unknown;
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
      backToLogin: typeof error.backToLogin === "boolean" ? error.backToLogin : fallback.backToLogin,
    };
  } catch {
    return fallback;
  }
};

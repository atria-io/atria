export type BrokerConfirmErrorCode =
  | "invalid_payload"
  | "consent_rejected"
  | "broker_confirm_failed"
  | "no_user_available"
  | "session_creation_failed";

export interface BrokerConfirmError {
  code: BrokerConfirmErrorCode;
  title: string;
  message: string;
  retryable: boolean;
  backToLogin: boolean;
}

export interface BrokerConfirmErrorResponse {
  ok: false;
  error: BrokerConfirmError;
}

export interface BrokerConfirmPayload {
  provider?: string;
  project_id?: string;
  broker_consent_token?: string;
  broker_code?: string;
}

export type BrokerProvider = "google" | "github";

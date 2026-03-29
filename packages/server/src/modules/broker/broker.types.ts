export interface BrokerConsentPlaceholderResponse {
  status: "placeholder";
  message: string;
}

export interface BrokerConfirmPayload {
  provider?: string;
  project_id?: string;
  broker_consent_token?: string;
}

export type BrokerProvider = "google" | "github";

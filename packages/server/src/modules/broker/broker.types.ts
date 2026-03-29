export interface BrokerConsentPlaceholderResponse {
  status: "placeholder";
  message: string;
}

export interface BrokerConfirmPayload {
  provider?: string;
  project_id?: string;
  broker_consent_token?: string;
  broker_code?: string;
}

export type BrokerProvider = "google" | "github";

export interface BrokerExchangeResult {
  provider: BrokerProvider;
  projectId: string;
  brokerConsentToken: string;
  brokerCode: string;
}

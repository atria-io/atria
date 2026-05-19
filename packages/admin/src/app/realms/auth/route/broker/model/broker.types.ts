import * as React from "react";

export interface BrokerConsentPayload {
  provider: string;
  project_id: string;
  broker_consent_token: string;
  broker_code: string;
}

export interface BrokerConsentFailure {
  title: string;
  message: string;
  retryable: boolean;
  backToSignIn: boolean;
}

export interface BrokerViewModel {
  isSubmitting: boolean;
  failure: BrokerConsentFailure | null;
  onSubmitConfirm: React.SubmitEventHandler<HTMLFormElement>;
  onBackToSignIn: () => void;
}

import { useMemo, useState, type SubmitEventHandler } from "react";
import { confirmBrokerConsent } from "../api/authApi.js";
import type { BrokerConsentPayload } from "../AuthTypes.js";
import { mapBrokerConfirmError, type BrokerConsentFailure } from "../mappers/authErrorMapper.js";

const brokerConsentFallback: BrokerConsentFailure = {
  title: "Consent confirmation failed",
  message: "Unable to confirm broker consent.",
  retryable: true,
  backToSignIn: false,
};

const brokerConsentConnectionFailure: BrokerConsentFailure = {
  title: "Connection error",
  message: "Unable to reach broker confirmation endpoint.",
  retryable: true,
  backToSignIn: false,
};

const readBrokerPayloadFromLocation = (): BrokerConsentPayload => {
  const params = new URLSearchParams(window.location.search);
  return {
    provider: params.get("provider") ?? "",
    project_id: params.get("project_id") ?? "",
    broker_consent_token: params.get("code") ?? params.get("broker_consent_token") ?? "",
    broker_code: params.get("broker_code") ?? "",
  };
};

const navigateToCleanBrokerUrl = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete("screen");
  url.searchParams.delete("provider");
  url.searchParams.delete("project_id");
  url.searchParams.delete("code");
  url.searchParams.delete("broker_consent_token");
  url.searchParams.delete("broker_code");
  url.searchParams.delete("next");

  const cleanPath = url.pathname === "/create" ? "/" : url.pathname;
  const cleanQuery = url.searchParams.toString();
  window.location.replace(cleanQuery === "" ? cleanPath : `${cleanPath}?${cleanQuery}`);
};

export interface BrokerConsentModel {
  isSubmitting: boolean;
  failure: BrokerConsentFailure | null;
  onSubmitConfirm: SubmitEventHandler<HTMLFormElement>;
  onBackToSignIn: () => void;
}

export const useBrokerConsent = (): BrokerConsentModel => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<BrokerConsentFailure | null>(null);

  const brokerPayload = useMemo(readBrokerPayloadFromLocation, []);

  const onSubmitConfirm: SubmitEventHandler<HTMLFormElement> = async (event): Promise<void> => {
    event.preventDefault();
    setFailure(null);
    setIsSubmitting(true);

    try {
      const response = await confirmBrokerConsent(brokerPayload);

      if (response.status === 204) {
        navigateToCleanBrokerUrl();
        return;
      }

      const mappedFailure = await mapBrokerConfirmError(response, brokerConsentFallback);
      setFailure(mappedFailure);
    } catch {
      setFailure(brokerConsentConnectionFailure);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBackToSignIn = (): void => {
    window.location.assign("/");
  };

  return {
    isSubmitting,
    failure,
    onSubmitConfirm,
    onBackToSignIn,
  };
};

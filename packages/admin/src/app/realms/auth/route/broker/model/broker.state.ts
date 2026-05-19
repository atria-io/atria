import * as React from "react";
import { confirmConsent } from "./broker.api.js";
import { mapBrokerConfirmError } from "./broker.mapper.js";
import type {
  BrokerConsentFailure,
  BrokerConsentPayload,
  BrokerViewModel,
} from "./broker.types.js";

const brokerConsentResponseFailure: BrokerConsentFailure = {
  title: "Consent confirmation failed",
  message: "Unable to parse broker confirmation response.",
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

export const useBrokerConsent = (): BrokerViewModel => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [failure, setFailure] = React.useState<BrokerConsentFailure | null>(null);

  const brokerPayload = React.useMemo(readBrokerPayloadFromLocation, []);

  const onSubmitConfirm: React.SubmitEventHandler<HTMLFormElement> = async (
    event,
  ): Promise<void> => {
    event.preventDefault();
    setFailure(null);
    setIsSubmitting(true);

    try {
      const response = await confirmConsent(brokerPayload);

      if (response.status === 204) {
        navigateToCleanBrokerUrl();
        return;
      }

      try {
        const mappedFailure = await mapBrokerConfirmError(response);
        setFailure(mappedFailure);
      } catch {
        setFailure(brokerConsentResponseFailure);
      }
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

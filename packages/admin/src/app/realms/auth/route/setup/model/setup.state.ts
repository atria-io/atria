import * as React from "react";
import { adminSetup } from "./setup.api.js";

export interface SetupModel {
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export const useSetupState = (): SetupModel => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const response = await adminSetup();
    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setIsSubmitting(false);
  };

  return { isSubmitting, onSubmit };
};

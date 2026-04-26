import { useEffect, useState } from "react";
import { createOwnerAccount } from "../api/authApi.js";
import { clearAuthSignInErrorCookie, readAuthSignInErrorCookie } from "../cookies/authSignInErrorCookie.js";
import type { CreateOwnerValues } from "../AuthTypes.js";

const OAUTH_FAILURE_MESSAGE = "Could not complete browser sign-in. Please try again.";
const CREATE_OWNER_FAILURE_MESSAGE = "Could not create owner account. Please try again.";

export interface CreateOwnerModel {
  errorMessage: string | null;
  showEmailForm: boolean;
  onEnableEmailForm: () => void;
  onBackToProviderOptions: () => void;
  onSubmitCreateOwner: (values: CreateOwnerValues) => Promise<void>;
}

export const useCreateOwner = (): CreateOwnerModel => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const signal = readAuthSignInErrorCookie();
    if (signal === "oauth_failed") {
      setErrorMessage(OAUTH_FAILURE_MESSAGE);
      clearAuthSignInErrorCookie();
    }
  }, []);

  const onSubmitCreateOwner = async (values: CreateOwnerValues): Promise<void> => {
    setErrorMessage(null);

    const response = await createOwnerAccount(values);
    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setErrorMessage(CREATE_OWNER_FAILURE_MESSAGE);
  };

  const onEnableEmailForm = (): void => {
    setShowEmailForm(true);
  };

  const onBackToProviderOptions = (): void => {
    setShowEmailForm(false);
  };

  return {
    errorMessage,
    showEmailForm,
    onEnableEmailForm,
    onBackToProviderOptions,
    onSubmitCreateOwner,
  };
};

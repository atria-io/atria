import { useEffect, useState } from "react";
import { signInWithPassword } from "../api/authApi.js";
import { clearAuthSignInErrorCookie, readAuthSignInErrorCookie } from "../cookies/authSignInErrorCookie.js";
import type { SignInValues } from "../AuthTypes.js";

const OAUTH_FAILURE_MESSAGE = "Could not complete browser sign-in. Please try again.";

export interface SignInModel {
  errorMessage: string | null;
  showEmailForm: boolean;
  onEnableEmailForm: () => void;
  onBackToProviderOptions: () => void;
  onSubmitSignIn: (values: SignInValues) => Promise<void>;
}

export const useSignIn = (): SignInModel => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const signal = readAuthSignInErrorCookie();
    if (signal === "oauth_failed") {
      setErrorMessage(OAUTH_FAILURE_MESSAGE);
      clearAuthSignInErrorCookie();
    }
  }, []);

  const onSubmitSignIn = async (values: SignInValues): Promise<void> => {
    setErrorMessage(null);

    const response = await signInWithPassword(values);
    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setErrorMessage(OAUTH_FAILURE_MESSAGE);
  };

  const onEnableEmailForm = (): void => {
    setErrorMessage(null);
    setShowEmailForm(true);
  };

  const onBackToProviderOptions = (): void => {
    setErrorMessage(null);
    setShowEmailForm(false);
  };

  return {
    errorMessage,
    showEmailForm,
    onEnableEmailForm,
    onBackToProviderOptions,
    onSubmitSignIn,
  };
};

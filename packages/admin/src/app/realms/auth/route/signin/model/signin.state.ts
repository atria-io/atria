import * as React from "react";
import { signIn } from "./signin.api.js";
import {
  clear,
  read,
} from "@/app/realms/auth/model/auth.storage.js";
import type { SignInModel, SignInValues } from "./signin.types.js";

export const useSignInState = (): SignInModel => {
  const [errorMessage, setError] = React.useState<string | null>(null);
  const [showEmailForm, setShow] = React.useState(false);

  React.useEffect(() => {
    if (read() === "oauth_failed") {
      setError("Could not complete browser sign-in. Please try again.");
      clear();
    }
  }, []);

  const submit = async (values: SignInValues): Promise<void> => {
    setError(null);

    const response = await signIn(values);
    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setError("Could not complete browser sign-in. Please try again.");
  };

  const email = (): void => {
    setError(null);
    setShow(true);
  };

  const back = (): void => {
    setError(null);
    setShow(false);
  };

  return {
    errorMessage,
    showEmailForm,
    onEnableEmailForm: email,
    onBackToProviderOptions: back,
    onSubmitSignIn: submit,
  };
};

import * as React from "react";
import * as Cookies from "@/app/realms/auth/model/auth.storage.js";
import { createAccount } from "./create.api.js";
import type { CreateOwnerModel, CreateOwnerValues } from "./create.types.js";

export const useStateCreate = (): CreateOwnerModel => {
  const [message, setMessage] = React.useState<string | null>(null);
  const [emailForm, setEmailForm] = React.useState(false);

  React.useEffect(() => {
    if (Cookies.read() === "oauth_failed") {
      setMessage("Could not complete browser sign-in. Please try again.");
      Cookies.clear();
    }
  }, []);

  const submit = async (
    values: CreateOwnerValues
  ): Promise<void> => {
    setMessage(null);

    const response = await createAccount(values);
    if (response.status === 204) {
      window.location.reload();
      return;
    }

    setMessage(
      "Could not create owner account. Please try again."
    );
  };

  const email = (): void => setEmailForm(true);
  const back = (): void => setEmailForm(false);

  return {
    errorMessage: message,
    showEmailForm: emailForm,
    onEnableEmailForm: email,
    onBackToProviderOptions: back,
    onSubmitCreateOwner: submit,
  };
};

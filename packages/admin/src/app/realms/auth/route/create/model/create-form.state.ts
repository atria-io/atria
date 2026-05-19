import * as React from "react";
import type { CreateFormModelParams } from "./create.types.js";

export const useCreateFormModel = ({ onSubmit }: CreateFormModelParams) => {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (
    event,
  ): void => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setLocalError(null);
    const firstNameValue = firstName.trim();
    const lastNameValue = lastName.trim();

    void onSubmit({
      firstName: firstNameValue,
      lastName: lastNameValue,
      name: [firstNameValue, lastNameValue].filter((value) => value !== "").join(" "),
      email: email.trim(),
      password
    });
  };

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    localError,
    handleSubmit
  };
};

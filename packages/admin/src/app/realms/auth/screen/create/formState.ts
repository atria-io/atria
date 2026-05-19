import { useState, type SubmitEventHandler } from "react";
import type { CreateOwnerValues } from "../../../types.js";

interface CreateFormModelParams {
  onSubmit: (values: CreateOwnerValues) => Promise<void> | void;
}

export const useCreateFormModel = ({ onSubmit }: CreateFormModelParams) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event): void => {
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

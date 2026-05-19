import * as React from "react";
import { Button, type ButtonProps } from "@atria/ui";
import { Form, FormSection } from "@atria/ui";
import { Input, type InputProps } from "@atria/ui";
import { Label } from "@atria/ui";
import type { SignInFormProps } from "../model/signin.types.js";

type AuthButtonProps = Omit<ButtonProps, "variant" | "size" | "align">;
type AuthInputProps = Omit<InputProps, "size" | "full">;

type FieldRowProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  autoComplete: string;
  type?: InputProps["type"];
};

type BackButtonProps = {
  onBack?: () => void;
  disabled: boolean;
};

function AuthButton(props: AuthButtonProps) {
  return <Button variant="solid" size="md" align="center" {...props} />;
}

function AuthInput(props: AuthInputProps) {
  return <Input size="sm" full {...props} />;
}

function BackButton({ onBack, disabled }: BackButtonProps) {
  if (!onBack) {
    return null;
  }

  return (
    <button type="button" className="button" onClick={onBack} disabled={disabled}>
      <span className="button__label">← Other sign in options</span>
    </button>
  );
}

function FieldRow({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  autoComplete,
  type,
}: FieldRowProps) {
  return (
    <div className="field field--gap-md">
      <Label size="xs" htmlFor={id} label={label} />
      <AuthInput
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
    </div>
  );
}

function FeedbackSection({ errorMessage }: Pick<SignInFormProps, "errorMessage">) {
  if (!errorMessage) {
    return null;
  }

  return (
    <FormSection scope="auth" section="feedback">
      <p className="field__error">{errorMessage}</p>
    </FormSection>
  );
}

function ActionsSection({
  disabled,
  onBack,
}: Pick<SignInFormProps, "disabled" | "onBack">) {
  return (
    <FormSection scope="auth" section="actions">
      <AuthButton
        type="submit"
        full
        loading={disabled}
        disabled={disabled}
        label={disabled ? undefined : "Sign in"}
      />
      <BackButton onBack={onBack} disabled={disabled ?? false} />
    </FormSection>
  );
}

function FormContent({
  props,
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  props: SignInFormProps;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  const disabled = props.disabled ?? false;
  const errorMessage = props.errorMessage ?? null;

  const fields: FieldRowProps[] = [
    {
      id: "auth-signin-email",
      name: "email",
      label: "Email",
      type: "email",
      value: email,
      onChange: onEmailChange,
      disabled,
      placeholder: "joe@example.com",
      autoComplete: "username",
    },
    {
      id: "auth-signin-password",
      name: "password",
      label: "Password",
      type: "password",
      value: password,
      onChange: onPasswordChange,
      disabled,
      placeholder: "••••••••",
      autoComplete: "current-password",
    },
  ];

  return (
    <>
      <FormSection scope="auth" section="fields">
        {fields.map((field) => (
          <FieldRow key={field.id} {...field} />
        ))}
      </FormSection>
      <FeedbackSection errorMessage={errorMessage} />
      <ActionsSection disabled={disabled} onBack={props.onBack} />
    </>
  );
}

function SignInForm(props: SignInFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (
    event,
  ): void => {
    event.preventDefault();
    void props.onSubmit({ email: email.trim(), password });
  };

  return (
    <Form scope="auth" onSubmit={handleSubmit}>
      <FormContent
        props={props}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
      />
    </Form>
  );
}

export { SignInForm };

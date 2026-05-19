import { Form, FormSection } from "@atria/ui";
import { Button, type ButtonProps } from "@atria/ui";
import { Input, type InputProps } from "@atria/ui";
import { Label } from "@atria/ui";
import { AuthCardText } from "../../../ui/components/AuthCard.js";
import { useCreateFormModel } from "../model/create-form.state.js";
import type { CreateOwnerFormProps } from "../model/create.types.js";

type BackButtonProps = {
  onBack?: () => void;
  disabled: boolean;
};

type AuthButtonProps = Omit<ButtonProps, "variant" | "size" | "align">;
type AuthInputProps = Omit<InputProps, "size" | "full">;

type FieldRowProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  autoComplete: string;
  type?: InputProps["type"];
  maxLength?: number;
};

type CreateFormModel = ReturnType<typeof useCreateFormModel>;

type FeedbackSectionProps = {
  localError: string | null;
  errorMessage: string | null;
};

type ActionsSectionProps = {
  disabled: boolean;
  onBack?: () => void;
};

function AuthButton(props: AuthButtonProps) {
  return (
    <Button
      variant="solid"
      size="md"
      align="center"
      {...props}
    />
  );
}

function AuthInput(props: AuthInputProps) {
  return (
    <Input
      size="sm"
      full
      {...props}
    />
  );
}

function BackButton({ onBack, disabled }: BackButtonProps) {
  if (!onBack) {
    return null;
  }

  return (
    <button type="button" className="button" onClick={onBack} disabled={disabled}>
      <span className="button__label">← Other sign up options</span>
    </button>
  );
}

function FieldRow({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  autoComplete,
  type,
  maxLength,
}: FieldRowProps) {
  return (
    <div className="field field--gap-md">
      <Label size="xs" htmlFor={id} label={label} />
      <AuthInput
        id={id}
        type={type}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
      />
    </div>
  );
}

function buildFieldRows(
  model: CreateFormModel,
  disabled: boolean,
): FieldRowProps[] {
  const {
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
  } = model;

  return [
    {
      id: "auth-create-first-name",
      label: "First name",
      value: firstName,
      onChange: setFirstName,
      disabled,
      placeholder: "Joe",
      autoComplete: "given-name",
      maxLength: 80,
    },
    {
      id: "auth-create-last-name",
      label: "Last name",
      value: lastName,
      onChange: setLastName,
      disabled,
      placeholder: "Doe",
      autoComplete: "family-name",
      maxLength: 80,
    },
    {
      id: "auth-create-email",
      label: "Email",
      value: email,
      onChange: setEmail,
      disabled,
      placeholder: "joe@example.com",
      autoComplete: "email",
      type: "email",
    },
    {
      id: "auth-create-password",
      label: "Password",
      value: password,
      onChange: setPassword,
      disabled,
      placeholder: "••••••••",
      autoComplete: "new-password",
      type: "password",
    },
    {
      id: "auth-create-confirm-password",
      label: "Confirm password",
      value: confirmPassword,
      onChange: setConfirmPassword,
      disabled,
      placeholder: "••••••••",
      autoComplete: "new-password",
      type: "password",
    },
  ];
}

function FeedbackSection({ localError, errorMessage }: FeedbackSectionProps) {
  if (!(localError || errorMessage)) {
    return null;
  }

  return (
    <FormSection scope="auth" section="feedback">
      {localError ? <p className="field__error">{localError}</p> : null}
      {errorMessage ? <p className="field__error">{errorMessage}</p> : null}
    </FormSection>
  );
}

function ActionsSection({ disabled, onBack }: ActionsSectionProps) {
  return (
    <FormSection scope="auth" section="actions">
      <AuthButton
        type="submit"
        full
        loading={disabled}
        disabled={disabled}
        label={disabled ? undefined : "Create account"}
      />

      <BackButton onBack={onBack} disabled={disabled} />
    </FormSection>
  );
}

function FormContent({
  props,
  model,
}: {
  props: CreateOwnerFormProps;
  model: CreateFormModel;
}) {
  const disabled = props.disabled ?? false;
  const errorMessage = props.errorMessage ?? null;
  const fields = buildFieldRows(model, disabled);

  return (
    <Form scope="auth" onSubmit={model.handleSubmit}>
      <AuthCardText>
        Use your email and password to create the owner account.
      </AuthCardText>
      <FormSection scope="auth" section="fields">
        {fields.map((field) => (
          <FieldRow key={field.id} {...field} />
        ))}
      </FormSection>
      <FeedbackSection localError={model.localError} errorMessage={errorMessage} />
      <ActionsSection disabled={disabled} onBack={props.onBack} />
    </Form>
  );
}

function CreateForm(props: CreateOwnerFormProps) {
  const model = useCreateFormModel({ onSubmit: props.onSubmit });
  return <FormContent props={props} model={model} />;
}

export { CreateForm };

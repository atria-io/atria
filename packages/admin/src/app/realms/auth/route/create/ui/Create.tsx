import { Button } from "@atria/ui";
import {
  AuthCard,
  AuthCardContent,
  AuthCardErrorMessage,
  AuthCardHeader,
  AuthCardHeaderText,
  AuthCardTitle,
} from "../../../ui/components/AuthCard.js";
import { ButtonProviders } from "../../../ui/components/ButtonProviders.js";
import { CreateForm } from "./CreateForm.js";
import type { CreateUiProps } from "../model/create.types.js";

function Header() {
  return (
    <AuthCardHeader>
      <AuthCardTitle>Create owner</AuthCardTitle>
      <AuthCardHeaderText>Create the first workspace account</AuthCardHeaderText>
    </AuthCardHeader>
  );
}

function EmailAction({
  submitting,
  onEnable,
}: {
  submitting: boolean;
  onEnable: () => void;
}) {
  return (
    <div className="auth-card__actions">
      <Button
        type="button"
        variant="solid"
        size="md"
        full
        scope="auth-provider"
        loading={submitting}
        onClick={onEnable}
        disabled={submitting}
        label={submitting ? undefined : "Continue with Email"}
      />
    </div>
  );
}

function Content({
  errorMessage,
  showEmailForm,
  onBackToProviderOptions,
  onSubmitCreateOwner,
  email,
}: Pick<
  CreateUiProps,
  "errorMessage" | "showEmailForm" | "onBackToProviderOptions" | "onSubmitCreateOwner" | "email"
>) {
  return (
    <AuthCardContent key={showEmailForm ? "email" : "providers"}>
      {!showEmailForm ? (
        <>
          <ButtonProviders mode="create" />
          <EmailAction submitting={email.submitting} onEnable={email.enable} />
        </>
      ) : (
        <CreateForm
          errorMessage={errorMessage}
          onSubmit={onSubmitCreateOwner}
          onBack={onBackToProviderOptions}
        />
      )}
    </AuthCardContent>
  );
}

function CreateUI(props: CreateUiProps) {
  return (
    <AuthCard>
      <Header />
      <Content {...props} />
      <AuthCardErrorMessage errorMessage={props.errorMessage} />
    </AuthCard>
  );
}

export { CreateUI };

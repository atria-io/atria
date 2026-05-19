import { Button } from "@atria/ui";
import { SignInForm } from "./SigninForm.js";
import {
  AuthCard,
  AuthCardContent,
  AuthCardErrorMessage,
  AuthCardHeader,
  AuthCardHeaderText,
  AuthCardTitle,
} from "../../../ui/components/AuthCard.js";
import { ButtonProviders } from "../../../ui/components/ButtonProviders.js";
import type { SignInModel } from "../model/signin.types.js";

function Header() {
  return (
    <AuthCardHeader>
      <AuthCardTitle>Sign in</AuthCardTitle>
      <AuthCardHeaderText>Access your workspace</AuthCardHeaderText>
    </AuthCardHeader>
  );
}

function Content({ model }: { model: Omit<SignInModel, "errorMessage"> }) {
  const {
    showEmailForm,
    onEnableEmailForm,
    onBackToProviderOptions,
    onSubmitSignIn,
  } = model;

  return (
    <AuthCardContent key={showEmailForm ? "email" : "providers"}>
      {!showEmailForm ? (
        <>
          <ButtonProviders mode="sign-in" />
          <div className="auth-card__actions">
            <Button
              type="button"
              variant="solid"
              size="md"
              full
              className="auth-provider-button"
              loading={false}
              onClick={onEnableEmailForm}
              label="Continue with Email"
            />
          </div>
        </>
      ) : (
        <SignInForm
          errorMessage={null}
          onSubmit={onSubmitSignIn}
          onBack={onBackToProviderOptions}
        />
      )}
    </AuthCardContent>
  );
}

function SignInUI({
  errorMessage,
  ...model
}: SignInModel) {
  return (
    <AuthCard>
      <Header />
      <Content model={model} />
      <AuthCardErrorMessage errorMessage={errorMessage} />
    </AuthCard>
  );
}

export { SignInUI };

import { Button } from "@atria/ui";
import { AuthCard, AuthCardContent, AuthCardHeader, AuthCardHeaderText, AuthCardTitle } from "../../../ui/components/AuthCard.js";
import type { SetupModel } from "../model/setup.state.js";

function Header() {
  return (
    <AuthCardHeader>
      <AuthCardTitle>Setup</AuthCardTitle>
      <AuthCardHeaderText>Initialize the workspace</AuthCardHeaderText>
    </AuthCardHeader>
  );
}

function SubmitButton({ isSubmitting, onSubmit }: SetupModel) {
  return (
    <Button
      type="button"
      variant="solid"
      size="md"
      full
      scope="auth-provider"
      loading={isSubmitting}
      onClick={() => void onSubmit()}
      disabled={isSubmitting}
      label={isSubmitting ? undefined : "Continue"}
    />
  );
}

function SetupUI({ isSubmitting, onSubmit }: SetupModel) {
  return (
    <AuthCard>
      <Header />
      <AuthCardContent>
        <SubmitButton isSubmitting={isSubmitting} onSubmit={onSubmit} />
      </AuthCardContent>
    </AuthCard>
  );
}

export { SetupUI };

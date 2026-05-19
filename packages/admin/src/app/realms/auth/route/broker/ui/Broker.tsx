import * as React from "react";
import { Button } from "@atria/ui";
import { AuthCard, AuthCardContent, AuthCardHeader, AuthCardHeaderText, AuthCardText, AuthCardTitle } from "../../../ui/components/AuthCard.js";
import type { BrokerViewModel } from "../model/broker.types.js";

function Header() {
  return (
    <AuthCardHeader>
      <AuthCardTitle>Confirm sign-in</AuthCardTitle>
      <AuthCardHeaderText>Authorize access to your workspace</AuthCardHeaderText>
    </AuthCardHeader>
  );
}

function BrokerActionButton({
  type = "button",
  loading = false,
  disabled = false,
  onClick,
  label,
}: {
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: React.ReactNode;
}) {
  return (
    <Button
      type={type}
      variant="solid"
      size="md"
      full
      scope="auth-provider"
      icon
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      label={loading ? undefined : label}
    />
  );
}

function Forms({
  failure,
  isSubmitting,
  onSubmitConfirm,
  onBackToSignIn,
}: BrokerViewModel) {
  if (!failure) {
    return (
      <form onSubmit={onSubmitConfirm}>
        <BrokerActionButton
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          label="Confirm"
        />
      </form>
    );
  }

  return (
    <>
      {failure.retryable ? (
        <form onSubmit={onSubmitConfirm}>
          <BrokerActionButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            label="Retry"
          />
        </form>
      ) : null}

      {failure.backToSignIn ? (
        <Button
          type="button"
          variant="solid"
          size="md"
          onClick={onBackToSignIn}
          label="← Back to sign in"
        />
      ) : null}
    </>
  );
}

function Content({
  failure,
  isSubmitting,
  onSubmitConfirm,
  onBackToSignIn,
}: BrokerViewModel) {
  return (
    <AuthCardContent>
      {failure ? (
        <>
          <AuthCardTitle as="h2">{failure.title}</AuthCardTitle>
          <AuthCardText>{failure.message}</AuthCardText>
        </>
      ) : null}
      <Forms
        failure={failure}
        isSubmitting={isSubmitting}
        onSubmitConfirm={onSubmitConfirm}
        onBackToSignIn={onBackToSignIn}
      />
    </AuthCardContent>
  );
}

function BrokerUI(model: BrokerViewModel) {
  return (
    <AuthCard>
      <Header />
      <Content {...model} />
    </AuthCard>
  );
}

export { BrokerUI };

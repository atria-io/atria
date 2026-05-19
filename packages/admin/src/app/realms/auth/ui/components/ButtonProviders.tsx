import * as React from "react";
import { Button } from "@atria/ui";
import icons from "@/boot/static/svg/icons.providers.js";
import { useProviderButtons } from "./useproviderbuttons.js";
import type { Mode, Provider } from "../../model/auth.types.js";

interface ButtonProvidersProps {
  mode: Mode;
}

interface ItemSVG {
  id: Provider;
  label: string;
  icon: React.ReactNode;
}

const SVG: ItemSVG[] = [
  { id: "google", label: "Continue with Google", icon: icons.google() },
  { id: "github", label: "Continue with GitHub", icon: icons.github() },
];

function ProviderButton({
  provider,
  isLoading,
  onClick,
}: {
  provider: ItemSVG;
  isLoading: boolean;
  onClick: (provider: Provider) => void;
}) {
  return (
    <Button
      icon
      size="md"
      variant="solid"
      align="center"
      className="auth-provider-button"
      loading={isLoading}
      onClick={() => onClick(provider.id)}
      disabled={isLoading}
      label={provider.label}
      full
    >
      {provider.icon}
    </Button>
  );
}

export const ButtonProviders = ({ mode }: ButtonProvidersProps) => {
  const { loadingProvider, onProviderClick } = useProviderButtons(mode);

  return (
    <>
      <div className="auth-card__actions">
        {SVG.map((provider) => (
          <ProviderButton
            key={provider.id}
            provider={provider}
            isLoading={loadingProvider === provider.id}
            onClick={onProviderClick}
          />
        ))}
      </div>

      <div className="auth-card__divider">
        <span className="auth-card__divider-text">or</span>
      </div>
    </>
  );
};

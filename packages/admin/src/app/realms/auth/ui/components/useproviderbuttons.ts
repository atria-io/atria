import * as React from "react";
import { pageshow } from "@/app/system/hooks/pageshow.js";
import { startOAuthRedirect } from "../../api/auth.client.js";
import type { Mode, Provider } from "../../model/auth.types.js";

export function useProviderButtons(mode: Mode) {
  const [loadingProvider, setLoadingProvider] = React.useState<Provider | null>(null);

  pageshow(() => {
    setLoadingProvider(null);
  });

  const onProviderClick = (provider: Provider): void => {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    startOAuthRedirect(provider, mode);
  };

  return {
    loadingProvider,
    onProviderClick,
  };
}

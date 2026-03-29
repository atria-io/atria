import { LockedScreen } from "../../modules/auth/LockedScreen.js";

export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
}

type AccessState = "unauthenticated" | "authenticated";

const getAccessState = (): AccessState => "unauthenticated";

const renderLockedScreen = (): void => {
  document.body.textContent = LockedScreen();
};

const bootstrapStudioApp = (mountElement: Element): void => {
  if (!mountElement.hasChildNodes()) {
    mountElement.textContent = "";
  }
};

export const mountAdminApp = (options: MountAdminOptions = {}): void => {
  const mountElement = options.mountElement ?? document.getElementById("atria");

  if (!mountElement) {
    return;
  }

  const accessState = getAccessState();
  switch (accessState) {
    case "unauthenticated":
      renderLockedScreen();
      return;
    case "authenticated":
      bootstrapStudioApp(mountElement);
      return;
  }
};

export const mountStudioApp = mountAdminApp;

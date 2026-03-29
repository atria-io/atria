export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
}

const hasSession = (): boolean => false;

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

  if (!hasSession()) {
    document.body.textContent = "Studio locked";
    return;
  }

  bootstrapStudioApp(mountElement);
};

export const mountStudioApp = mountAdminApp;

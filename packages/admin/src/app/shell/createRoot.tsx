export interface MountAdminOptions {
  mountElement?: Element | null;
  basePath?: string;
  reactStrictMode?: boolean;
}

export const mountAdminApp = (options: MountAdminOptions = {}): void => {
  const mountElement = options.mountElement ?? document.getElementById("atria");

  if (!mountElement) {
    return;
  }

  if (!mountElement.hasChildNodes()) {
    mountElement.textContent = "";
  }
};

export const mountStudioApp = mountAdminApp;

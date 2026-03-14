export interface ApiClient {
  getJson<T>(path: string): Promise<T | null>;
  postJson<T>(path: string, body?: unknown): Promise<T | null>;
}

const normalizeBasePath = (basePath: string): string => {
  if (!basePath || basePath === "/") {
    return "/";
  }

  return basePath.endsWith("/") ? basePath : `${basePath}/`;
};

const resolvePath = (basePath: string, path: string): string => {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBasePath}${normalizedPath}`;
};

const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T | null> => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...(init ?? {})
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const createApiClient = (basePath: string): ApiClient => ({
  getJson: <T,>(path: string): Promise<T | null> => requestJson<T>(resolvePath(basePath, path)),

  postJson: <T,>(path: string, body?: unknown): Promise<T | null> =>
    requestJson<T>(resolvePath(basePath, path), {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
});

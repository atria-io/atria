export interface ApiClient {
  getJson<T>(path: string): Promise<T | null>;
  postJson<T>(path: string, body?: unknown): Promise<T | null>;
}

/**
 * Resolves a path against the admin app base path.
 *
 * @param {string} basePath
 * @param {string} path
 * @returns {string}
 */
export const resolveBasePathUrl = (basePath: string, path: string): string =>
  `${!basePath || basePath === "/" ? "/" : basePath.endsWith("/") ? basePath : `${basePath}/`}${path.startsWith("/") ? path.slice(1) : path}`;

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

/**
 * Creates the tiny JSON client used by the admin app.
 *
 * @param {string} basePath
 * @returns {ApiClient}
 */
export const createApiClient = (basePath: string): ApiClient => ({
  getJson: <T,>(path: string): Promise<T | null> =>
    requestJson<T>(resolveBasePathUrl(basePath, path)),

  postJson: <T,>(path: string, body?: unknown): Promise<T | null> =>
    requestJson<T>(resolveBasePathUrl(basePath, path), {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
});

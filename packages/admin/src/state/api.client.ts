export interface ApiClient {
  getJson<T>(path: string): Promise<T | null>;
  postJson<T>(path: string, body?: unknown): Promise<T | null>;
}

/**
 * Canonical join for admin base path + relative route.
 * Keeping this in one place avoids mismatched URLs between runtime and auth requests.
 *
 * @param {string} basePath
 * @param {string} path
 * @returns {string}
 */
export const resolveBasePathUrl = (basePath: string, path: string): string =>
  `${!basePath || basePath === "/" ? "/" : basePath.endsWith("/") ? basePath : `${basePath}/`}${path.startsWith("/") ? path.slice(1) : path}`;

/**
 * Fetch boundary for JSON endpoints used by the admin app.
 * Any transport error or non-2xx response is normalized to `null` so UI flow can branch explicitly.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<T | null>}
 */
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
 * API contract used during auth/bootstrap: success returns parsed JSON, failure returns `null`.
 * This keeps network behavior deterministic for the hooks that decide loading/error state.
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

export interface ApiClient {
  getJson<T>(path: string): Promise<T>;
  postJson<T>(path: string, body?: unknown): Promise<T>;
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
 * Network errors propagate naturally. Non-2xx responses throw with status and body.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<T>}
 */
const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: "include",
    ...(init ?? {})
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  return (await response.json()) as T;
};

/**
 * API contract: success returns parsed JSON, errors throw.
 * Callers can handle errors explicitly where needed.
 *
 * @param {string} basePath
 * @returns {ApiClient}
 */
export const createApiClient = (basePath: string): ApiClient => ({
  getJson: <T,>(path: string): Promise<T> =>
    requestJson<T>(resolveBasePathUrl(basePath, path)),

  postJson: <T,>(path: string, body?: unknown): Promise<T> =>
    requestJson<T>(resolveBasePathUrl(basePath, path), {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
});

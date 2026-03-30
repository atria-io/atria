interface AuthProviderActionsProps {
  mode: "login" | "create";
}

const OAUTH_REDIRECT_DELAY_MS = 220;

const readSafeNextPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  return next && next.startsWith("/") ? next : "/";
};

const buildProviderStartUrl = (provider: "google" | "github", mode: "login" | "create"): string => {
  const params = new URLSearchParams();
  params.set("mode", mode);
  const nextPath = readSafeNextPath();
  if (nextPath !== "/") {
    params.set("next", nextPath);
  }
  return `/api/auth/start/${provider}?${params.toString()}`;
};

const startOAuthRedirect = (provider: "google" | "github", mode: "login" | "create"): void => {
  const target = buildProviderStartUrl(provider, mode);
  window.setTimeout(() => {
    window.location.href = target;
  }, OAUTH_REDIRECT_DELAY_MS);
};

export const AuthProviderActions = ({ mode }: AuthProviderActionsProps) => {
  return (
    <>
      <div className="auth-card__actions">
        <button
          type="button"
          className="auth-provider-button"
          onClick={() => startOAuthRedirect("google", mode)}
        >
          <span className="auth-provider-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path
                fill="currentColor"
                d="M21.8 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.5a4.7 4.7 0 0 1-2.04 3.08v2.55h3.3c1.93-1.78 3.04-4.4 3.04-7.56Z"
              />
              <path
                fill="currentColor"
                d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.3-2.55c-.92.61-2.1.98-3.31.98-2.55 0-4.7-1.72-5.47-4.03H3.12v2.64A10 10 0 0 0 12 22Z"
              />
              <path
                fill="currentColor"
                d="M6.53 13.96A6.02 6.02 0 0 1 6.2 12c0-.68.12-1.34.33-1.96V7.4H3.12A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.12 4.56l3.41-2.6Z"
              />
              <path
                fill="currentColor"
                d="M12 5.98c1.47 0 2.78.51 3.81 1.5l2.86-2.86C16.95 3 14.7 2 12 2a10 10 0 0 0-8.88 5.4l3.41 2.64C7.3 7.7 9.45 5.98 12 5.98Z"
              />
            </svg>
          </span>
          <span className="auth-provider-button__label">Continue with Google</span>
        </button>
        <button
          type="button"
          className="auth-provider-button"
          onClick={() => startOAuthRedirect("github", mode)}
        >
          <span className="auth-provider-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6A4.7 4.7 0 0 1 6.5 9a4.4 4.4 0 0 1 .1-3.2s1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.4 4.4 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
            </svg>
          </span>
          <span className="auth-provider-button__label">Continue with GitHub</span>
        </button>
      </div>

      <div className="auth-card__divider">
        <span className="auth-card__divider-text">or</span>
      </div>
    </>
  );
};

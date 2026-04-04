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
            <svg viewBox="0 0 16 16"  width="16" height="16" fill="none">
              <path fill="currentColor" d="M3.45,8c0-.5.08-1.01.24-1.48L1,4.45C-.09,6.69-.09,9.31,1,11.54l2.69-2.06c-.16-.48-.24-.98-.24-1.48Z"/>
              <path fill="currentColor" d="M8.18,3.27c1.07,0,2.12.37,2.95,1.06l2.33-2.33C10.14-.93,5.08-.6,2.16,2.72c-.46.52-.85,1.11-1.16,1.73l2.69,2.06c.64-1.94,2.45-3.24,4.49-3.24Z"/>
              <path fill="currentColor" d="M8.18,12.73c-2.04,0-3.85-1.31-4.49-3.25l-2.69,2.06c1.34,2.74,4.13,4.47,7.18,4.46,1.93.02,3.79-.7,5.21-1.99l-2.55-1.98c-.8.48-1.73.72-2.67.7ZM3.69,9.48l-2.69,2.06,2.69-2.06h0Z"/>
              <path fill="currentColor" d="M15.64,6.54h-7.46v3.09h4.29c-.19.99-.78,1.86-1.63,2.39l2.55,1.98c1.48-1.37,2.43-3.4,2.43-6.01,0-.49-.07-.98-.18-1.46Z"/>
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
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="currentColor" d="M14.93,4.18c-.7-1.21-1.7-2.21-2.91-2.91C10.79.55,9.45.2,8,.2s-2.79.36-4.02,1.07c-1.21.7-2.21,1.7-2.91,2.91-.72,1.23-1.07,2.57-1.07,4.02,0,1.74.51,3.31,1.53,4.7,1.02,1.39,2.33,2.36,3.94,2.89.19.03.33.01.42-.07.09-.08.14-.19.13-.31,0-.02,0-.21,0-.56,0-.35,0-.66,0-.93l-.24.04c-.19.03-.38.04-.58.04-.24,0-.48-.03-.72-.07-.25-.05-.49-.15-.7-.31-.21-.16-.37-.39-.46-.64l-.1-.24c-.09-.19-.2-.37-.33-.53-.15-.19-.3-.33-.45-.4l-.07-.05s-.1-.08-.14-.13c-.04-.04-.07-.09-.09-.15-.02-.05,0-.09.05-.12.06-.03.16-.05.3-.05l.21.03c.14.03.31.11.52.25.21.14.38.33.51.54.16.28.35.5.58.65.23.15.45.22.68.22.2,0,.4-.01.59-.05.16-.03.32-.09.47-.16.06-.47.23-.82.51-1.07-.36-.04-.72-.1-1.07-.19-.34-.09-.67-.23-.98-.41-.32-.18-.61-.41-.84-.7-.22-.28-.4-.64-.55-1.09-.14-.45-.21-.97-.21-1.56,0-.84.27-1.56.82-2.15-.26-.63-.23-1.34.07-2.12.2-.06.5-.02.9.14.4.16.69.29.87.4.18.11.33.2.44.28,1.31-.36,2.69-.36,4,0l.4-.25c.3-.18.62-.34.96-.46.37-.14.65-.18.84-.11.31.78.34,1.49.08,2.12.55.59.82,1.31.82,2.15,0,.59-.07,1.11-.21,1.57-.14.46-.33.82-.55,1.09-.24.28-.52.52-.84.69-.31.18-.64.31-.98.41-.35.09-.71.15-1.07.18.36.31.54.81.54,1.48v2.2c0,.12.04.23.13.31.09.08.22.11.41.07,1.61-.54,2.93-1.5,3.94-2.89,1.02-1.39,1.53-2.96,1.53-4.7,0-1.45-.36-2.79-1.07-4.01Z"/>
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

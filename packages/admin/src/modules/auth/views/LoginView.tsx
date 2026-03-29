import { useState, type FormEvent } from "react";

export const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const response = await fetch("/admin/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 204) {
      window.location.reload();
    }
  };

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">
            <span>Login</span>
          </h1>
          <div className="auth-card__header-text">
            <span>Access your workspace</span>
          </div>
        </div>

        <div className="auth-card__content">
          <div className="auth-card__actions">
            <a className="auth-provider-button" href="/auth/google">
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
            </a>
            <a className="auth-provider-button" href="/auth/github">
              <span className="auth-provider-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6A4.7 4.7 0 0 1 6.5 9a4.4 4.4 0 0 1 .1-3.2s1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.4 4.4 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
                </svg>
              </span>
              <span className="auth-provider-button__label">Continue with GitHub</span>
            </a>
          </div>

          <div className="auth-card__divider">
            <span className="auth-card__divider-text">or</span>
          </div>

          <form onSubmit={(event) => void handleLogin(event)}>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>

        <div className="auth-card__footer">
          <span>Use your owner account credentials</span>
        </div>
      </div>
    </section>
  );
};

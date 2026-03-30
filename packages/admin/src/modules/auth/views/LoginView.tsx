import { useEffect, useState, type FormEvent } from "react";
import { AuthProviderActions } from "./AuthProviderActions.js";

const LOGIN_ERROR_MESSAGE = "Could not complete browser sign-in. Please try again.";

const readCookie = (key: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${key}=`;
  for (const chunk of document.cookie.split(";")) {
    const value = chunk.trim();
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }

  return null;
};

const clearCookie = (key: string): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${key}=; Path=/; Max-Age=0`;
};

export const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const signal = readCookie("atria_login_error");
    if (signal === "oauth_failed") {
      setErrorMessage(LOGIN_ERROR_MESSAGE);
      clearCookie("atria_login_error");
    }
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

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
      return;
    }

    setErrorMessage(LOGIN_ERROR_MESSAGE);
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
          {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}

          <AuthProviderActions mode="login" />

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

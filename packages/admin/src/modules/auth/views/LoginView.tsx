import { useState, type FormEvent } from "react";
import { AuthProviderActions } from "./AuthProviderActions.js";

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

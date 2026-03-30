import { useState, type FormEvent } from "react";
import { AuthProviderActions } from "./AuthProviderActions.js";

export const CreateOwnerView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateOwner = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const response = await fetch("/auth/create-owner", {
      method: "POST",
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
            <span>Create owner</span>
          </h1>
          <div className="auth-card__header-text">
            <span>Create the first user</span>
          </div>
        </div>

        <div className="auth-card__content">
          <AuthProviderActions mode="create" />

          <form onSubmit={(event) => void handleCreateOwner(event)}>
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
            <button type="submit">Create</button>
          </form>
        </div>

        <div className="auth-card__footer">
          <span>This account will manage the workspace</span>
        </div>
      </div>
    </section>
  );
};

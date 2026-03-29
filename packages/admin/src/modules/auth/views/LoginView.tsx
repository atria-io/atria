const handleLogin = async (): Promise<void> => {
  await fetch("/admin/login", { method: "POST", credentials: "include" });
  window.location.reload();
};

export const LoginView = () => (
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
        <button type="button" onClick={() => void handleLogin()}>
          Login
        </button>
      </div>

      <div className="auth-card__footer">
        <span>Use your owner account credentials</span>
      </div>
    </div>
  </section>
);

export const SetupView = () => {
  const handleSetup = async (): Promise<void> => {
    const response = await fetch("/admin/setup", { method: "POST" });
    if (response.status === 204) {
      window.location.reload();
    }
  };

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">
            <span>Setup</span>
          </h1>
          <div className="auth-card__header-text">
            <span>Initialize the workspace</span>
          </div>
        </div>

        <div className="auth-card__content">
          <button type="button" onClick={() => void handleSetup()}>
            Continue
          </button>
        </div>
      </div>
    </section>
  );
};

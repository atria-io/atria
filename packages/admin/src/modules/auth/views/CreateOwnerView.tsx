export const CreateOwnerView = () => (
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
        <button type="button">Create</button>
      </div>

      <div className="auth-card__footer">
        <span>This account will manage the workspace</span>
      </div>
    </div>
  </section>
);

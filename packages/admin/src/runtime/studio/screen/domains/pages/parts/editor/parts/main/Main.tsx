interface MainProps {
  creating: boolean;
}

export function Main({ creating }: MainProps) {
  if (!creating) {
    return <div className="card-screen"><div className="editor-main" /></div>;
  }

  return (
    <div className="card-screen">
      <div className="editor-main">
        <form className="editor-create-form">
          <div className="field">
            <label className="field__label" htmlFor="page-title">
              Title
            </label>
            <input
              id="page-title"
              name="title"
              type="text"
              className="input input--sm input--full input--interactive"
              placeholder="Page title"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditorForm() {
  return (
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
  );
}

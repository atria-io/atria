import { setEditorTitle, useEditorState } from "../../../services/editorState.js";

export function EditorFormTitle() {
  const { title } = useEditorState();

  return (
    <div className="field">
      <label className="field__label" htmlFor="page-title">
        Title
      </label>
      <input
        id="page-title"
        name="title"
        type="text"
        value={title}
        onChange={(event) => setEditorTitle(event.target.value)}
        className="input input--sm input--full input--interactive"
        placeholder="Page title"
      />
    </div>
  );
}

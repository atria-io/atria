import { setEditorSlug, useEditorState } from "../../../services/editorState.js";

export function EditorFormSlug() {
  const { slug } = useEditorState();

  return (
    <div className="field">
      <label className="field__label" htmlFor="page-slug">
        Slug
      </label>
      <input
        id="page-slug"
        name="slug"
        type="text"
        value={slug}
        onChange={(event) => setEditorSlug(event.target.value)}
        className="input input--sm input--full input--interactive"
        placeholder="page-slug"
      />
    </div>
  );
}

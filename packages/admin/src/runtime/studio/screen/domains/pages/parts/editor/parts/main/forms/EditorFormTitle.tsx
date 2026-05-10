import { lockEditorAutoSlug, setEditorTitle, useEditorState } from "../../../services/editorState.js";

export function EditorFormTitle() {
  const { title } = useEditorState();

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label field--label-sm" htmlFor="page-title">
          Title
        </label>
        <input
          id="page-title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setEditorTitle(event.target.value)}
          onBlur={lockEditorAutoSlug}
          className="input input--sm input--full input--interactive"
          placeholder="Page title"
        />
      </div>
    </div>
  );
}

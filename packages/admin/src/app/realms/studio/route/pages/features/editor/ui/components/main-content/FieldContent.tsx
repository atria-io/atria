import { setContent, useState } from "../../../model/editor.state.js";

export function EditorContentFormContent() {
  const { content } = useState();

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label field--label-sm" htmlFor="page-content">
          Content
        </label>
        <textarea
          id="page-content"
          name="content"
          rows={14}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="textarea textarea--full textarea--interactive"
          placeholder="Page content"
        />
      </div>
    </div>
  );
}

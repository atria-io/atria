import { applySlugFromTitle, setTitle, useState } from "../../../model/editor.state.js";

export function EditorContentFormTitle() {
  const { title } = useState();

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
          onChange={(event) => setTitle(event.target.value)}
          onBlur={applySlugFromTitle}
          className="input input--sm input--full input--interactive"
          placeholder="Page title"
        />
      </div>
    </div>
  );
}

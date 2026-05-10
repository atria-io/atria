export function EditorFormContent() {
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
          className="textarea textarea--full textarea--interactive"
          placeholder="Page content"
        />
      </div>
    </div>
  );
}

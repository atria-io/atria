import { setEditorSlug, useEditorState } from "../../../services/editorState.js";
import { getFrontendUrl } from "@/system/config/runtimeConfig.js";
import { Info } from "lucide-react";

export function EditorFormSlug() {
  const { slug, drafts, currentUuid } = useEditorState();
  const frontendUrl = getFrontendUrl().replace(/\/+$/, "");
  const hasDuplicateSlug =
    slug.trim() !== "" &&
    drafts.some((item) => item.slug === slug && item.uuid !== currentUuid);

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label field--label-sm" htmlFor="page-slug">
          Slug
        </label>

        <div className={`pages-editor__slug-wrap ${hasDuplicateSlug ? "pages-editor__slug-wrap--error" : ""}`}>
          <div className="pages-editor__slug-prefix">
            <div className="pages-editor__slug-prefix-inner">
              <span className="pages-editor__slug-prefix-text">
                {`${frontendUrl}/`}
              </span>
            </div>
          </div>
          <input
            id="page-slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(event) => setEditorSlug(event.target.value)}
            className="input pages-editor__slug-input"
            placeholder="page-slug"
          />
          {hasDuplicateSlug ? (
            <div className="icon pages-editor__slug-error" data-tooltip="This slug already exists.">
              <Info size={14} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

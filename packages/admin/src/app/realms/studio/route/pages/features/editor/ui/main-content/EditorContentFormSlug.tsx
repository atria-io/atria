import * as Icon from "lucide-react";
import { setSlug, useState } from "../../model/editor.state.js";
import { getFrontendUrl } from "@/app/system/config/app.config.js";

export function EditorContentFormSlug() {
  const { slug, drafts, currentUuid } = useState();
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
            onChange={(event) => setSlug(event.target.value)}
            className={`input input--sm input--full input--interactive pages-editor__slug-input${hasDuplicateSlug ? ' input--danger' : ''}`}
            placeholder="slug"
          />
          {hasDuplicateSlug ? (
            <div className="icon pages-editor__slug-error" data-tooltip="This slug already exists.">
              <Icon.Info size={14} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

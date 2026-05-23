import * as Icon from "lucide-react";
import { Button, Input } from "@atria/ui";
import { setSlug, useState } from "../../deps.js";
import { getFrontendUrl } from "@/app/system/config/app.config.js";

function FieldSlug() {
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
              <span className="pages-editor__slug-prefix-text" data-tooltip={`${frontendUrl}/`}>
                <span>{`${frontendUrl}/`}</span>
              </span>
            </div>
          </div>

          <Input
            id="page-slug"
            type="text"
            name="slug"
            size="sm"
            full
            interactive
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className={`pages-editor__slug-input${hasDuplicateSlug ? " input--danger" : ""}`}
            placeholder="slug"
          />
          {hasDuplicateSlug ? (
            <div className="icon pages-editor__slug-error" data-tooltip="This slug already exists.">
              <Icon.Info size={14} />
            </div>
          ) : null}

        </div>
        {/*<Button
          type="button"
          size="sm"
          align="start"
          variant={["ghost", "overlay"]}
          label="Add parent"
        />*/}
      </div>
    </div>
  );
}

export { FieldSlug };

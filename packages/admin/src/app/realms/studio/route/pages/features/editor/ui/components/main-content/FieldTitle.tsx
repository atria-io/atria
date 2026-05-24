import { Input } from "@atria/ui";
import { parse } from "../../deps.js";

interface FieldTitleProps {
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
}

function FieldTitle({ title, onTitleChange, onTitleBlur }: FieldTitleProps) {
  const route = parse(window.location.pathname);

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label field--label-sm" htmlFor="page-title">
          Title
        </label>
        <Input
          id="page-title"
          type="text"
          name="title"
          size="sm"
          full
          interactive
          autoFocus={route.mode === "create"}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onTitleBlur}
          placeholder="Page title"
        />
      </div>
    </div>
  );
}

export { FieldTitle };

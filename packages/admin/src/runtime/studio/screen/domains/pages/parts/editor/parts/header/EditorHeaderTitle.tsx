interface EditorHeaderTitleProps {
  title: string;
}

export function EditorHeaderTitle({ title }: EditorHeaderTitleProps) {
  return (
    <div className="pages-editor__header-title">
      <div>{title.trim() ? `${title}` : "Edit Page"}</div>
    </div>
  );
}

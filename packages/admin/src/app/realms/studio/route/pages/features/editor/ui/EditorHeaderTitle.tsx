interface EditorHeaderTitleProps {
  title: string;
}

export function EditorHeaderTitle({ title }: EditorHeaderTitleProps) {
  return (
    <div className="pages-editor__title">
      <div>{title.trim() ? `${title}` : "Untitled"}</div>
    </div>
  );
}

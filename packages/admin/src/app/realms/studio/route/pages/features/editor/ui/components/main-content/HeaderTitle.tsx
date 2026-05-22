interface EditorContentTitleProps {
  title: string;
}

export function EditorContentTitle({ title }: EditorContentTitleProps) {
  return (
    <div className="pages-editor__title">
      <div>{title.trim() ? `${title}` : "Untitled"}</div>
    </div>
  );
}

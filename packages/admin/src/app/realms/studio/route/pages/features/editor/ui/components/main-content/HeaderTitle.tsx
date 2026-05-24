interface EditorContentTitleProps {
  title: string;
}

function HeaderTitle({ title }: EditorContentTitleProps) {
  const truncatedTitle = title.length > 48
    ? `${title.slice(0, 48)}…`
    : title;
  return (
    <div className="pages-editor__title">
      <span title={title}>
        {title.trim() ? `${truncatedTitle}` : "Untitled"}
      </span>
    </div>
  );
}

export { HeaderTitle };

interface EditorContentTitleProps {
  title: string;
}

function HeaderTitle({ title }: EditorContentTitleProps) {
  return (
    <div className="pages-editor__title">
      <div>{title.trim() ? `${title}` : "Untitled"}</div>
    </div>
  );
}

export { HeaderTitle };

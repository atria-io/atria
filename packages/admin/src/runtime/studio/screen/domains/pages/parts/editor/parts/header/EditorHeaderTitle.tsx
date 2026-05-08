interface EditorHeaderTitleProps {
  creating: boolean;
}

export function EditorHeaderTitle({ creating }: EditorHeaderTitleProps) {
  return <div>{creating ? "Edit Page" : "No properties"}</div>;
}

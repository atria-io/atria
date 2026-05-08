import type { HeaderProps } from "./types.js";

export function Header({ creating }: HeaderProps) {
  return (
    <div className="card-screen">
      <div className="editor-header">
        <div>{creating ? "Editor" : "No properties"}</div>
      </div>
    </div>
  );
}

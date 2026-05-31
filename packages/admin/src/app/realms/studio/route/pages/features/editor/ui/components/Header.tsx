import { Actions } from "./header/Actions.js";
import { Leading } from "./header/Leading.js";
import * as deps from "../deps.js";

interface HeaderProps {
  onViewChange: (view: deps.EditorView) => void;
  view: deps.EditorView;
}

function Header({ onViewChange, view }: HeaderProps) {
  return (
    <>
      <div className="card-strip">
        <Leading view={view} onViewChange={onViewChange} />
        <Actions />
      </div>
    </>
  );
}

export { Header };

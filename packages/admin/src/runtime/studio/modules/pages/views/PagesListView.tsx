import type { PageListItem } from "../pages.types.js";

interface PagesListViewProps {
  items: PageListItem[];
  selectedUuid: string | null;
  loading: boolean;
  onOpenCreate: () => void;
  onOpenPage: (uuid: string) => void;
}

export const PagesListView = ({
  items,
  selectedUuid,
  loading,
  onOpenCreate,
  onOpenPage,
}: PagesListViewProps) => {
  return (
    <div className="card-screen">
      <div className="pages-panel__head">
        <div>Pages</div>
        {/*<button className="pages-action" onClick={onOpenCreate} type="button">
          New
        </button>
      </div>
      {loading ? <div className="pages-empty">Loading...</div> : null}
      {!loading && items.length === 0 ? <div className="pages-empty">No pages</div> : null}
      {!loading
        ? items.map((item) => (
            <button
              className="pages-list__item"
              data-active={selectedUuid === item.uuid}
              draggable
              key={item.uuid}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-page-uuid", item.uuid);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onOpenPage(item.uuid)}
              type="button">
              <span>{item.title}</span>
              <span className="pages-list__meta">{item.status}</span>
            </button>
          ))
        : null}*/}
        </div>
    </div>
  );
};

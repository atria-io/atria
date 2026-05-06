import { usePagesState } from "./pages.state.js";
import { FoldersView } from "./views/FoldersView.js";
import { PagePropertiesView } from "./views/PagePropertiesView.js";
import { PagesListView } from "./views/PagesListView.js";

export const PagesView = () => {
  const state = usePagesState();

  return (
    <div className="studio-screen__pages">
      <div className="pages-layout">
        <div className="card-column" data-zone="pages:a">
          <div className="card-column__stack" data-group="selector">
            <div className="card-column__item" data-type="folders">
              <FoldersView
                folders={state.folders}
                onDropPageToFolder={state.assignFolder}
                onSelectFolder={state.changeFolderFilter}
                selectedFolderId={state.selectedFolderId}
              />
            </div>
            <div className="card-column__item" data-type="navigations">
              <div className="card-screen">
                <div className="pages-panel__title">Routes</div>
                {state.items
                  .filter((item) => item.publishedSlug !== null)
                  .map((item) => (
                    <div className="pages-list__item" key={`route:${item.uuid}`}>
                      <span>{item.title}</span>
                      <span className="pages-list__meta">/{item.publishedSlug}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <div className="card-column" data-zone="pages:b">
          <div className="card-column__item" data-type="pages">
            <PagesListView
              items={state.items}
              loading={state.loading}
              onOpenCreate={state.openCreate}
              onOpenPage={state.openPage}
              selectedUuid={state.route.uuid}
            />
          </div>
        </div>
        <div className="card-column" data-zone="pages:c">
          <div className="card-column__item" data-type="properties">
            <PagePropertiesView
              error={state.error}
              isReadOnlyVersion={Boolean(state.route.versionId)}
              loading={state.loading}
              mode={state.route.mode}
              onCreateDraft={state.createDraft}
              onDelete={state.remove}
              onOpenVersion={(versionId) => {
                if (!state.route.uuid) {
                  return;
                }
                window.history.pushState({}, "", `/pages;${state.route.uuid}?version=${encodeURIComponent(versionId)}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              onAssignFolder={async (folderId) => {
                if (!state.route.uuid) {
                  return;
                }
                await state.assignFolder(state.route.uuid, folderId);
              }}
              onPublish={state.publish}
              onSaveDraft={state.saveDraft}
              onUnpublish={state.unpublish}
              page={state.selectedPage}
              versions={state.versions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

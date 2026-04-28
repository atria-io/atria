export const PagesView = () => {
  return (
    <>
      {/*<div className="studio-screen__pages">
        <div className="card-screen">Pages</div>
        <div className="card-screen">Editor</div>
        <div className="card-screen">No properties</div>
      </div>*/}
      <div className="studio-screen__pages">
        <div className="pages-layout">
          <div className="card-column" data-zone="pages:a">
            <div className="card-column__stack" data-group="selector">
              <div className="card-column__item" data-type="folders">
                <div className="card-screen">Folders</div>
              </div>
              <div className="card-column__item" data-type="navigations">
                <div className="card-screen">Navigations</div>
              </div>
            </div>
          </div>
          <div className="card-column" data-zone="pages:b">
            <div className="card-column__item" data-type="pages">
              <div className="card-screen">Pages</div>
            </div>
          </div>
          <div className="card-column" data-zone="pages:c">
            <div className="card-column__item" data-type="properties">
              <div className="card-screen">No propertiess</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

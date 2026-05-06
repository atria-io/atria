import * as db from "@atria/db";

export const getPageByUuid = db.pages.getPageByUuid;
export const updatePageDraft = db.pages.updatePageDraft;
export const deletePage = db.pages.deletePage;
export const publishPage = db.pages.publishPage;
export const unpublishPage = db.pages.unpublishPage;
export const listPageVersions = db.pages.listPageVersions;
export const getPageVersion = db.pages.getPageVersion;

import * as db from "@atria/db";

export const getOwnerState = db.auth.getOwnerState;
export const createOwner = db.auth.createOwner;
export const createSession = db.auth.createSession;

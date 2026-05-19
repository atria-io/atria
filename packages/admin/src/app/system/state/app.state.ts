import type { AppState as Auth } from "../../realms/auth/model/auth.types.js";
import type { AppState as Critical } from "../../realms/critical/model/critical.types.js";
import type { AppState as Studio } from "../../realms/studio/model/studio.types.js";

export type AppState = Critical | Auth | Studio;

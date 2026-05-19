import type { AppState as AuthAppState } from "../runtime/domains/auth/types.js";
import type { AppState as CriticalAppState } from "../runtime/domains/critical/types.js";
import type { AppState as StudioAppState } from "../runtime/domains/studio/types.js";

export type AppState = CriticalAppState | AuthAppState | StudioAppState;

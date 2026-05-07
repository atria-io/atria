import type { AppState as AuthAppState } from "../runtime/auth/types.js";
import type { AppState as CriticalAppState } from "../runtime/critical/types.js";
import type { AppState as StudioAppState } from "../runtime/studio/types.js";

export type AppState = CriticalAppState | AuthAppState | StudioAppState;

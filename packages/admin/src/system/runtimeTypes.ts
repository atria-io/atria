import type { AuthAppState } from "../runtime/auth/AuthTypes.js";
import type { CriticalAppState } from "../runtime/critical/CriticalTypes.js";
import type { StudioAppState } from "../runtime/studio/StudioTypes.js";


export type AppState = CriticalAppState | AuthAppState | StudioAppState;

import type { AuthAppState } from "../runtime/auth/Auth.types.js";
import type { CriticalAppState } from "../runtime/critical/Critical.types.js";
import type { StudioAppState } from "../runtime/studio/Studio.types.js";

export type AppState = CriticalAppState | AuthAppState | StudioAppState;

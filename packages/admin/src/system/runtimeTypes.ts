import type { AuthAppState, AuthState } from "../runtime/auth/AuthTypes.js";
import type { CriticalAppState, CriticalState } from "../runtime/critical/CriticalTypes.js";
import type { AppUser, StudioAppState, StudioState } from "../runtime/studio/StudioTypes.js";

export type { AuthState } from "../runtime/auth/AuthTypes.js";
export type { CriticalState } from "../runtime/critical/CriticalTypes.js";
export type { StudioState } from "../runtime/studio/StudioTypes.js";
export type { AppUser } from "../runtime/studio/StudioTypes.js";

export type AppState = CriticalAppState | AuthAppState | StudioAppState;

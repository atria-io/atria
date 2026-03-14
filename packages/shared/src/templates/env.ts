import { DEFAULT_AUTH_BROKER_ORIGIN } from "../auth.js";

const ENV_EXAMPLE_LINES = [
  "# Preferred",
  "ATRIA_DATABASE_URL=",
  "",
  "# Compatibility",
  "# DATABASE_URL=",
  "",
  "# Central OAuth broker origin (recommended)",
  `ATRIA_AUTH_BROKER_ORIGIN=${DEFAULT_AUTH_BROKER_ORIGIN}`,
  "",
  "# Self-host OAuth fallback (optional)",
  "# ATRIA_AUTH_GOOGLE_CLIENT_ID=",
  "# ATRIA_AUTH_GOOGLE_CLIENT_SECRET=",
  "# ATRIA_AUTH_GITHUB_CLIENT_ID=",
  "# ATRIA_AUTH_GITHUB_CLIENT_SECRET=",
  "",
  "# Optional Studio origin override (default: http://studio.localhost:3333)",
  "# ATRIA_AUTH_ORIGIN=",
  ""
] as const;

export const createEnvExampleFile = (): string => ENV_EXAMPLE_LINES.join("\n");

# @atria/shared

Shared constants, templates, and types used by atria packages.

## Install

```bash
npm install @atria/shared
```

## Main exports

```ts
import {
  ATRIA_CONFIG_FILE,
  ATRIA_INTERNAL_DIR,
  ATRIA_RUNTIME_DIR,
  ATRIA_DATA_DIR,
  ATRIA_DATABASE_FILE,
  PRODUCTION_DIR,
  PUBLIC_OUTPUT_DIR,
  STUDIO_DIR,
  STUDIO_CONTENT_DIR,
  STUDIO_THEME_DIR,
  DEFAULT_ADMIN_PORT,
  DEFAULT_PUBLIC_PORT,
  DEFAULT_DEV_PORT,
  resolveRuntimeDir,
  DEFAULT_AUTH_BROKER_ORIGIN,
  parseAuthMethod,
  createEnvExampleFile,
  runtimeIndexHtml,
  runtimeAppJs,
  READY_EVENT_NAME,
  COLOR_SCHEME_STORAGE_KEY,
  type AtriaConfig,
  type AuthMethod
} from "@atria/shared";
```

## Notes

- `createEnvExampleFile()` is shared by both `create-atria` and `@atria/cli`.
- `runtimeIndexHtml` and `runtimeAppJs` are the canonical runtime templates for `.atria/runtime`.

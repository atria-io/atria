# @atria/shared

Shared types, constants, and path helpers used across atria packages.

## Install

```bash
npm install @atria/shared
```

## Usage

```ts
import {
  ATRIA_CONFIG_FILE,
  ATRIA_RUNTIME_DIR,
  PRODUCTION_DIR,
  PUBLIC_OUTPUT_DIR,
  STUDIO_CONTENT_DIR,
  STUDIO_THEME_DIR,
  DEFAULT_DEV_PORT,
  resolveRuntimeDir,
  type AtriaConfig
} from "@atria/shared";
```

## Exports

- `ATRIA_CONFIG_FILE` (`atria.config.json`)
- `ATRIA_INTERNAL_DIR` (`.atria`)
- `ATRIA_RUNTIME_DIR` (`.atria/runtime`)
- `PRODUCTION_DIR` (`production`)
- `PUBLIC_OUTPUT_DIR` (`production/public`)
- `STUDIO_DIR` (`production/studio`)
- `STUDIO_CONTENT_DIR` (`production/studio/content`)
- `STUDIO_THEME_DIR` (`production/studio/theme`)
- `DEFAULT_DEV_PORT` (`3333`)
- `resolveRuntimeDir(projectRoot)`
- `AtriaConfig` type

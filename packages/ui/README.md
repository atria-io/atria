# @atria/ui

Shared UI primitives used by `@atria/admin`.

This package contains reusable React components and state hooks extracted from admin runtime UI.

## Scope

- Provide reusable UI building blocks (`tsx`) and UI state hooks (`ts`)
- Keep implementation framework-local to Atria admin needs
- Do not include app/domain business logic

## Package Layout

```
packages/ui/
  src/
    css/          # component styles
    ts/           # non-visual UI hooks/state helpers
    tsx/          # React UI primitives
    index.ts      # aggregate exports
  dist/           # build output
```

## Public Imports

Use explicit subpath imports:

```ts
import { Button } from "@atria/ui/tsx/button.js";
import { usePopover } from "@atria/ui/ts/popover.js";
```

## Build

From repo root:

```bash
corepack pnpm --filter @atria/ui build
```

The package compiles TypeScript from `src/` to `dist/`.

## Development Notes

- Keep source files only in `src/` (`.ts`, `.tsx`, `.css`)
- Never commit generated `.js` / `.d.ts` inside `src/`
- Generated artifacts belong in `dist/`
- If adding new primitives/hooks, expose them through package `exports` when needed

## Integration Contract

`@atria/admin` consumes this package as a workspace dependency:

- Dependency: `"@atria/ui": "workspace:*"`
- TypeScript path mapping resolves `@atria/ui/*` to `../ui/dist/*` during admin build
- Live watch builds `@atria/ui` before `@atria/admin`

Current workspace constraint:

- `@atria/ui` does not depend on `@atria/admin`.
- `react` is declared as a `peerDependency` for consumers.

## Non-Goals

- Design system governance
- Cross-repo generic component library
- Runtime asset pipeline ownership outside UI primitives

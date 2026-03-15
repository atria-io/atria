# @atria/admin

Modular React admin runtime for atria.

## Runtime entry

- `@atria/admin/app.js` - browser bundle mounted by `.atria/runtime/app.js`.

## Source layout

- `src/app/App.tsx` - app orchestration entry
- `src/app/kernel/bootstrap/main.tsx` - React mount bootstrap
- `src/app/kernel/routing/routes.ts` - route resolution
- `src/app/kernel/styling/style-manager.ts` - dynamic style loading
- `src/app/kernel/shell/StudioShell.tsx` - shared app shell
- `src/app/modules` - business modules (`auth`, `dashboard`, ...)
- `src/app/styles` - global style tokens (`tokens`, `scheme`, `globals`)
- `src/state` - HTTP client and state utilities
- `src/i18n` - translation client + locale dictionaries

## i18n API

The package expects the dev server to expose:

- `GET /api/admin/i18n`
- `GET /api/admin/i18n/:locale`

Locale dictionaries are JSON files copied to `dist/locales` at build time.

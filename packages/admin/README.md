# @atria/admin

Modular React admin runtime for atria.

## Runtime entry

- `@atria/admin/app.js` - browser bundle mounted by `.atria/runtime/app.js`.

## Source layout

- `src/app` - bootstrap, shell, routes
- `src/features` - screen and feature modules
- `src/state` - HTTP client and state utilities
- `src/i18n` - translation client + locale dictionaries
- `src/styles` - global `:root` and per-feature styles

## i18n API

The package expects the dev server to expose:

- `GET /api/admin/i18n`
- `GET /api/admin/i18n/:locale`

Locale dictionaries are JSON files copied to `dist/locales` at build time.

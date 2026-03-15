# @atria/admin

React admin runtime for atria.

## Runtime entry

- `@atria/admin/app.js`: browser bundle mounted by `.atria/runtime/app.js`.

## Source structure

- `src/app/App.tsx`: main app orchestration.
- `src/app/kernel/runtime/main.tsx`: React mount entry.
- `src/app/kernel/Routes.ts`: route resolution (`/`, `/create`, `/setup`).
- `src/app/kernel/StyleManager.ts`: runtime CSS loading.
- `src/app/kernel/shell/StudioShell.tsx`: shared shell/layout.
- `src/app/modules/auth`: auth module (OAuth + e-mail/password forms).
- `src/app/modules/dashboard`: authenticated home module.
- `src/app/static/styles`: global styles (`tokens.css`, `scheme.css`, `globals.css`).
- `src/app/static/favicon.ico`: default Studio favicon.
- `src/i18n`: locale loader and dictionaries.
- `src/state`: API client utilities.

## Build output

- `dist/app.js`: bundled SPA runtime.
- `dist/styles/*`: global style assets.
- `dist/styles/modules/*.css`: module-level style assets.
- `dist/locales/*.json`: locale dictionaries.

## Expected server endpoints

- `GET /api/admin/i18n`
- `GET /api/admin/i18n/:locale`
- `GET /api/auth/providers`
- `GET /api/auth/session`
- `POST /api/auth/email/register`
- `POST /api/auth/email/login`
- `POST /api/auth/logout`

## Build

```bash
npm run build
```

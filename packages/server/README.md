# @atria/server

HTTP runtime server for atria development.

This package powers `atria dev` by serving `production/public/` for the public site and `.atria/runtime` for the back-office host.

## Install

```bash
npm install @atria/server @atria/shared @atria/db
```

## Usage

```ts
import { startDevServer } from "@atria/server";

const server = await startDevServer({
  projectRoot: process.cwd(),
  port: 3333
});

console.log(server.url);
// later:
await server.close();
```

## Behavior

- Serves `localhost` from `<projectRoot>/production/public`.
- Serves `studio.localhost` from `<projectRoot>/.atria/runtime`.
- Responds to `GET /api/health` with runtime diagnostics: `ok`, `status`, `site`, `publicOutputPublished`, `ownerSetupPending`, and `database` (driver/source/usesFallback/reachable/error).
- Exposes OAuth auth endpoints on `studio.localhost`:
  - `GET /api/auth/providers`
  - `GET /api/auth/start/:provider`
  - `GET /api/auth/callback/:provider`
  - `GET /api/auth/session`
  - `GET /api/auth/logout`
- Publish state is resolved live from `<projectRoot>/production/public/index.html` (no marker file required).
- Owner setup state is resolved from the database (`pending` while no owner user exists).
- If `production/public/index.html` is missing, `GET /` returns `503 Service Unavailable`.
- If `production/public/index.html` is missing, other public routes return `404 Not Found`.
- If `production/public/index.html` exists, missing public files/routes return `404` (serving `production/public/404.html` when present).
- Uses SPA-style `index.html` fallback only for `studio.localhost` non-file routes.
- Blocks path traversal attempts outside the configured public/admin roots.

## OAuth environment variables

- `ATRIA_AUTH_BROKER_ORIGIN` (recommended)
- `ATRIA_AUTH_GITHUB_CLIENT_ID`
- `ATRIA_AUTH_GITHUB_CLIENT_SECRET`
- `ATRIA_AUTH_GOOGLE_CLIENT_ID`
- `ATRIA_AUTH_GOOGLE_CLIENT_SECRET`
- `ATRIA_AUTH_ORIGIN` (optional, defaults to `http://studio.localhost:<port>`)

# @atria/server

HTTP runtime server used by `atria dev`.

## Install

```bash
npm install @atria/server
```

## Usage

```ts
import { startDevServer } from "@atria/server";

const server = await startDevServer({
  projectRoot: process.cwd(),
  port: 3333
});

console.log(server.publicUrl); // http://localhost:3333
console.log(server.adminUrl);  // http://studio.localhost:3333
```

## Host routing

- `localhost` -> serves `production/public`.
- `studio.localhost` -> serves Studio runtime.

## Admin asset routing

- `GET /static/*` serves assets from `@atria/admin/dist`.
- Legacy prefixes are kept for compatibility.

## Health and setup routes

- `GET /api/health`
- `GET /api/setup/status`

Health payload includes:

- `ok`, `status`, `site`
- `publicOutputPublished`
- `ownerSetupPending`
- `database` (`driver`, `source`, `usesFallback`, `reachable`, `error`)

## Auth routes

- `GET /api/auth/providers`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/auth/email/register`
- `POST /api/auth/email/login`
- `GET /api/auth/start/:provider`
- `GET /api/auth/callback/:provider`
- `GET /api/auth/broker/exchange`

## Auth redirect behavior

- When owner setup is pending, protected Studio routes redirect to `/create`.
- After owner exists, `/create` redirects to `/` (login flow).
- Unauthenticated access to protected Studio routes redirects to `/` with `next` query.

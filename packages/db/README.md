# @atria/db

Database layer for atria runtime/auth/pages state.

## Install

```bash
npm install @atria/db
```

## Responsibilities

- Resolve DB connection (`ATRIA_DATABASE_URL`, `DATABASE_URL`, fallback SQLite).
- Initialize SQLite database file.
- Initialize auth and pages schema.
- Store users, credentials, OAuth identities, sessions, pages, routes, versions, and workspaces.

## Public API

```ts
import {
  openDatabase,
  initializeDatabase,
  ensureAuthSchema,
  ensurePagesSchema
} from "@atria/db";
```

## Connection resolution order

1. `ATRIA_DATABASE_URL`
2. `DATABASE_URL`
3. local fallback: `./.atria/data/atria.db`

## Tables managed

- `users`
- `user_credentials`
- `identities`
- `sessions`
- `documents`
- `document_versions`
- `routes`
- `navigations`
- `workspaces`

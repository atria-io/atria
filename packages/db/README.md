# @atria/db

Database layer for atria runtime/auth state.

## Install

```bash
npm install @atria/db
```

## Responsibilities

- Resolve DB connection (`ATRIA_DATABASE_URL`, `DATABASE_URL`, fallback SQLite).
- Initialize schema for SQLite/PostgreSQL.
- Store owner setup metadata and preferred auth method.
- Store users, e-mail credentials, OAuth identities, and sessions.

## Public API

```ts
import {
  resolveDatabaseConnection,
  openAtriaDatabase,
  initializeProjectDatabase
} from "@atria/db";
```

## Connection resolution order

1. `ATRIA_DATABASE_URL`
2. `DATABASE_URL`
3. local fallback: `./.atria/data/atria.db`

## Tables managed by migrations

- `atria_meta`
- `atria_users`
- `atria_user_credentials`
- `atria_identities`
- `atria_sessions`

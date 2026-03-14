# @atria/db

Persistence layer for atria runtime and setup/auth state.

## Install

```bash
npm install @atria/db
```

## Usage

```ts
import { openAtriaDatabase, resolveDatabaseConnection } from "@atria/db";

const connection = resolveDatabaseConnection(process.cwd());
const db = openAtriaDatabase(process.cwd());

const setup = await db.getOwnerSetupState();
console.log(connection, setup);

await db.close();
```

## Environment resolution

Database connection resolution order:

1. `ATRIA_DATABASE_URL` (preferred)
2. `DATABASE_URL` (compatibility)
3. local fallback: `./.atria/data/atria.db`

Runtime supports SQLite and PostgreSQL.

# @atria/cli

CLI commands for atria, a document-first static CMS.

## Install

```bash
npm install -D @atria/cli
```

## Usage

```bash
npx atria --help
npx atria init my-project
npx atria dev my-project --port 3333
npx atria setup my-project
```

## Commands

- `atria init [project-directory] [--force]`
  Creates an atria project structure with `production/studio/`, `production/public/` (empty until publish), `.atria/runtime/`, and defers database setup to install-time setup.
- `atria dev [project-directory] [--port 3333]`
  Serves `production/public/` on `localhost`, `.atria/runtime` on `studio.localhost`, and exposes `/api/health` (`503 /` on public host until first publish).
- `atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--auth-method google|github|email] [--force]`
  Configures database + owner sign-in preference, and can launch OAuth setup in-browser. Use `--database-only` during install hooks or `--database-url` for PostgreSQL.

## Programmatic API

```ts
import { runCli } from "@atria/cli";

await runCli(process.argv);
```

## Notes

- During `dev`, the CLI checks npm for newer `@atria/cli` versions and prints an update hint.
- Setup completion is derived from database users (`pending` becomes `false` once the first owner is created).

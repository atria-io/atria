# @atria/cli

CLI for atria project bootstrap and development.

## Install

```bash
npm install -D @atria/cli
```

## Commands

```bash
atria init [project-directory] [--force]
atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--auth-method google|github|email] [--force]
atria dev [project-directory] [--admin-port 3333] [--public-port 4444]
```

## Behavior summary

- `init`: scaffolds project files (`production/studio`, `production/public`, `.atria/runtime`, `.env.example`).
- `setup`: configures database and owner auth preference.
- `setup --database-only`: prompts only database engine selection (used by install hooks).
- `dev`: runs two HTTP servers:
  - `localhost:3333` -> admin runtime (`.atria/runtime` + `@atria/admin` assets)
  - `localhost:4444` -> public output (`production/public`)

## Programmatic API

```ts
import { runCli } from "@atria/cli";

await runCli(process.argv);
```

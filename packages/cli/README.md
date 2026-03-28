# @atria/cli

Canonical command orchestration package for Atria.

## Scope

- command parsing and dispatch
- operational command orchestration (`dev`, `setup`, `build`)
- no admin runtime ownership
- no domain ownership (`db`, `core`, `server`, `admin`)

## Commands

```bash
atria dev [project-directory] [--admin-port 3333] [--public-port 4444]
atria setup [project-directory] [--database sqlite|postgres] [--database-url <postgres-url>] [--database-only] [--force]
atria build [project-directory] [--mode production|development]
```

## API

```ts
import { runCli } from "@atria/cli";

await runCli(process.argv);
```

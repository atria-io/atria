# atria monorepo

TypeScript monorepo for the atria ecosystem: project scaffolding, CLI, admin runtime, dev server, shared templates, and database layer.

## Packages

| Folder | npm package | Role |
| --- | --- | --- |
| `packages/admin` | `@atria/admin` | React admin runtime bundle served on `studio.localhost` |
| `packages/atria` | `atria` | Unscoped wrapper for the CLI (`atria` binary) |
| `packages/cli` | `@atria/cli` | Commands: `init`, `setup`, `dev` |
| `packages/core` | `@atria/core` | Core foundation package |
| `packages/create` | `create-atria` | Project scaffolder (`npm create atria@latest`) |
| `packages/db` | `@atria/db` | Database connection + auth persistence |
| `packages/server` | `@atria/server` | Local dev HTTP server (`localhost` + `studio.localhost`) |
| `packages/shared` | `@atria/shared` | Shared constants, templates, types, auth helpers |

## Runtime model

- `production/public` is the public site output.
- `production/studio` stores source content/theme.
- `.atria/runtime` is internal runtime space for Studio shell files.
- Admin runtime assets are loaded from installed packages in `node_modules` (not from `.atria` source code).

## Monorepo development

```bash
corepack pnpm install
corepack pnpm -r --filter "./packages/*" build
```

## Create a new project

Create in current folder:

```bash
npm create atria@latest
```

Create in a named folder:

```bash
npm create atria@latest -- my-project
cd my-project
npm run dev
```

Equivalent direct command:

```bash
npx create-atria my-project
```

## License

[MIT](./LICENSE)

# A document-first static CMS.

`atria` is a TypeScript monorepo for the first public release of the `@atria` ecosystem.

## Monorepo packages

| Package | npm name | Purpose |
| --- | --- | --- |
| CLI | `@atria/cli` | Developer commands: `init` and `dev` |
| Server | `@atria/server` | Local static runtime server used by `atria dev` |
| Shared | `@atria/shared` | Shared constants, paths, and config types |
| Create | `@atria/create` | Project scaffolder (`npm create @atria`) |
| Unscoped CLI | `atria` | Wrapper package for users who prefer unscoped install |
| Core | `@atria/core` | Foundation placeholder for compiler/build pipeline |
| Admin | `@atria/admin` | Foundation placeholder for admin SPA |
| DB | `@atria/db` | Foundation placeholder for persistence layer |

## Document-first model

- Content is source-controlled as files under `studio/content`.
- Theme assets live under `studio/theme`.
- Runtime assets are served from `.atria/runtime`.
- The architecture is designed for static output with a local back-office workflow.

## Runtime and Delivery Model

- `.atria/` is internal runtime space for the back-office/dev runtime.
- In npm-installed projects, the client app source is provided by package dependencies in `node_modules`.
- The final client-facing website is static output generated to `public/`.

## Local development

```bash
corepack pnpm install
corepack pnpm build
```

## Create a project

```bash
npm create @atria -- my-project
cd my-project
npm run dev
```

Alternative:

```bash
npx @atria/create my-project --skip-install
cd my-project
npm install
npm run dev
```

## CLI commands

```bash
atria init [project-directory] [--force]
atria dev [project-directory] [--port 3333]
```

Package publishing to npm is maintained by project maintainers.

## License

[MIT License](./LICENSE)

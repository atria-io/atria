<div align="center">
  <h1>atria monorepo</h1>
  <p><strong>Document-first CMS built by designers, for designers.</strong></p>

  <a href="https://www.npmjs.com/package/atria"><img alt="NPM version" src="https://img.shields.io/npm/v/atria.svg?style=for-the-badge&labelColor=000000"></a>
  <a href="https://www.npmjs.com/package/atria"><img alt="NPM downloads" src="https://img.shields.io/npm/dm/atria.svg?style=for-the-badge&labelColor=000000"></a>
  <a href="https://github.com/atria-io/atria/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/atria.svg?style=for-the-badge&labelColor=000000"></a>
  <img alt="Project status" src="https://img.shields.io/badge/status-experimental-orange.svg?style=for-the-badge&labelColor=000000">
</div>

## What is this repository?

This is the TypeScript monorepo for the Atria ecosystem.

Atria is a document-first CMS in active development, based on a custom grammar for structured content and editorial workflows.

## Packages

| Folder | npm package | Responsibility |
| --- | --- | --- |
| `packages/admin` | `@atria/admin` | Admin runtime UI |
| `packages/atria` | `atria` | Thin public wrapper for the CLI (`atria` binary) |
| `packages/cli` | `@atria/cli` | Command orchestration (`init`, `setup`, `dev`) |
| `packages/core` | `@atria/core` | Core foundation package |
| `packages/create` | `create-atria` | Project scaffolding (`npm create atria@latest`) |
| `packages/db` | `@atria/db` | Persistence and auth storage |
| `packages/server` | `@atria/server` | Routing and auth server layer |
| `packages/shared` | `@atria/shared` | Canonical shared primitives |

## Project status

Atria is experimental and evolves quickly.

- APIs and command behavior may change.
- Some features are still under development.

## Monorepo development

```bash
corepack pnpm install
corepack pnpm -r --filter "./packages/*" build
```

## Create a new project

```bash
npm create atria@latest
```

```bash
npm create atria@latest -- my-project
cd my-project
npm run dev
```

Equivalent direct command:

```bash
npx create-atria my-project
```

## Repository

- Source: [atria-io/atria](https://github.com/atria-io/atria)
- Issues: [github.com/atria-io/atria/issues](https://github.com/atria-io/atria/issues)

## License

[MIT](./LICENSE)

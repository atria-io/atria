# @atria/create

Scaffold a new atria project from the command line.

`@atria/create` bootstraps the initial structure for a document-first static CMS project, including `production/studio/` content folders, an empty `production/public/` output directory, `.atria/runtime`, and install-time database setup.

## Usage

```bash
npx @atria/create my-project
```

Or via npm create:

```bash
npm create @atria -- my-project
```

## Options

- `--skip-install` Skip dependency installation.
- `--force` Overwrite existing files.
- `--cli-version <version>` Set the `@atria/cli` version/range.
- `--pnpm` Use pnpm for dependency installation.
- `--yarn` Use yarn for dependency installation.
- `--npm` Use npm for dependency installation (default).
- `-h`, `--help` Show help.

## Generated structure

- `package.json` (with `dev` script using `atria dev` and `install` setup hook)
- `atria.config.json`
- `.env.example`
- `production/studio/content/.gitkeep`
- `production/studio/theme/.gitkeep`
- `production/public/` (created as empty output directory)
- `.atria/runtime/index.html`
- `.atria/runtime/app.js`

Database selection and bootstrap run during `npm install` (via `install` script -> `atria setup --database-only`).

OAuth providers are configured via `.env` (generated from `.env.example`) with:
- `ATRIA_AUTH_BROKER_ORIGIN` (recommended)
- `ATRIA_AUTH_GITHUB_CLIENT_ID` / `ATRIA_AUTH_GITHUB_CLIENT_SECRET` (self-host fallback)
- `ATRIA_AUTH_GOOGLE_CLIENT_ID` / `ATRIA_AUTH_GOOGLE_CLIENT_SECRET` (self-host fallback)

## Next steps

```bash
cd my-project
npm run dev
```

# create-atria

Project scaffolder for atria.

## Usage

Create in current folder:

```bash
npm create atria@latest
```

Create in a named folder:

```bash
npm create atria@latest -- my-project
```

Direct package usage:

```bash
npx create-atria my-project
```

## Options

- `--skip-install`: skip dependency installation.
- `--force`: overwrite existing files.
- `--cli-version <version>`: set `@atria/cli` version/range.
- `--pnpm`: install dependencies with pnpm.
- `--yarn`: install dependencies with yarn.
- `--npm`: install dependencies with npm (default).

## Generated files

- `package.json` with scripts:
  - `install`: `npm run "dev install"`
  - `dev install`: `atria setup --database-only`
  - `dev`: `atria dev`
- `atria.config.json`
- `.env.example`
- `production/studio/content/.gitkeep`
- `production/studio/theme/.gitkeep`
- `production/public/`
- `.atria/runtime/index.html`
- `.atria/runtime/app.js`

## Database setup flow

During dependency install, `atria setup --database-only` runs and asks for:

- `SQLite (default)`
- `PostgreSQL`

Environment template includes:

- `ATRIA_DATABASE_URL` (preferred)
- `DATABASE_URL` (compatibility)
- `ATRIA_AUTH_BROKER_ORIGIN`
- optional self-host OAuth keys

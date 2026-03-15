# atria

Unscoped wrapper for `@atria/cli`.

This package exists so users can install and run the atria CLI without using a scoped package name.

## Install

```bash
npm install -D atria
```

## Usage

```bash
npx atria init my-project
npx atria dev my-project
```

## Create a project

```bash
npm create atria@latest -- my-project
```

## Programmatic API

```ts
import { runCli } from "atria";

await runCli(process.argv);
```

## Relationship to `@atria/cli`

- `atria` forwards CLI execution to `@atria/cli`.
- Feature behavior and command surface are the same.

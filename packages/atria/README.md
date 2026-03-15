# atria

Unscoped CLI wrapper for `@atria/cli`.

Use this package when you want `atria` commands without a scoped package name.

## Install

```bash
npm install -D atria
```

## Usage

```bash
npx atria --help
npx atria init
npx atria setup
npx atria dev
```

## Create command

```bash
npm create atria@latest
```

## Programmatic API

```ts
import { runCli } from "atria";

await runCli(process.argv);
```

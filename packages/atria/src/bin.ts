#!/usr/bin/env node
import { runCli } from "@atria/cli";

runCli(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[atria] ${message}`);
  process.exit(1);
});

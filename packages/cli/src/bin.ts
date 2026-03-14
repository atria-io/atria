#!/usr/bin/env node

const originalEmitWarning = process.emitWarning.bind(process);

process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
  const warningMessage = typeof warning === "string" ? warning : warning.message;
  const warningType =
    typeof args[0] === "string"
      ? args[0]
      : warning instanceof Error && typeof warning.name === "string"
        ? warning.name
        : "";

  const isSqliteExperimentalWarning =
    warningType === "ExperimentalWarning" &&
    warningMessage.includes("SQLite is an experimental feature");

  if (isSqliteExperimentalWarning) {
    return;
  }

  (originalEmitWarning as (...warningArgs: unknown[]) => void)(warning, ...args);
}) as typeof process.emitWarning;

const main = async (): Promise<void> => {
  const { runCli } = await import("./index.js");
  await runCli(process.argv);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[atria] ${message}`);
  process.exit(1);
});

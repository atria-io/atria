import readline from "node:readline";
import { done, doneField, isInteractivePrompt, terminal } from "@atria/shared";
import type { ExistingProjectEntry } from "./projects.js";

export interface PromptInputOptions {
  defaultValue: string;
  displayDefault?: string;
}

const isPrintableInput = (value: string): boolean => {
  const code = value.charCodeAt(0);
  return code >= 32 && code !== 127;
};

export const promptInput = async (label: string, options: PromptInputOptions): Promise<string> => {
  if (!isInteractivePrompt()) {
    return options.defaultValue;
  }

  const displayDefault = options.displayDefault ?? options.defaultValue;

  return new Promise((resolve, reject) => {
    let inputValue = "";

    const render = (): void => {
      const visibleValue =
        inputValue.length > 0 ? inputValue : terminal.dim(`(${displayDefault})`);

      process.stdout.write(
        `\r\u001b[2K${terminal.blue("?")} ${terminal.bold(label)} ${visibleValue}`
      );
    };

    const cleanup = (): void => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\u001b[?25h");
    };

    const finalize = (): void => {
      const trimmed = inputValue.trim();
      const resolvedValue = trimmed.length > 0 ? trimmed : options.defaultValue;
      cleanup();
      process.stdout.write("\n");
      resolve(resolvedValue);
    };

    const onData = (chunk: Buffer | string): void => {
      const raw = typeof chunk === "string" ? chunk : chunk.toString("utf8");

      if (raw === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Operation cancelled."));
        return;
      }

      if (raw === "\r" || raw === "\n") {
        finalize();
        return;
      }

      if (raw === "\u007f" || raw === "\b" || raw === "\u0008") {
        inputValue = inputValue.slice(0, -1);
        render();
        return;
      }

      if (raw.startsWith("\u001b")) {
        return;
      }

      for (const char of raw) {
        if (isPrintableInput(char)) {
          inputValue += char;
        }
      }

      render();
    };

    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    process.stdout.write("\u001b[?25h");

    render();
  });
};

export const promptProjectModeSelection = async (
  existingProjects: ExistingProjectEntry[]
): Promise<{ kind: "create-new" } | { kind: "existing"; project: ExistingProjectEntry }> => {
  if (!isInteractivePrompt() || existingProjects.length === 0) {
    return { kind: "create-new" };
  }

  return new Promise((resolve, reject) => {
    let selectedIndex = 0;
    let renderedLines = 0;
    let hasNavigated = false;
    const maxIndex = existingProjects.length;

    const clearRender = (): void => {
      if (renderedLines === 0) {
        return;
      }

      readline.moveCursor(process.stdout, 0, -Math.max(0, renderedLines - 1));
      readline.cursorTo(process.stdout, 0);
      readline.clearScreenDown(process.stdout);
      renderedLines = 0;
    };

    const render = (): void => {
      clearRender();

      const lines: string[] = [];
      lines.push(`${terminal.blue("?")} ${terminal.bold("Create a new project or select an existing one")}`);
      lines.push(
        selectedIndex === 0
          ? `${terminal.cyan("❯")} ${terminal.cyan("Create new project")}`
          : "  Create new project"
      );
      lines.push(` ${terminal.dim("──────────────")}`);

      for (let index = 0; index < existingProjects.length; index += 1) {
        const project = existingProjects[index];
        const optionIndex = index + 1;
        const label = project.configProjectName;

        if (optionIndex === selectedIndex) {
          lines.push(`${terminal.cyan("❯")} ${terminal.cyan(label)}`);
          continue;
        }

        lines.push(`  ${label}`);
      }

      lines.push("");
      lines.push(terminal.dim(hasNavigated ? "↵ select" : "↑↓ navigate • ↵ select"));

      process.stdout.write(lines.join("\n"));
      renderedLines = lines.length;
    };

    const cleanup = (): void => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\u001b[?25h");
    };

    const finalize = (
      selection: { kind: "create-new" } | { kind: "existing"; project: ExistingProjectEntry }
    ): void => {
      cleanup();
      clearRender();

      if (selection.kind === "create-new") {
        process.stdout.write(`${done("Create new project")}\n`);
      } else {
        process.stdout.write(
          `${doneField("Using existing project", selection.project.configProjectName)}\n`
        );
      }

      resolve(selection);
    };

    const onData = (chunk: Buffer | string): void => {
      const raw = typeof chunk === "string" ? chunk : chunk.toString("utf8");

      if (raw === "\u0003") {
        cleanup();
        clearRender();
        process.stdout.write("\n");
        reject(new Error("Operation cancelled."));
        return;
      }

      if (raw === "\r" || raw === "\n") {
        if (selectedIndex === 0) {
          finalize({ kind: "create-new" });
          return;
        }

        finalize({
          kind: "existing",
          project: existingProjects[selectedIndex - 1]
        });
        return;
      }

      if (raw === "\u001b[A") {
        hasNavigated = true;
        selectedIndex = selectedIndex === 0 ? maxIndex : selectedIndex - 1;
        render();
        return;
      }

      if (raw === "\u001b[B") {
        hasNavigated = true;
        selectedIndex = selectedIndex === maxIndex ? 0 : selectedIndex + 1;
        render();
      }
    };

    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    process.stdout.write("\u001b[?25l");

    render();
  });
};

export const supportsColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

export const paint = (openCode: number, text: string): string =>
  supportsColor ? `\u001b[${openCode}m${text}\u001b[0m` : text;

export const terminal = {
  blue: (text: string): string => paint(34, text),
  green: (text: string): string => paint(32, text),
  cyan: (text: string): string => paint(36, text),
  red: (text: string): string => paint(31, text),
  dim: (text: string): string => paint(90, text),
  bold: (text: string): string => paint(1, text)
};

export const done = (message: string): string => `${terminal.green("✔")} ${message}`;

export const doneField = (label: string, value: string): string =>
  `${terminal.green("✔")} ${terminal.bold(label)} ${terminal.cyan(value)}`;

export const success = (message: string): string => `${terminal.green("✅")} ${message}`;

export const isInteractivePrompt = (): boolean =>
  Boolean(process.stdin.isTTY && process.stdout.isTTY);

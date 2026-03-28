const supportsColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const paint = (openCode: number, text: string): string =>
  supportsColor ? `\u001b[${openCode}m${text}\u001b[0m` : text;

export const terminal = {
  green: (text: string): string => paint(32, text),
  cyan: (text: string): string => paint(36, text)
};

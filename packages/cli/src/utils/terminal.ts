const supportsColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const paint = (openCode: number, text: string): string =>
  supportsColor ? `\u001b[${openCode}m${text}\u001b[0m` : text;

export const terminal = {
  blue: (text: string): string => paint(34, text),
  green: (text: string): string => paint(32, text),
  lightBlue: (text: string): string => paint(94, text),
  cyan: (text: string): string => paint(36, text),
  dim: (text: string): string => paint(2, text),
  yellow: (text: string): string => paint(33, text)
};

const DEFAULT_BROKER_ORIGIN = "https://api.atrialabs.pt";

const toStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const resolveBrokerOrigin = (): string => {
  const configured = toStringValue(process.env.ATRIA_BROKER_ORIGIN);
  return configured === "" ? DEFAULT_BROKER_ORIGIN : configured;
};

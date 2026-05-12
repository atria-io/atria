import { resolveBrokerOrigin } from "./broker.config.js";
import type { BrokerExchangeProfile } from "./broker.db.js";
import type { BrokerProvider } from "./broker.types.js";

const toStringValue = (
  value: unknown
): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (
  value: unknown
): string | null => {
  const normalized = toStringValue(value);
  return normalized === "" ? null : normalized;
};

const isSupportedProvider = (
  provider: string
): provider is BrokerProvider =>
  provider === "google" || provider === "github";

interface BrokerConfirmResult {
  status: "ok" | "rejected" | "failed";
  brokerCode: string;
}

const readObject = (
  value: unknown
): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
};

const parseBrokerExchangeProfile = (
  payload: unknown,
  expectedProjectId: string
): BrokerExchangeProfile | null => {
  const root = readObject(payload);
  if (!root) {
    return null;
  }

  const providerRaw = toStringValue(root.provider).toLowerCase();
  if (!isSupportedProvider(providerRaw)) {
    return null;
  }

  const projectId = toStringValue(root.project_id ?? root.projectId);
  if (projectId === "" || projectId !== expectedProjectId) {
    return null;
  }

  const user = readObject(root.user);
  if (!user) {
    return null;
  }

  const providerUserId = toStringValue(
    user.providerUserId ?? user.provider_user_id
  );
  if (providerUserId === "") {
    return null;
  }

  return {
    provider: providerRaw,
    providerUserId,
    projectId,
    email: toNullableString(user.email),
    name: toNullableString(user.name),
    avatarUrl: toNullableString(user.avatarUrl ?? user.avatar_url),
  };
};

export const confirmBrokerConsent = async (
  consentToken: string,
  projectId: string
): Promise<BrokerConfirmResult> => {
  try {
    const brokerConfirmUrl = new URL("/oauth/confirm", resolveBrokerOrigin());
    brokerConfirmUrl.searchParams.set("consent_token", consentToken);
    const brokerResponse = await fetch(brokerConfirmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!brokerResponse.ok) {
      return {
        status:
          brokerResponse.status >= 400 && brokerResponse.status < 500
            ? "rejected"
            : "failed",
        brokerCode: "",
      };
    }

    const rawPayload = (await brokerResponse.json()) as unknown;
    if (!rawPayload || typeof rawPayload !== "object") {
      return { status: "failed", brokerCode: "" };
    }

    const root = rawPayload as Record<string, unknown>;
    const explicitFailure = root.ok === false || root.success === false;
    if (explicitFailure) {
      return { status: "rejected", brokerCode: "" };
    }

    const confirmedProjectId = toStringValue(root.project_id ?? root.projectId);
    const brokerCode = toStringValue(
      root.code ?? root.broker_code ?? root.brokerCode
    );
    if (
      confirmedProjectId === "" ||
      confirmedProjectId !== projectId ||
      brokerCode === ""
    ) {
      return { status: "failed", brokerCode: "" };
    }

    return { status: "ok", brokerCode };
  } catch {
    return { status: "failed", brokerCode: "" };
  }
};

export const exchangeBrokerCode = async (
  brokerCode: string,
  projectId: string
): Promise<{
  status: "ok" | "rejected" | "failed";
  profile: BrokerExchangeProfile | null;
}> => {
  try {
    const brokerExchangeUrl = new URL("/oauth/exchange", resolveBrokerOrigin());
    brokerExchangeUrl.searchParams.set("code", brokerCode);
    brokerExchangeUrl.searchParams.set("project_id", projectId);
    const brokerResponse = await fetch(brokerExchangeUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!brokerResponse.ok) {
      return {
        status:
          brokerResponse.status >= 400 && brokerResponse.status < 500
            ? "rejected"
            : "failed",
        profile: null,
      };
    }

    const rawPayload = (await brokerResponse.json()) as unknown;
    const profile = parseBrokerExchangeProfile(rawPayload, projectId);
    return profile
      ? { status: "ok", profile }
      : { status: "failed", profile: null };
  } catch {
    return { status: "failed", profile: null };
  }
};

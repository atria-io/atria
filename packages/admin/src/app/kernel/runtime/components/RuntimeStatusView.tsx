import React from "react";
import type { TranslateFn } from "../../../../i18n/client.js";

export type RuntimeFlagReason = "network_offline" | "server_unreachable" | "server_unavailable";

interface RuntimeStatusViewProps {
  reason: RuntimeFlagReason | null;
  fatalError: string | null;
  t: TranslateFn | null;
  onRetry: () => void;
}

const translateWithFallback = (
  t: TranslateFn | null,
  key: string,
  fallback: string
): string => {
  if (!t) {
    return fallback;
  }

  try {
    return t(key);
  } catch {
    return fallback;
  }
};

export function RuntimeStatusView(props: RuntimeStatusViewProps): React.JSX.Element | null {
  const { reason, fatalError, t, onRetry } = props;

  if (!reason && !fatalError) {
    return null;
  }

  if (reason) {
    const title =
      reason === "network_offline"
        ? translateWithFallback(t, "runtime.flag.offline.title", "You are offline")
        : reason === "server_unreachable"
          ? translateWithFallback(
              t,
              "runtime.flag.unreachable.title",
              "Cannot reach Back Office server"
            )
          : translateWithFallback(t, "runtime.flag.unavailable.title", "Back Office is unavailable");

    const message =
      reason === "network_offline"
        ? translateWithFallback(t, "runtime.flag.offline.message", "Network connection is unavailable.")
        : reason === "server_unreachable"
          ? translateWithFallback(
              t,
              "runtime.flag.unreachable.message",
              "The browser cannot reach the Back Office server."
            )
          : translateWithFallback(
              t,
              "runtime.flag.unavailable.message",
              "Back Office returned an unavailable response."
            );

    return (
      <section className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-card__title">{title}</h1>
          <p className="auth-card__text">{message}</p>
          <button type="button" className="auth-card__button" onClick={onRetry}>
            {translateWithFallback(t, "runtime.flag.retry", "Retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">
          {translateWithFallback(t, "runtime.flag.error.title", "Back Office error")}
        </h1>
        <p className="auth-card__error">{fatalError}</p>
      </div>
    </section>
  );
}

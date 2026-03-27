import React from "react";
import type { TranslateFn } from "../../../../i18n/client.js";

export type CriticalStatusReason = "network_offline" | "server_unreachable" | "server_unavailable";

interface CriticalStatusViewProps {
  reason: CriticalStatusReason | null;
  fatalError: string | null;
  t: TranslateFn;
  onRetry: () => void;
}

export function CriticalStatusView(props: CriticalStatusViewProps): React.JSX.Element | null {
  const { reason, fatalError, t, onRetry } = props;

  if (!reason && !fatalError) {
    return null;
  }

  if (reason) {
    const title =
      reason === "network_offline"
        ? t("runtime.flag.offline.title")
        : reason === "server_unreachable"
          ? t("runtime.flag.unreachable.title")
          : t("runtime.flag.unavailable.title");

    const message =
      reason === "network_offline"
        ? t("runtime.flag.offline.message")
        : reason === "server_unreachable"
          ? t("runtime.flag.unreachable.message")
          : t("runtime.flag.unavailable.message");

    return (
      <section className="critical-section">
        <div className="critical-card">
          <h1 className="critical-card__title">{title}</h1>
          <p className="critical-card__text">{message}</p>
          <button type="button" className="critical-card__button" onClick={onRetry}>
            {t("runtime.flag.retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="critical-section">
      <div className="critical-card">
        <h1 className="critical-card__title">{t("runtime.flag.error.title")}</h1>
        <p className="critical-card__error">{fatalError}</p>
      </div>
    </section>
  );
}

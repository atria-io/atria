import React from "react";
import type { TranslateFn } from "../../i18n/client.js";

interface DashboardScreenProps {
  accountLine: string;
  loadedAt: string;
  t: TranslateFn;
}

export function DashboardScreen(props: DashboardScreenProps): React.JSX.Element {
  const { accountLine, loadedAt, t } = props;

  return (
    <section className="dashboard-screen">
      <div className="dashboard-card">
        <h1 className="dashboard-card__title">{t("dashboard.title")}</h1>
        <p className="dashboard-card__text">{t("dashboard.message.active")}</p>
        <p className="dashboard-card__text">
          {t("dashboard.message.signedInAs", { account: accountLine })}
        </p>
        <p className="dashboard-card__text">{t("dashboard.message.loadedAt", { date: loadedAt })}</p>
      </div>
    </section>
  );
}

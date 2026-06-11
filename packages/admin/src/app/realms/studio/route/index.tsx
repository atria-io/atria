import type { Props } from "../model/studio.types.js";
import { Dashboard } from "../route/dashboard/index.js";
import { Pages } from "../route/pages/index.js";
import { Settings } from "../route/settings/index.js";
import { Theme } from "../route/theme/index.js";
import { Translations } from "../route/translations/index.js";

function Route({ state }: Props) {
  switch (state) {
    case "dashboard":
      return <Dashboard />;

    case "pages":
      return <Pages />;

    case "theme":
      return <Theme />;

    case "translations":
      return <Translations />;

    case "settings":
      return <Settings />;
  }
}

export { Route };

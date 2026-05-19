import type { Props } from "../model/critical.types.js";
import { Offline } from "./offline/index.js";
import { ServerDown } from "./server/index.js";
import { CriticalError } from "./fatal/index.js";

export const Screen = (
  { state }: Props
) => {
  if (state === "offline") {
    return <Offline />;
  }

  if (state === "server-down") {
    return <ServerDown />;
  }

  return <CriticalError />;
};

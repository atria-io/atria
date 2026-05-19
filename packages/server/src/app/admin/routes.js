import { bootstrap, setup } from "./adapter.js";
import * as security from "../auth/security.js";

export const routes = (app) => {
  app.get("/api/state", async (req, res) => {
    await bootstrap(req, res);
  });

  app.post("/admin/setup", async (req, res) => {
    if (!security.trusted(req)) {
      res.sendStatus(403);
      return;
    }

    await setup(res);
  });
};

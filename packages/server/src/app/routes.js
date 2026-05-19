import { routes as admin } from "./admin/routes.js";
import { routes as auth } from "./auth/routes.js";
import { routes as pages } from "./pages/routes.js";

export const routes = (app) => {
  admin(app);
  auth(app);
  pages(app);
};

import { routes as broker } from "./domains/broker.js";
import { routes as create } from "./domains/create.js";
import { routes as login } from "./domains/login.js";
import { routes as logout } from "./domains/logout.js";

export const routes = (app) => {
  login(app);
  create(app);
  broker(app);
  logout(app);
};

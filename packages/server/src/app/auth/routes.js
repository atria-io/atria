import { routes as broker } from "./domains/broker.adapter.js";
import { routes as create } from "./domains/create.adapter.js";
import { routes as login } from "./domains/login.adapter.js";
import { routes as logout } from "./domains/logout.adapter.js";

export const routes = (app) => {
  login(app);
  create(app);
  broker(app);
  logout(app);
};

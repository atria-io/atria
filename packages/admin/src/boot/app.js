import { AdminApp } from "/static/js/app.js";

const rootElement = document.getElementById("atria");

AdminApp({
  mountElement: rootElement,
  basePath: "/",
  reactStrictMode: false
});

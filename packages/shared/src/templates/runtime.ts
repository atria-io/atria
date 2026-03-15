export const READY_EVENT_NAME = "atria:studio:ready";
export const COLOR_SCHEME_STORAGE_KEY = "atria:color-scheme";
export const LEGACY_COLOR_SCHEME_STORAGE_KEY = "darkMode";

export const runtimeIndexHtml = `<!doctype html>
<html lang="en">
<!--
This file is auto-generated from "atria dev".
Modifications to this file are automatically discarded.
-->
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta name="referrer" content="same-origin" />
    <title>Atria Studio</title>
    <link rel="icon" href="/static/favicon.ico" />
    <link rel="stylesheet" href="/static/styles/tokens.css">
    <link rel="stylesheet" href="/static/styles/scheme.css">
    <link rel="stylesheet" href="/static/styles/globals.css">
    <style id="atria-scheme"></style>
    <script>
      (function () {
        var scheme = null;
        var schemeStyle = document.getElementById("atria-scheme");
        var schemeCssByMode = {
          dark:":root{--boot-bg:#131316;--boot-spinner-track:#2a2d3f;--boot-spinner:#8a8a8a;--color-text:#f3f4f6;--color-text-muted:#9ca3af;}",
          light:":root{--boot-bg:#ffffff;--boot-spinner-track:#d7dde8;--boot-spinner:#1f2937;--color-text:#171717;--color-text-muted:#9ca3af;}"
        };

        try {
          var stored = localStorage.getItem("${COLOR_SCHEME_STORAGE_KEY}");
          if (stored === "light" || stored === "dark") {
            scheme = stored;
          }
        } catch (_error) {}

        if (!scheme) {
          try {
            var legacy = localStorage.getItem("${LEGACY_COLOR_SCHEME_STORAGE_KEY}");
            if (legacy === "enabled") {
              scheme = "dark";
            } else if (legacy === "disabled") {
              scheme = "light";
            }
          } catch (_error) {}
        }

        if (!scheme) {
          try {
            scheme =
              window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
          } catch (_error) {
            scheme = "light";
          }
        }

        try {
          localStorage.setItem("${COLOR_SCHEME_STORAGE_KEY}", scheme);
          localStorage.setItem(
            "${LEGACY_COLOR_SCHEME_STORAGE_KEY}",
            scheme === "dark" ? "enabled" : "disabled"
          );
        } catch (_error) {}

        if (schemeStyle) {
          schemeStyle.textContent = schemeCssByMode[scheme] || schemeCssByMode.light;
        }

        window.__ATRIA_INITIAL_SCHEME = scheme;
      })();
    </script>
  </head>
  <body>
    <div id="atria"></div>
    <div id="atria-boot" aria-hidden="true">
      <style>
        #atria-boot {
          inset: 0;
          display: grid;
          position: fixed;
          place-items: center;
          background: var(--boot-bg);
          transition: opacity 0.2s ease;
          z-index: 999999999;
        }
        #atria-boot.is-hidden {
          opacity: 0;
          pointer-events: none;
        }
        .atria-boot__spinner {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          animation: atria-boot-spin 0.8s linear infinite;
          border: 2px solid var(--boot-spinner-track);
          border-top-color: var(--boot-spinner);
        }
        @keyframes atria-boot-spin {
          to {
            transform: rotate(360deg);
          }
        }
      </style>
      <div class="atria-boot__spinner"></div>
    </div>
    <script type="module" src="./app.js"></script>
  </body>
</html>
`;

export const runtimeAppJs = `// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.
import { mountAdminApp } from "/static/app.js";

const rootElement = document.getElementById("atria");
const bootElement = document.getElementById("atria-boot");

const revealApp = () => {
  if (bootElement) {
    bootElement.classList.add("is-hidden");
    window.setTimeout(() => {
      bootElement.remove();
    }, 220);
  }
};

window.addEventListener("${READY_EVENT_NAME}", revealApp, { once: true });
window.setTimeout(revealApp, 5000);

mountAdminApp({
  mountElement: rootElement,
  basePath: "/",
  reactStrictMode: false
});
`;

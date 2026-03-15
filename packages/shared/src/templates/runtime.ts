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
    <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxNicgaGVpZ2h0PScxNic+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsbD0nIzEzMTQxYicvPjwvc3ZnPg==">
    <title>Atria Studio</title>
    <script>
      (function () {
        var scheme = null;

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
          scheme = "light";
        }

        try {
          localStorage.setItem("${COLOR_SCHEME_STORAGE_KEY}", scheme);
          localStorage.setItem(
            "${LEGACY_COLOR_SCHEME_STORAGE_KEY}",
            scheme === "dark" ? "enabled" : "disabled"
          );
        } catch (_error) {}

        window.__ATRIA_INITIAL_SCHEME = scheme;
      })();
    </script>
    <style>
      #atria-boot {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        background: var(--boot-bg);
        transition: opacity 0.2s ease;
      }

      #atria-boot.is-hidden {
        opacity: 0;
        pointer-events: none;
      }

      .atria-boot__spinner {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid var(--boot-spinner-track);
        border-top-color: var(--boot-spinner);
        animation: atria-boot-spin 0.8s linear infinite;
      }

      @keyframes atria-boot-spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    <div id="atria"></div>
    <div id="atria-boot" aria-hidden="true">
      <div class="atria-boot__spinner"></div>
    </div>
    <script type="module" src="./app.js"></script>
  </body>
</html>
`;

export const runtimeAppJs = `// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.
import { mountAdminApp } from "/.atria/admin/app.js";

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

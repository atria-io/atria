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
    <meta name="color-scheme" content="light dark" />
    <title>Atria Studio</title>
    <script>
      (function () {
        var root = document.documentElement;
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
          var prefersDark =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
          scheme = prefersDark ? "dark" : "light";
        }

        try {
          localStorage.setItem("${COLOR_SCHEME_STORAGE_KEY}", scheme);
          localStorage.setItem(
            "${LEGACY_COLOR_SCHEME_STORAGE_KEY}",
            scheme === "dark" ? "enabled" : "disabled"
          );
        } catch (_error) {}

        root.setAttribute("data-atria-color-scheme", scheme);
        if (scheme === "dark") {
          root.setAttribute("prefers-color-scheme", "dark");
        } else {
          root.removeAttribute("prefers-color-scheme");
        }
      })();
    </script>
    <style>
      :root {
        --atria-boot-bg: #ffffff;
        --atria-boot-spinner-track: #d7dde8;
        --atria-boot-spinner: #1f2937;
      }

      :root[data-atria-color-scheme="dark"],
      :root[prefers-color-scheme="dark"] {
        --atria-boot-bg: #0f1115;
        --atria-boot-spinner-track: #2a2f3a;
        --atria-boot-spinner: #f3f4f6;
      }

      html,
      body,
      #atria {
        min-height: 100%;
      }

      body {
        margin: 0;
        background: var(--atria-boot-bg);
      }

      #atria {
        visibility: hidden;
      }

      #atria-boot {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        background: var(--atria-boot-bg);
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
        border: 2px solid var(--atria-boot-spinner-track);
        border-top-color: var(--atria-boot-spinner);
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
  if (rootElement) {
    rootElement.style.visibility = "visible";
  }

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

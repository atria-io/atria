import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const buildRuntimeSource = () =>
  `(() => {
  const ROOT_ID = "atria";
  const TOOLTIP_ATTR = "data-tooltip";
  const PORTAL_ATTR = "data-portal";
  const OPEN_DELAY_MS = 600;
  const CLOSE_DELAY_MS = 120;
  const EDGE_OFFSET = 8;
  const HORIZONTAL_OFFSET = 10;
  const tooltipByElement = new WeakMap();
  let activeTarget = null;
  let openTimer = 0;
  let closeTimer = 0;
  let portalNode = null;
  let tooltipNode = null;
  let suppressHoverUntilClear = false;

  const getRoot = () => document.getElementById(ROOT_ID);

  const clearOpenTimer = () => {
    if (openTimer === 0) {
      return;
    }

    window.clearTimeout(openTimer);
    openTimer = 0;
  };

  const clearCloseTimer = () => {
    if (closeTimer === 0) {
      return;
    }

    window.clearTimeout(closeTimer);
    closeTimer = 0;
  };

  const removeTooltipNow = () => {
    clearCloseTimer();

    if (portalNode && portalNode.parentNode) {
      portalNode.parentNode.removeChild(portalNode);
    }

    portalNode = null;
    tooltipNode = null;
  };

  const closeTooltip = () => {
    if (!portalNode || !tooltipNode) {
      return;
    }

    clearCloseTimer();

    const closingPortal = portalNode;
    const closingNode = tooltipNode;
    portalNode = null;
    tooltipNode = null;
    closingNode.classList.add("atria-tooltip--closing");

    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      if (closingPortal.parentNode) {
        closingPortal.parentNode.removeChild(closingPortal);
      }
    }, CLOSE_DELAY_MS);
  };

  const captureTooltip = (element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const rawValue = element.getAttribute(TOOLTIP_ATTR);
    if (rawValue === null) {
      return;
    }

    const value = rawValue.trim();
    element.removeAttribute(TOOLTIP_ATTR);

    if (value.length === 0) {
      return;
    }

    tooltipByElement.set(element, value);
  };

  const captureTree = (node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    captureTooltip(node);
    for (const element of node.querySelectorAll("[" + TOOLTIP_ATTR + "]")) {
      captureTooltip(element);
    }
  };

  const resolveTooltipTarget = (startNode) => {
    let cursor = startNode instanceof Node ? startNode : null;

    while (cursor) {
      if (cursor instanceof HTMLElement && tooltipByElement.has(cursor)) {
        return cursor;
      }

      cursor = cursor instanceof Element ? cursor.parentElement : cursor.parentNode;
    }

    return null;
  };

  const positionTooltip = (target) => {
    if (!tooltipNode) {
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const maxLeft = window.innerWidth - tooltipRect.width - EDGE_OFFSET;
    const rawLeft = targetRect.right + HORIZONTAL_OFFSET;
    const nextLeft = Math.max(EDGE_OFFSET, Math.min(maxLeft, rawLeft));
    const rawTop = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
    const maxTop = window.innerHeight - tooltipRect.height - EDGE_OFFSET;
    const nextTop = Math.max(EDGE_OFFSET, Math.min(maxTop, rawTop));

    tooltipNode.style.left = nextLeft + "px";
    tooltipNode.style.top = nextTop + "px";
  };

  const showTooltip = (target) => {
    const value = tooltipByElement.get(target);
    if (!value) {
      return;
    }

    const root = getRoot();
    if (!root) {
      return;
    }

    removeTooltipNow();

    const nextPortal = document.createElement("div");
    nextPortal.setAttribute(PORTAL_ATTR, "");

    const nextTooltipCard = document.createElement("div");
    const nextTooltipContent = document.createElement("div");
    const nextTooltipText = document.createElement("div");
    nextTooltipCard.id = "atria-tooltip";
    nextTooltipContent.className = "atria-tooltip__content";
    nextTooltipText.className = "atria-tooltip__text";
    nextTooltipText.textContent = value;
    nextTooltipCard.style.position = "fixed";
    nextTooltipCard.style.zIndex = "2147483647";
    nextTooltipCard.style.pointerEvents = "none";

    nextTooltipContent.appendChild(nextTooltipText);
    nextTooltipCard.appendChild(nextTooltipContent);
    nextPortal.appendChild(nextTooltipCard);
    root.appendChild(nextPortal);
    portalNode = nextPortal;
    tooltipNode = nextTooltipCard;
    positionTooltip(target);
  };

  const hideTooltip = () => {
    activeTarget = null;
    clearOpenTimer();
    closeTooltip();
  };

  const queueOpen = (target) => {
    clearOpenTimer();
    openTimer = window.setTimeout(() => {
      openTimer = 0;

      if (activeTarget !== target) {
        return;
      }

      showTooltip(target);
    }, OPEN_DELAY_MS);
  };

  const activateTarget = (target) => {
    if (activeTarget === target) {
      if (!tooltipNode && openTimer === 0) {
        queueOpen(target);
      }
      return;
    }

    activeTarget = target;
    removeTooltipNow();
    queueOpen(target);
  };

  const onPointer = (event) => {
    const target = resolveTooltipTarget(event.target);
    if (suppressHoverUntilClear) {
      if (target) {
        hideTooltip();
        return;
      }

      suppressHoverUntilClear = false;
      return;
    }

    if (!target) {
      hideTooltip();
      return;
    }

    activateTarget(target);
    if (tooltipNode && activeTarget === target) {
      positionTooltip(activeTarget);
    }
  };

  const onPointerLeaveRoot = () => {
    hideTooltip();
    suppressHoverUntilClear = false;
  };

  const onPointerDown = () => {
    suppressHoverUntilClear = true;
    hideTooltip();
  };

  const onScroll = () => {
    hideTooltip();
  };

  const onRouteChange = () => {
    suppressHoverUntilClear = true;
    hideTooltip();
  };

  const onFocusIn = (event) => {
    const target = resolveTooltipTarget(event.target);
    if (!target) {
      return;
    }

    activeTarget = target;
    queueOpen(target);
  };

  const onFocusOut = (event) => {
    const nextTarget = resolveTooltipTarget(event.relatedTarget);
    if (nextTarget && nextTarget === activeTarget) {
      return;
    }

    hideTooltip();
  };

  const onKeyDown = (event) => {
    const target = resolveTooltipTarget(event.target);
    if (!target) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      suppressHoverUntilClear = true;
      hideTooltip();
    }
  };

  const onMutation = (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        captureTooltip(mutation.target);
        continue;
      }

      for (const node of mutation.addedNodes) {
        captureTree(node);
      }
    }

    if (tooltipNode && !tooltipNode.isConnected) {
      portalNode = null;
      tooltipNode = null;
    }

    if (activeTarget && !activeTarget.isConnected) {
      activeTarget = null;
      clearOpenTimer();
    }
  };

  const boot = () => {
    const root = getRoot();
    if (!root) {
      return;
    }

    captureTree(root);

    const observer = new MutationObserver(onMutation);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [TOOLTIP_ATTR]
    });

    root.addEventListener("pointerover", onPointer, true);
    root.addEventListener("pointermove", onPointer, true);
    root.addEventListener("pointerleave", onPointerLeaveRoot, true);
    root.addEventListener("pointerdown", onPointerDown, true);
    root.addEventListener("focusin", onFocusIn, true);
    root.addEventListener("focusout", onFocusOut, true);
    root.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("blur", hideTooltip);
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("atria:route-change", onRouteChange);

    const historyApi = window.history;
    if (historyApi && typeof historyApi.pushState === "function" && typeof historyApi.replaceState === "function") {
      const originalPushState = historyApi.pushState.bind(historyApi);
      const originalReplaceState = historyApi.replaceState.bind(historyApi);

      historyApi.pushState = (...args) => {
        const result = originalPushState(...args);
        window.dispatchEvent(new CustomEvent("atria:route-change"));
        return result;
      };

      historyApi.replaceState = (...args) => {
        const result = originalReplaceState(...args);
        window.dispatchEvent(new CustomEvent("atria:route-change"));
        return result;
      };
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
    return;
  }

  boot();
})();`;

export const buildTooltipRuntime = async (packageRoot) => {
  const frontendDir = path.join(packageRoot, "dist", "frontend");
  const scriptDir = path.join(frontendDir, "static", "js");
  const scriptFile = path.join(scriptDir, "tooltip.js");

  await mkdir(scriptDir, { recursive: true });
  await writeFile(scriptFile, buildRuntimeSource(), "utf-8");
};

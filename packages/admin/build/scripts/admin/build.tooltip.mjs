import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const buildRuntimeSource = () =>
  `(() => {
  const ROOT_ID = "atria";
  const TOOLTIP_ATTR = "data-tooltip";
  const PORTAL_ATTR = "data-portal";
  const OPEN_DELAY_MS = 600;
  const HIDE_GRACE_MS = 90;
  const SWITCH_GRACE_MS = 300;
  const CLOSE_FALLBACK_MS = 260;
  const EDGE_OFFSET = 8;
  const HORIZONTAL_OFFSET = 10;
  const HEADER_OFFSET = 6;

  const tooltipByElement = new WeakMap();

  let activeTarget = null;
  let openTimer = 0;
  let hideTimer = 0;
  let closeTimer = 0;
  let portalNode = null;
  let tooltipNode = null;
  let closingPortalNode = null;
  let suppressHoverUntilClear = false;
  let skipOpenAnimation = false;
  let lastTooltipDeactivateAt = 0;

  const getRoot = () => document.getElementById(ROOT_ID);

  const clearOpenTimer = () => {
    if (openTimer === 0) {
      return;
    }

    window.clearTimeout(openTimer);
    openTimer = 0;
  };

  const clearHideTimer = () => {
    if (hideTimer === 0) {
      return;
    }

    window.clearTimeout(hideTimer);
    hideTimer = 0;
  };

  const clearCloseTimer = () => {
    if (closeTimer === 0) {
      return;
    }

    window.clearTimeout(closeTimer);
    closeTimer = 0;
  };

  const clearTooltipAnimationOverride = (node) => {
    const tooltipContent = node.querySelector(".atria-tooltip__content");
    if (!(tooltipContent instanceof HTMLElement)) {
      return;
    }

    tooltipContent.style.removeProperty("animation");

    const tooltipText = node.querySelector(".atria-tooltip__text");
    if (!(tooltipText instanceof HTMLElement)) {
      return;
    }

    tooltipText.style.removeProperty("animation");
    tooltipText.style.removeProperty("opacity");
  };

  const disableTooltipAnimationOverride = (node) => {
    const tooltipContent = node.querySelector(".atria-tooltip__content");
    if (!(tooltipContent instanceof HTMLElement)) {
      return;
    }

    tooltipContent.style.animation = "none";

    const tooltipText = node.querySelector(".atria-tooltip__text");
    if (!(tooltipText instanceof HTMLElement)) {
      return;
    }

    tooltipText.style.animation = "none";
    tooltipText.style.opacity = "1";
  };

  const removeClosingPortalNow = () => {
    if (closingPortalNode && closingPortalNode.parentNode) {
      closingPortalNode.parentNode.removeChild(closingPortalNode);
    }

    closingPortalNode = null;
  };

  const removeTooltipNow = () => {
    clearCloseTimer();
    removeClosingPortalNow();

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

    lastTooltipDeactivateAt = Date.now();
    clearCloseTimer();
    removeClosingPortalNow();

    closingPortalNode = portalNode;
    const closingNode = tooltipNode;

    portalNode = null;
    tooltipNode = null;

    const closingContent = closingNode.querySelector(".atria-tooltip__content");
    if (closingContent instanceof HTMLElement) {
      clearTooltipAnimationOverride(closingNode);
      closingContent.classList.remove("atria-tooltip__content--open");
      closingContent.classList.add("atria-tooltip__content--closing");

      const onAnimationEnd = () => {
        closingContent.removeEventListener("animationend", onAnimationEnd);
        removeClosingPortalNow();
      };

      closingContent.addEventListener("animationend", onAnimationEnd);
      closeTimer = window.setTimeout(() => {
        closeTimer = 0;
        removeClosingPortalNow();
      }, CLOSE_FALLBACK_MS);

      return;
    }

    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      removeClosingPortalNow();
    }, CLOSE_FALLBACK_MS);
  };

  const hideTooltipImmediate = () => {
    activeTarget = null;
    clearOpenTimer();
    clearHideTimer();
    closeTooltip();
  };

  const queueHide = () => {
    clearHideTimer();

    hideTimer = window.setTimeout(() => {
      hideTimer = 0;
      hideTooltipImmediate();
    }, HIDE_GRACE_MS);
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

  const isHeaderTarget = (target) => target.closest("header") !== null;

  const isHeaderPopupOpen = (target) =>
    target.querySelector('[aria-haspopup="menu"][aria-expanded="true"]') !== null;

  const shouldBlockTooltip = (target) => {
    if (!isHeaderTarget(target)) {
      return false;
    }

    return isHeaderPopupOpen(target);
  };

  const getTooltipOffset = (target) =>
    isHeaderTarget(target) ? HEADER_OFFSET : HORIZONTAL_OFFSET;

  const positionTooltip = (target) => {
    if (!tooltipNode) {
      return;
    }

    const offset = getTooltipOffset(target);
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const maxLeft = window.innerWidth - tooltipRect.width - EDGE_OFFSET;
    const rightLeft = targetRect.right + offset;
    const maxTop = window.innerHeight - tooltipRect.height - EDGE_OFFSET;

    let nextLeft;
    let nextTop;
    let nextOrigin;

    if (rightLeft <= maxLeft) {
      nextLeft = Math.max(EDGE_OFFSET, Math.min(maxLeft, rightLeft));
      const rightTop = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
      nextTop = Math.max(EDGE_OFFSET, Math.min(maxTop, rightTop));
      nextOrigin = "left center";
    } else {
      const centeredLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
      nextLeft = Math.max(EDGE_OFFSET, Math.min(maxLeft, centeredLeft));
      const belowTop = targetRect.bottom + offset;
      nextTop = Math.max(EDGE_OFFSET, Math.min(maxTop, belowTop));
      nextOrigin = "center top";
    }

    tooltipNode.style.left = nextLeft + "px";
    tooltipNode.style.top = nextTop + "px";

    const tooltipContent = tooltipNode.querySelector(".atria-tooltip__content");
    if (tooltipContent instanceof HTMLElement) {
      tooltipContent.style.transformOrigin = nextOrigin;
    }
  };

  const showTooltip = (target) => {
    const value = tooltipByElement.get(target);
    if (!value || shouldBlockTooltip(target)) {
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
    nextTooltipContent.className = "atria-tooltip__content atria-tooltip__content--open";
    nextTooltipText.className = "atria-tooltip__text";
    nextTooltipText.textContent = value;

    if (skipOpenAnimation || Date.now() - lastTooltipDeactivateAt <= SWITCH_GRACE_MS) {
      disableTooltipAnimationOverride(nextTooltipCard);
      skipOpenAnimation = false;
    } else {
      clearTooltipAnimationOverride(nextTooltipCard);
    }

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

  const swapTooltip = (target) => {
    if (!tooltipNode) {
      return false;
    }

    const value = tooltipByElement.get(target);
    if (!value || shouldBlockTooltip(target)) {
      return false;
    }

    const tooltipText = tooltipNode.querySelector(".atria-tooltip__text");
    if (!(tooltipText instanceof HTMLElement)) {
      return false;
    }

    disableTooltipAnimationOverride(tooltipNode);
    tooltipText.textContent = value;
    positionTooltip(target);

    return true;
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
    clearOpenTimer();
    clearHideTimer();

    if (swapTooltip(target)) {
      return;
    }

    const hadRecentTooltip =
      Boolean(tooltipNode || closingPortalNode) || Date.now() - lastTooltipDeactivateAt <= SWITCH_GRACE_MS;

    if (hadRecentTooltip) {
      skipOpenAnimation = true;
      removeTooltipNow();
      showTooltip(target);
      return;
    }

    removeTooltipNow();
    queueOpen(target);
  };

  const onPointer = (event) => {
    const target = resolveTooltipTarget(event.target);

    if (suppressHoverUntilClear) {
      if (target) {
        hideTooltipImmediate();
        return;
      }

      suppressHoverUntilClear = false;
      return;
    }

    if (!target || shouldBlockTooltip(target)) {
      queueHide();
      return;
    }

    activateTarget(target);

    if (tooltipNode && activeTarget === target) {
      positionTooltip(activeTarget);
    }
  };

  const onPointerLeaveRoot = () => {
    hideTooltipImmediate();
    suppressHoverUntilClear = false;
  };

  const onPointerDown = () => {
    suppressHoverUntilClear = true;
    hideTooltipImmediate();
  };

  const onScroll = () => {
    hideTooltipImmediate();
  };

  const onRouteChange = () => {
    suppressHoverUntilClear = true;
    hideTooltipImmediate();
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

    if (closingPortalNode && !closingPortalNode.isConnected) {
      closingPortalNode = null;
      clearCloseTimer();
    }

    if (activeTarget && !activeTarget.isConnected) {
      activeTarget = null;
      clearOpenTimer();
      clearHideTimer();
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
      attributeFilter: [TOOLTIP_ATTR],
    });

    root.addEventListener("pointerover", onPointer, true);
    root.addEventListener("pointermove", onPointer, true);
    root.addEventListener("pointerleave", onPointerLeaveRoot, true);
    root.addEventListener("pointerdown", onPointerDown, true);

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("blur", hideTooltipImmediate);
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("atria:route-change", onRouteChange);

    const historyApi = window.history;
    if (
      historyApi &&
      typeof historyApi.pushState === "function" &&
      typeof historyApi.replaceState === "function"
    ) {
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

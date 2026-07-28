(() => {
  "use strict";

  let animationObserver = null;
  let mutationObserver = null;
  const observedElements = new WeakSet();

  let mode = localStorage.getItem("eve-graphics-performance") === "complete"
    ? "complete"
    : "optimized";

  function observeAnimatedElement(element) {
    if (!(element instanceof Element) || observedElements.has(element)) return;
    observedElements.add(element);
    animationObserver?.observe(element);
  }

  function scanAnimatedElements(root = document) {
    const animations = document.getAnimations?.() || [];
    animations.forEach(animation => observeAnimatedElement(animation.effect?.target));
  }

  function initializeAnimationObserver() {
    if (typeof IntersectionObserver !== "function") return;
    animationObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle("graphics-animation-paused", !entry.isIntersecting);
      });
    }, { rootMargin: "100px", threshold: 0.01 });

    const scan = () => scanAnimatedElements(document);
    if (typeof requestIdleCallback === "function") requestIdleCallback(scan, { timeout: 500 });
    else setTimeout(scan, 0);

    mutationObserver = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node instanceof Element) scheduleScan();
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  let scanPending = false;
  function scheduleScan() {
    if (scanPending) return;
    scanPending = true;
    const run = () => {
      scanPending = false;
      scanAnimatedElements(document);
    };
    if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 500 });
    else setTimeout(run, 0);
  }

  function syncPageVisibility() {
    document.body.classList.toggle("graphics-page-hidden", document.hidden);
  }

  syncPageVisibility();
  function setMode(nextMode) {
    mode = nextMode === "complete" ? "complete" : "optimized";
    document.body.dataset.graphicsPerformance = mode;
    localStorage.setItem("eve-graphics-performance", mode);
    window.dispatchEvent(new CustomEvent("eve:graphics-performance-change", {
      detail: { mode }
    }));
    return mode;
  }

  document.body.dataset.graphicsPerformance = mode;
  initializeAnimationObserver();
  document.addEventListener("visibilitychange", syncPageVisibility, { passive: true });

  window.EveGraphicsPerformance = Object.assign(window.EveGraphicsPerformance || {}, {
    version: "1.0.0",
    getMode: () => mode,
    setMode,
    pausesHiddenPage: true,
    pausesOffscreenCssAnimations: Boolean(animationObserver),
    disconnect() {
      animationObserver?.disconnect();
      mutationObserver?.disconnect();
    }
  });
})();

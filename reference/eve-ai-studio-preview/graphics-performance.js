(() => {
  "use strict";

  let animationObserver = null;
  let mutationObserver = null;
  const observedElements = new WeakSet();

  function observeAnimatedElement(element) {
    if (!(element instanceof Element) || observedElements.has(element)) return;
    if (getComputedStyle(element).animationName === "none") return;
    observedElements.add(element);
    animationObserver?.observe(element);
  }

  function scanAnimatedElements(root = document) {
    if (root instanceof Element) observeAnimatedElement(root);
    root.querySelectorAll?.("*").forEach(observeAnimatedElement);
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
          if (node instanceof Element) scanAnimatedElements(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function syncPageVisibility() {
    document.body.classList.toggle("graphics-page-hidden", document.hidden);
  }

  syncPageVisibility();
  document.body.dataset.graphicsPerformance = "optimized";
  initializeAnimationObserver();
  document.addEventListener("visibilitychange", syncPageVisibility, { passive: true });

  window.EveGraphicsPerformance = Object.assign(window.EveGraphicsPerformance || {}, {
    version: "1.0.0",
    pausesHiddenPage: true,
    pausesOffscreenCssAnimations: Boolean(animationObserver),
    disconnect() {
      animationObserver?.disconnect();
      mutationObserver?.disconnect();
    }
  });
})();

(() => {
  "use strict";

  const modulesByView = {
    tests: ["evaluation-workflow.js", "runner-workflow.js"],
    laboratory: ["model-test-workflow.js", "model-rules-workflow.js"],
    prompts: ["model-test-workflow.js", "model-rules-workflow.js"],
    "rag-materials": [
      "retrieval-workflow.js",
      "rag-chat-workflow.js",
      "source-opening-workflow.js"
    ],
    versions: ["eve-release-workflow.js"],
    publish: ["eve-release-workflow.js"]
  };
  const loadedScripts = new Set();
  const loadingViews = new Map();
  let replayingClick = false;

  async function loadForView(view) {
    const scripts = modulesByView[view];
    if (!scripts?.length) return;
    if (loadingViews.has(view)) return loadingViews.get(view);

    const promise = (async () => {
      document.body.dataset.sectionLoading = view;
      try {
        for (const source of scripts) {
          if (loadedScripts.has(source)) continue;
          await window.loadPreviewScript(source);
          loadedScripts.add(source);
        }
      } finally {
        delete document.body.dataset.sectionLoading;
      }
    })();
    loadingViews.set(view, promise);
    try {
      await promise;
    } finally {
      loadingViews.delete(view);
    }
  }

  document.addEventListener("click", async event => {
    if (replayingClick) return;
    const trigger = event.target.closest?.("[data-view],[data-go]");
    const view = trigger?.dataset.view || trigger?.dataset.go;
    if (!trigger || !modulesByView[view]) return;
    const missing = modulesByView[view].some(source => !loadedScripts.has(source));
    if (!missing) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    trigger.setAttribute("aria-busy", "true");
    try {
      await loadForView(view);
      replayingClick = true;
      trigger.click();
    } catch (error) {
      console.error(`Caricamento della sezione ${view} non riuscito.`, error);
      window.showToast?.("La sezione non è stata caricata. Riprova.");
    } finally {
      replayingClick = false;
      trigger.removeAttribute("aria-busy");
    }
  }, true);

  window.EveSectionModules = {
    loadForView,
    isLoaded(view) {
      return !modulesByView[view]?.some(source => !loadedScripts.has(source));
    },
    modulesByView
  };
})();

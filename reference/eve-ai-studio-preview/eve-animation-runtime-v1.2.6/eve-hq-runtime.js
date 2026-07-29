(() => {
  "use strict";

  const VERSION = "1.2.6";
  const embeddedManifest = window.__EVE_HQ_STANDALONE_MANIFEST || null;
  const scriptUrl = document.currentScript?.src || "";
  const manifestUrl = scriptUrl ? new URL("eve-hq-runtime-manifest.json", scriptUrl) : null;

  let manifest = null;
  let portrait = null;
  let currentState = null;
  let currentSource = "";
  let portraitIsVisible = true;
  let portraitObserver = null;
  let manualPaused = false;
  const aliases = Object.create(null);

  async function ensureManifest() {
    if (manifest) return manifest;
    if (embeddedManifest) manifest = embeddedManifest;
    else {
      if (!manifestUrl) throw new Error("Manifest Eve HQ 1.2.6 non disponibile");
      const response = await fetch(manifestUrl, { cache: "default" });
      if (!response.ok) throw new Error(`Manifest Eve HQ 1.2.6 non disponibile: ${response.status}`);
      manifest = await response.json();
    }
    if (manifest.version !== VERSION || manifest.totalAssets !== 64) {
      throw new Error("Manifest Eve Animation Library 1.2.6 non valido");
    }
    Object.assign(aliases, manifest.aliases || {});
    return manifest;
  }

  function ensurePortrait() {
    if (portrait?.isConnected) return portrait;
    const stage = document.querySelector(".eve-orb-stage") || document.querySelector(".brand");
    if (!stage) throw new Error("Contenitore grafico Eve non trovato");
    const old = stage.querySelector(".eve-portrait, .avatar");
    portrait = document.createElement("img");
    portrait.id = "eveHqPortrait";
    portrait.className = "eve-portrait eve-hq-portrait";
    portrait.alt = "Eve, assistente AI animata";
    portrait.decoding = "async";
    portrait.loading = "eager";
    portrait.fetchPriority = "high";
    portrait.draggable = false;
    if (old) old.replaceWith(portrait); else stage.prepend(portrait);

    if (typeof IntersectionObserver === "function") {
      portraitObserver?.disconnect();
      portraitObserver = new IntersectionObserver(entries => {
        portraitIsVisible = Boolean(entries[0]?.isIntersecting);
        syncPortraitPlayback();
      }, { rootMargin: "80px", threshold: 0.01 });
      portraitObserver.observe(portrait);
    }
    return portrait;
  }

  function shouldPlayPortrait() {
    return !manualPaused && !document.hidden && portraitIsVisible;
  }

  function syncPortraitPlayback() {
    if (!portrait?.isConnected || !currentSource) return;
    if (shouldPlayPortrait()) {
      if (portrait.getAttribute("src") !== currentSource) portrait.src = currentSource;
      portrait.dataset.graphicsPlayback = "running";
    } else {
      if (portrait.hasAttribute("src")) portrait.removeAttribute("src");
      portrait.dataset.graphicsPlayback = "paused";
    }
  }

  function resolveAssetUrl(asset, reducedMotion) {
    const selected = reducedMotion && asset.poster ? asset.poster : asset.file;
    return asset.dataUrl || new URL(selected, manifestUrl).href;
  }

  async function setState(requestedState, options = {}) {
    const data = await ensureManifest();
    const id = aliases[requestedState] || requestedState;
    const asset = data.assets[id];
    if (!asset) throw new Error(`Stato Eve sconosciuto: ${requestedState}`);

    const image = ensurePortrait();
    const reducedMotion = options.reducedMotion ??
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    currentSource = resolveAssetUrl(asset, reducedMotion);

    if (currentState === id && options.restart !== false && shouldPlayPortrait()) {
      image.removeAttribute("src");
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    image.width = asset.width;
    image.height = asset.height;
    image.dataset.eveState = id;
    image.dataset.eveVersion = VERSION;
    image.dataset.eveQuality = "official-display-optimized";
    image.dataset.eveSha256 = asset.sha256;
    image.dataset.eveSourceWidth = String(asset.width);
    image.dataset.eveSourceHeight = String(asset.height);
    image.style.height = asset.variant === "compact" ? "128px" : asset.variant === "hero" ? "320px" : "232px";
    image.style.maxWidth = asset.variant === "compact" ? "128px" : "100%";

    syncPortraitPlayback();
    if (image.hasAttribute("src")) await image.decode().catch(() => undefined);
    currentState = id;
    document.dispatchEvent(new CustomEvent("eve:animation-state", {
      detail: { id, asset, version: VERSION }
    }));
    return { id, asset };
  }

  function pause() {
    manualPaused = true;
    syncPortraitPlayback();
  }

  function resume() {
    manualPaused = false;
    syncPortraitPlayback();
  }

  async function listStates() { return Object.values((await ensureManifest()).assets); }
  async function getAsset(id) { const data = await ensureManifest(); return data.assets[aliases[id] || id] || null; }
  async function hasState(id) { return Boolean(await getAsset(id)); }
  async function preload(ids = []) {
    const data = await ensureManifest();
    await Promise.all([...new Set(ids.map(id => aliases[id] || id))].map(id => new Promise(resolve => {
      const asset = data.assets[id];
      if (!asset) return resolve();
      const image = new Image();
      image.onload = image.onerror = resolve;
      image.src = resolveAssetUrl(asset, false);
    })));
  }

  const api = Object.freeze({
    version: VERSION,
    quality: "official-final-webp-runtime-optimized",
    qualityPolicy: "official-final-webp-byte-identical-no-recompression-display-sized",
    totalAssets: 64,
    setState,
    listStates,
    getAsset,
    hasState,
    preload,
    pause,
    resume,
    isPaused: () => manualPaused,
    getState: () => currentState,
    getManifest: ensureManifest,
  });

  window.EveAnimationLibrary = api;
  window.EveAnimationRuntime = api;
  document.addEventListener("visibilitychange", syncPortraitPlayback, { passive: true });
  ensureManifest().then(data => setState(data.defaultState, { restart: false })).catch(console.error);
})();

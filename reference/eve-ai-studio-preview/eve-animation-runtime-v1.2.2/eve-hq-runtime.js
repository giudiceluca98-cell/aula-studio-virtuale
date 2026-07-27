(() => {
  "use strict";
  const embeddedManifest = window.__EVE_HQ_STANDALONE_MANIFEST || null;
  const scriptUrl = document.currentScript?.src || "";
  const manifestUrl = scriptUrl ? new URL("eve-hq-runtime-manifest.json", scriptUrl) : null;
  let manifest = null;
  let portrait = null;
  let currentState = null;
  const aliases = Object.create(null);

  async function ensureManifest() {
    if (manifest) return manifest;
    if (embeddedManifest) { manifest = embeddedManifest; Object.assign(aliases, manifest.aliases || {}); return manifest; }
    if (!manifestUrl) throw new Error("Manifest Eve HQ non disponibile");
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error(`Manifest Eve HQ non disponibile: ${response.status}`);
    manifest = await response.json();
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
    portrait.draggable = false;
    if (old) old.replaceWith(portrait); else stage.prepend(portrait);
    return portrait;
  }

  async function setState(requestedState, options = {}) {
    const data = await ensureManifest();
    const id = aliases[requestedState] || requestedState;
    const asset = data.assets[id];
    if (!asset) throw new Error(`Stato Eve sconosciuto: ${requestedState}`);
    const image = ensurePortrait();
    const assetUrl = asset.dataUrl || new URL(asset.file, manifestUrl).href;
    if (currentState === id && options.restart !== false) {
      image.removeAttribute("src");
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    image.src = assetUrl;
    image.width = asset.width;
    image.height = asset.height;
    image.dataset.eveState = id;
    image.dataset.eveQuality = "original";
    image.dataset.eveSha256 = asset.sha256;
    image.dataset.eveSourceWidth = String(asset.width);
    image.dataset.eveSourceHeight = String(asset.height);
    image.style.height = asset.variant === "compact" ? "128px" : "232px";
    image.style.maxWidth = asset.variant === "compact" ? "128px" : "100%";
    await image.decode().catch(() => undefined);
    currentState = id;
    document.dispatchEvent(new CustomEvent("eve:animation-state", { detail: { id, asset } }));
    return { id, asset };
  }

  async function listStates() {
    const data = await ensureManifest();
    return Object.values(data.assets);
  }

  window.EveAnimationLibrary = Object.freeze({
    version: "1.2.2",
    quality: "original-final-webp",
    setState,
    listStates,
    getState: () => currentState,
    getManifest: ensureManifest,
  });

  ensureManifest().then(data => setState(data.defaultState, { restart: false })).catch(console.error);
})();

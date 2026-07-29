(() => {
  "use strict";

  const library = window.EveAnimationLibrary;
  if (!library?.getManifest || !library?.setState) {
    console.error("Eve Animation Library HQ non disponibile per la galleria.");
    return;
  }

  const humanize = value => String(value || "")
    .replace(/^eve-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());

  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const runtimeUrl = path => new URL(`eve-animation-runtime-v1.2.6/${path}`, document.baseURI).href;
  const animationUrl = asset => asset.dataUrl || runtimeUrl(asset.file);
  const posterUrl = asset => asset.poster ? runtimeUrl(asset.poster) : animationUrl(asset);

  const style = document.createElement("style");
  style.id = "eveAnimationLibraryGalleryStyles";
  style.textContent = `
    .eve-library-shortcut{width:100%;margin-top:12px;justify-content:center}
    .animation-library-toolbar{display:grid;grid-template-columns:minmax(220px,2fr) repeat(3,minmax(130px,1fr));gap:10px;margin-bottom:16px}
    .animation-library-summary{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .animation-library-preview{display:grid;grid-template-columns:minmax(260px,420px) minmax(0,1fr);gap:18px;align-items:center;contain:layout paint}
    .animation-library-preview-stage{min-height:340px;border:1px solid var(--line);border-radius:18px;background:radial-gradient(circle at 50% 42%,rgba(0,223,242,.16),transparent 56%),rgba(3,14,24,.62);display:grid;place-items:center;overflow:hidden;contain:strict}
    .animation-library-preview-stage img{display:block;width:min(100%,420px);height:340px;object-fit:contain;image-rendering:auto}
    .animation-library-preview-meta h3{margin:0 0 8px;font-size:24px}.animation-library-preview-meta p{color:var(--muted)}
    .animation-library-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-top:16px;contain:layout style}
    .animation-card{text-align:left;color:var(--text);border:1px solid var(--line);border-radius:15px;background:rgba(7,22,34,.74);padding:10px;transition:.16s ease;min-width:0;contain:layout paint style}
    .animation-card:hover,.animation-card:focus-within,.animation-card.active{transform:translateY(-2px);border-color:var(--cyan);box-shadow:0 10px 28px rgba(0,223,242,.12)}
    .animation-card-select{appearance:none;display:block;width:100%;padding:0;border:0;background:transparent;text-align:left;color:inherit;cursor:pointer}
    .animation-card-media{height:150px;border-radius:11px;background:radial-gradient(circle,rgba(0,223,242,.12),transparent 66%);display:grid;place-items:center;overflow:hidden}
    .animation-card-media img{width:100%;height:100%;object-fit:contain;image-rendering:auto}
    .animation-card strong{display:block;margin:9px 2px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .animation-card small{display:block;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .animation-card-play{appearance:none;width:100%;min-height:36px;margin-top:9px;padding:7px 9px;border:1px solid rgba(0,223,242,.58);border-radius:10px;background:rgba(0,223,242,.12);color:var(--cyan);font:inherit;font-size:12px;font-weight:800;cursor:pointer;transition:.16s ease}
    .animation-card-play:hover,.animation-card-play:focus-visible{background:var(--cyan);color:#03121c;box-shadow:0 7px 20px rgba(0,223,242,.2)}
    .animation-library-empty{grid-column:1/-1;padding:28px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px}
    @media(max-width:900px){.animation-library-toolbar{grid-template-columns:1fr 1fr}.animation-library-preview{grid-template-columns:1fr}}
    @media(max-width:600px){.animation-library-toolbar{grid-template-columns:1fr}.animation-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.animation-card-media{height:120px}}
  `;
  document.head.appendChild(style);

  const nav = document.querySelector(".sidebar .nav");
  const main = document.querySelector(".main");
  const eveMeta = document.querySelector(".eve-meta");
  if (!nav || !main) return;

  const navButton = document.createElement("button");
  navButton.type = "button";
  navButton.dataset.view = "animation-library";
  navButton.innerHTML = '<span class="ico">▦</span>Libreria animazioni';
  nav.appendChild(navButton);

  const shortcut = document.createElement("button");
  shortcut.type = "button";
  shortcut.id = "openAnimationLibraryBtn";
  shortcut.className = "btn eve-library-shortcut";
  shortcut.textContent = "Vedi tutte le 64 animazioni";
  eveMeta?.appendChild(shortcut);

  const section = document.createElement("section");
  section.id = "animation-library";
  section.className = "view";
  section.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Pacchetto completo Eve Animation Library 1.2.6</h3><p>64 WebP ufficiali. Le schede usano poster statici per non rallentare l'interfaccia.</p></div>
          <div class="animation-library-summary"><span class="pill">64 asset HQ</span><span class="tag">prestazioni ottimizzate</span></div>
        </div>
        <div class="panel-body">
          <div class="animation-library-toolbar">
            <input id="animationLibrarySearch" type="search" placeholder="Cerca un'animazione…" aria-label="Cerca animazione">
            <select id="animationLibraryPriority" aria-label="Filtra per priorità"><option value="">Tutte le priorità</option></select>
            <select id="animationLibraryCategory" aria-label="Filtra per categoria"><option value="">Tutte le categorie</option></select>
            <select id="animationLibraryVariant" aria-label="Filtra per variante"><option value="">Tutte le varianti</option></select>
          </div>
          <div class="animation-library-preview">
            <div class="animation-library-preview-stage"><img id="animationLibraryPreviewImage" alt="Anteprima animazione Eve" decoding="async"></div>
            <div class="animation-library-preview-meta">
              <span class="tag" id="animationLibraryPreviewPriority">P0</span>
              <h3 id="animationLibraryPreviewTitle">Eve Idle Soft</h3>
              <p id="animationLibraryPreviewDescription"></p>
              <div class="code" id="animationLibraryPreviewTechnical"></div>
              <button class="btn primary" id="animationLibraryPlayOnEve" type="button" style="margin-top:12px">Riproduci su Eve</button>
            </div>
          </div>
          <div class="animation-library-summary" style="margin-top:18px"><strong id="animationLibraryCount">64 animazioni</strong><span class="muted">Clicca una scheda per animare soltanto l'anteprima grande.</span></div>
          <div class="animation-library-grid" id="animationLibraryGrid"></div>
        </div>
      </section>
    </div>`;
  main.appendChild(section);

  const search = section.querySelector("#animationLibrarySearch");
  const priorityFilter = section.querySelector("#animationLibraryPriority");
  const categoryFilter = section.querySelector("#animationLibraryCategory");
  const variantFilter = section.querySelector("#animationLibraryVariant");
  const grid = section.querySelector("#animationLibraryGrid");
  const count = section.querySelector("#animationLibraryCount");
  const previewImage = section.querySelector("#animationLibraryPreviewImage");
  const previewStage = section.querySelector(".animation-library-preview-stage");
  const previewTitle = section.querySelector("#animationLibraryPreviewTitle");
  const previewDescription = section.querySelector("#animationLibraryPreviewDescription");
  const previewTechnical = section.querySelector("#animationLibraryPreviewTechnical");
  const previewPriority = section.querySelector("#animationLibraryPreviewPriority");
  const playButton = section.querySelector("#animationLibraryPlayOnEve");

  let assets = [];
  let selected = null;
  let cardImageObserver = null;
  let initializationPromise = null;
  let previewIsVisible = true;

  function sectionIsActive() {
    return section.classList.contains("active") && !document.hidden;
  }

  function syncPreviewPlayback() {
    if (!selected) return;
    const shouldAnimate = sectionIsActive() && previewIsVisible;
    const source = animationUrl(selected);
    if (shouldAnimate) {
      if (previewImage.getAttribute("src") !== source) previewImage.src = source;
      previewImage.dataset.graphicsPlayback = "running";
    } else {
      if (previewImage.hasAttribute("src")) previewImage.removeAttribute("src");
      previewImage.dataset.graphicsPlayback = "paused";
    }
  }

  if (typeof IntersectionObserver === "function") {
    new IntersectionObserver(entries => {
      previewIsVisible = Boolean(entries[0]?.isIntersecting);
      syncPreviewPlayback();
    }, { rootMargin: "80px", threshold: 0.01 }).observe(previewStage);
  }

  new MutationObserver(() => {
    if (section.classList.contains("active")) library.pause?.();
    else library.resume?.();
    syncPreviewPlayback();
  }).observe(section, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", syncPreviewPlayback, { passive: true });

  function observeCardImages() {
    const images = grid.querySelectorAll(".animation-card-media img[data-poster-src]");
    cardImageObserver?.disconnect();
    if (typeof IntersectionObserver !== "function") {
      images.forEach(image => { image.src = image.dataset.posterSrc; });
      return;
    }
    cardImageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const image = entry.target;
        if (entry.isIntersecting) {
          if (!image.hasAttribute("src")) image.src = image.dataset.posterSrc;
        } else if (image.hasAttribute("src")) {
          image.removeAttribute("src");
        }
      });
    }, { rootMargin: "100px 0px", threshold: 0.01 });
    images.forEach(image => cardImageObserver.observe(image));
  }

  function openLibrary() {
    document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view === section));
    document.querySelectorAll(".sidebar .nav button").forEach(button => button.classList.toggle("active", button === navButton));
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Libreria animazioni";
    if (subtitle) subtitle.textContent = "Esplora i 64 stati ufficiali senza riprodurli tutti contemporaneamente.";
    library.pause?.();
    window.scrollTo({ top: 0, behavior: "auto" });
    initializeLibrary().then(() => {
      requestAnimationFrame(() => {
        observeCardImages();
        syncPreviewPlayback();
      });
    }).catch(console.error);
  }

  function selectAsset(asset) {
    selected = asset;
    previewImage.width = asset.width;
    previewImage.height = asset.height;
    previewTitle.textContent = humanize(asset.id);
    previewPriority.textContent = `${asset.priority} · ${asset.variant}`;
    previewDescription.textContent = `${humanize(asset.category)} · ${asset.loop ? "loop" : "una sola riproduzione"} · ${asset.frames} frame`;
    previewTechnical.textContent = [
      `ID: ${asset.id}`,
      `Risoluzione runtime: ${asset.width} × ${asset.height}px`,
      `Durata: ${asset.durationMs} ms · FPS: ${asset.fps}`,
      `SHA-256: ${asset.sha256}`
    ].join("\n");
    grid.querySelectorAll(".animation-card").forEach(card => card.classList.toggle("active", card.dataset.assetId === asset.id));
    previewImage.removeAttribute("src");
    requestAnimationFrame(syncPreviewPlayback);
  }

  function render() {
    const term = search.value.trim().toLowerCase();
    const visible = assets.filter(asset => {
      const matchesText = !term || [asset.id, asset.category, asset.priority, asset.variant].join(" ").toLowerCase().includes(term);
      return matchesText && (!priorityFilter.value || asset.priority === priorityFilter.value)
        && (!categoryFilter.value || asset.category === categoryFilter.value)
        && (!variantFilter.value || asset.variant === variantFilter.value);
    });
    count.textContent = `${visible.length} ${visible.length === 1 ? "animazione" : "animazioni"}`;
    grid.innerHTML = visible.length ? visible.map(asset => `
      <article class="animation-card${selected?.id === asset.id ? " active" : ""}" data-asset-id="${escapeHtml(asset.id)}">
        <button type="button" class="animation-card-select" aria-label="Mostra anteprima ${escapeHtml(humanize(asset.id))}">
          <span class="animation-card-media"><img data-poster-src="${posterUrl(asset)}" loading="lazy" decoding="async" alt="${escapeHtml(humanize(asset.id))}"></span>
          <strong>${escapeHtml(humanize(asset.id))}</strong>
          <small>${escapeHtml(asset.priority)} · ${escapeHtml(asset.variant)} · ${asset.width}px</small>
        </button>
        <button type="button" class="animation-card-play" aria-label="Riproduci ${escapeHtml(humanize(asset.id))} su Eve">▶ Riproduci su Eve</button>
      </article>`).join("") : '<div class="animation-library-empty">Nessuna animazione corrisponde ai filtri.</div>';
    grid.querySelectorAll(".animation-card-select").forEach(button => button.addEventListener("click", () => {
      const card = button.closest(".animation-card");
      const asset = assets.find(item => item.id === card.dataset.assetId);
      if (asset) selectAsset(asset);
    }));
    grid.querySelectorAll(".animation-card-play").forEach(button => button.addEventListener("click", async () => {
      const card = button.closest(".animation-card");
      const asset = assets.find(item => item.id === card.dataset.assetId);
      if (!asset) return;
      selectAsset(asset);
      await playAssetOnEve(asset);
    }));
    observeCardImages();
  }

  function fillFilter(select, values) {
    values.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = humanize(value);
      select.appendChild(option);
    });
  }

  navButton.addEventListener("click", openLibrary);
  shortcut.addEventListener("click", openLibrary);
  async function playAssetOnEve(asset) {
    library.resume?.();
    await library.setState(asset.id, { restart: true }).catch(console.error);
  }

  playButton.addEventListener("click", async () => {
    if (selected) await playAssetOnEve(selected);
  });
  [search, priorityFilter, categoryFilter, variantFilter].forEach(control => control.addEventListener("input", render));

  function initializeLibrary() {
    if (initializationPromise) return initializationPromise;
    initializationPromise = library.getManifest().then(manifest => {
      assets = Object.values(manifest.assets).sort((a, b) =>
        a.priority.localeCompare(b.priority) || a.variant.localeCompare(b.variant) || a.id.localeCompare(b.id)
      );
      fillFilter(priorityFilter, [...new Set(assets.map(asset => asset.priority))]);
      fillFilter(categoryFilter, [...new Set(assets.map(asset => asset.category))].sort());
      fillFilter(variantFilter, [...new Set(assets.map(asset => asset.variant))].sort());
      selectAsset(assets.find(asset => asset.id === manifest.defaultState) || assets[0]);
      render();
    }).catch(error => {
      initializationPromise = null;
      grid.innerHTML = `<div class="animation-library-empty">${escapeHtml(error.message)}</div>`;
      throw error;
    });
    return initializationPromise;
  }
})();

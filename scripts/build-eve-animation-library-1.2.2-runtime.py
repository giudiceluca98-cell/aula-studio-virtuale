#!/usr/bin/env python3
"""Build the self-contained Eve Animation Library 1.2.2 canonical demo runtime."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
from pathlib import Path


LIBRARY_VERSION = "1.2.2"
BASE_VERSION = "1.4.0-alpha.1"
FINAL_VERSION = "1.4.0-alpha.1-eve.1"
EXPECTED_BASE_SHA256 = "85ad819914cf85740b0013f0d3147adaa2ff7b233f99935ba67f4fb77fefe95c"
STYLE_START = "<!-- EVE_ANIMATION_LIBRARY_1_2_2_STYLE_START -->"
STYLE_END = "<!-- EVE_ANIMATION_LIBRARY_1_2_2_STYLE_END -->"
RUNTIME_START = "<!-- EVE_ANIMATION_LIBRARY_1_2_2_RUNTIME_START -->"
RUNTIME_END = "<!-- EVE_ANIMATION_LIBRARY_1_2_2_RUNTIME_END -->"
EXPECTED_GROUPS = {"P0": 12, "P1": 21, "P2": 20, "compact": 8, "hero": 3}


CSS = r"""
  <style data-eve-animation-library="1.2.2">
    .eve-animation-stage {
      display: grid;
      grid-template-columns: minmax(132px, 42%) minmax(0, 1fr);
      gap: 14px;
      align-items: center;
      margin: 14px 0;
      padding: 14px;
      border: 1px solid rgba(125, 235, 255, .2);
      border-radius: 18px;
      background:
        radial-gradient(circle at 24% 25%, rgba(0, 223, 242, .15), transparent 46%),
        linear-gradient(145deg, rgba(8, 21, 35, .9), rgba(18, 13, 38, .9));
      box-shadow: inset 0 0 45px rgba(100, 220, 255, .045);
      overflow: hidden;
    }
    .eve-assistant-card.is-panel-collapsed .eve-animation-stage { display: none; }
    .eve-animation-visual {
      min-height: 156px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(125, 235, 255, .13);
      border-radius: 15px;
      background: radial-gradient(circle, rgba(0, 223, 242, .09), transparent 68%);
    }
    .eve-animation-main {
      display: block;
      width: min(100%, 210px);
      aspect-ratio: 1;
      object-fit: contain;
      filter: drop-shadow(0 12px 24px rgba(0, 0, 0, .28));
    }
    .eve-animation-copy { min-width: 0; }
    .eve-animation-copy h3 { margin: 7px 0 5px; font-size: 14px; line-height: 1.2; }
    .eve-animation-copy p { margin: 0; color: var(--muted); font-size: 9px; line-height: 1.55; }
    .eve-animation-badge {
      display: inline-flex;
      align-items: center;
      min-height: 23px;
      padding: 0 8px;
      border: 1px solid rgba(82, 232, 176, .25);
      border-radius: 999px;
      color: #bfffe8;
      background: rgba(82, 232, 176, .07);
      font-size: 7px;
      font-weight: 900;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .eve-animation-inspector-open {
      min-height: 34px;
      margin-top: 10px;
      padding: 0 11px;
      border: 1px solid rgba(125, 235, 255, .24);
      border-radius: 10px;
      color: var(--ink);
      background: rgba(0, 223, 242, .065);
      font-size: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    .eve-runtime-compact {
      display: block;
      width: 56px;
      height: 56px;
      object-fit: contain;
      filter: drop-shadow(0 7px 14px rgba(0, 0, 0, .28));
      pointer-events: none;
    }
    .eve-panel-toggle .eve-rest-mascot { display: none !important; }
    .eve-core-button > span { display: none !important; }
    .eve-runtime-floating {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
      filter: drop-shadow(0 8px 18px rgba(0, 0, 0, .32));
    }
    .eve-state-live {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    .eve-inspector[hidden] { display: none !important; }
    .eve-inspector {
      position: fixed;
      inset: 0;
      z-index: 10050;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(1, 7, 15, .78);
      backdrop-filter: blur(10px);
    }
    .eve-inspector-dialog {
      width: min(1120px, 100%);
      max-height: min(820px, calc(100vh - 36px));
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      overflow: hidden;
      border: 1px solid rgba(125, 235, 255, .26);
      border-radius: 22px;
      color: var(--ink);
      background: linear-gradient(150deg, rgba(6, 17, 29, .985), rgba(18, 12, 36, .985));
      box-shadow: 0 30px 90px rgba(0, 0, 0, .58);
    }
    .eve-inspector-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding: 18px 20px 12px;
    }
    .eve-inspector-head h2 { margin: 3px 0; font-size: 21px; }
    .eve-inspector-head p { margin: 0; color: var(--muted); font-size: 9px; }
    .eve-inspector-close {
      width: 38px;
      height: 38px;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--ink);
      background: rgba(255, 255, 255, .035);
      font-size: 21px;
      cursor: pointer;
    }
    .eve-inspector-tools {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding: 0 20px 14px;
      border-bottom: 1px solid rgba(125, 235, 255, .1);
    }
    .eve-inspector-search {
      min-height: 40px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--ink);
      background: rgba(255, 255, 255, .035);
      font: inherit;
    }
    .eve-inspector-filters { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
    .eve-inspector-filters button {
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255, 255, 255, .025);
      font-size: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    .eve-inspector-filters button[aria-pressed="true"] {
      color: #eaffff;
      border-color: rgba(0, 223, 242, .38);
      background: rgba(0, 223, 242, .11);
    }
    .eve-inspector-body {
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(260px, .8fr) minmax(360px, 1.2fr);
    }
    .eve-inspector-list-wrap {
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      border-right: 1px solid rgba(125, 235, 255, .1);
    }
    .eve-inspector-count { padding: 10px 14px; color: var(--muted); font-size: 8px; }
    .eve-inspector-list { min-height: 0; overflow: auto; padding: 0 10px 12px; }
    .eve-inspector-state {
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      margin: 3px 0;
      padding: 10px;
      border: 1px solid transparent;
      border-radius: 10px;
      color: var(--ink);
      background: rgba(255, 255, 255, .018);
      text-align: left;
      cursor: pointer;
    }
    .eve-inspector-state:hover,
    .eve-inspector-state[aria-selected="true"] { border-color: rgba(0, 223, 242, .28); background: rgba(0, 223, 242, .06); }
    .eve-inspector-state strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; font: 800 9px ui-monospace, SFMono-Regular, Menlo, monospace; }
    .eve-inspector-state span { color: var(--muted); font-size: 7px; text-transform: uppercase; }
    .eve-inspector-preview { min-height: 0; overflow: auto; padding: 18px; }
    .eve-inspector-preview-grid { display: grid; grid-template-columns: minmax(220px, 42%) minmax(0, 1fr); gap: 18px; align-items: start; }
    .eve-inspector-image-wrap {
      min-height: 260px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(125, 235, 255, .15);
      border-radius: 16px;
      background: radial-gradient(circle, rgba(0, 223, 242, .11), transparent 68%);
    }
    .eve-inspector-image { display: block; width: min(100%, 330px); aspect-ratio: 1; object-fit: contain; }
    .eve-inspector-meta h3 { margin: 3px 0 7px; font-size: 18px; overflow-wrap: anywhere; }
    .eve-inspector-meta p { color: var(--muted); font-size: 9px; line-height: 1.6; }
    .eve-inspector-meta dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin: 14px 0; }
    .eve-inspector-meta dl div { padding: 9px; border: 1px solid var(--line); border-radius: 9px; background: rgba(255, 255, 255, .02); }
    .eve-inspector-meta dt { color: var(--muted); font-size: 7px; text-transform: uppercase; }
    .eve-inspector-meta dd { margin: 3px 0 0; font-size: 9px; font-weight: 800; }
    .eve-inspector-actions { display: flex; flex-wrap: wrap; gap: 7px; }
    .eve-inspector-actions button {
      min-height: 37px;
      padding: 0 12px;
      border: 1px solid rgba(125, 235, 255, .22);
      border-radius: 10px;
      color: var(--ink);
      background: rgba(0, 223, 242, .06);
      font-size: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    .eve-animation-inspector-open:focus-visible,
    .eve-inspector button:focus-visible,
    .eve-inspector input:focus-visible {
      outline: 3px solid rgba(82, 232, 176, .8);
      outline-offset: 2px;
    }
    @media (max-width: 820px) {
      .eve-animation-stage { grid-template-columns: 120px minmax(0, 1fr); }
      .eve-inspector-tools { grid-template-columns: 1fr; }
      .eve-inspector-filters { justify-content: flex-start; }
      .eve-inspector-body { grid-template-columns: minmax(190px, .72fr) minmax(300px, 1.28fr); }
      .eve-inspector-preview-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 620px) {
      .primary-header,
      .secondary-nav,
      .page-scroll,
      .material-shell,
      .selected-material,
      .course-overview,
      .learning-layout,
      .lesson-sidebar,
      .reader-area,
      .tutor-column,
      .eve-assistant-card {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
      }
      .header-actions {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        box-sizing: border-box;
      }
      .eve-animation-stage { grid-template-columns: 1fr; }
      .eve-animation-visual { min-height: 170px; }
      .eve-inspector { padding: 0; place-items: stretch; }
      .eve-inspector-dialog { max-height: 100vh; border-radius: 0; }
      .eve-inspector-body { grid-template-columns: 1fr; grid-template-rows: minmax(150px, .65fr) minmax(260px, 1.35fr); }
      .eve-inspector-list-wrap { border-right: 0; border-bottom: 1px solid rgba(125, 235, 255, .1); }
      .eve-inspector-image-wrap { min-height: 210px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .eve-animation-main,
      .eve-runtime-compact,
      .eve-runtime-floating,
      .eve-inspector-image { animation: none !important; transition: none !important; }
    }
  </style>
"""


JS_TEMPLATE = r"""
  <script data-eve-animation-library="1.2.2">
  (() => {
    "use strict";

    const VERSION = "__LIBRARY_VERSION__";
    const DEMO_VERSION = "__FINAL_VERSION__";
    const STATIC_AVATAR = "__STATIC_DATA_URI__";
    const ASSETS = __REGISTRY_JSON__;
    const REGISTRY = new Map(ASSETS.map((asset) => [asset.id, Object.freeze(asset)]));
    const DEFAULT_STATE = "eve-idle-soft";
    const CONTEXT_STATES = Object.freeze({
      lesson: "eve-reading",
      exercises: "eve-explaining",
      quiz: "eve-quiz",
      project: "eve-action-running",
      glossary: "eve-memory-recall",
      corsi: "eve-searching",
      materiali: "eve-reading",
      checklist: "eve-progress",
      progressi: "eve-progress",
      appunti: "eve-memory-save",
      partecipanti: "eve-collaboration",
      attivita: "eve-moderating",
      audio: "eve-speaking-loop-a"
    });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dom = {};
    const preloadCache = new Map();
    let currentStateId = DEFAULT_STATE;
    let returnTimer = null;
    let inspectorFilter = "ALL";
    let inspectorSelectedId = DEFAULT_STATE;
    let previousFocus = null;
    let forcedReducedMotion = false;

    function publicAsset(asset) {
      const { dataUri, ...metadata } = asset;
      return { ...metadata };
    }

    function motionIsReduced() {
      return reducedMotion.matches || forcedReducedMotion;
    }

    function visibleSource(asset) {
      return motionIsReduced() ? STATIC_AVATAR : asset.dataUri;
    }

    function assignSource(image, source, replay = false) {
      if (!image) return;
      if (!replay && image.getAttribute("src") === source) return;
      if (replay) image.removeAttribute("src");
      const apply = () => {
        image.src = source;
        image.dataset.eveSource = motionIsReduced() ? "static" : "animated";
      };
      if (replay) window.requestAnimationFrame(apply);
      else apply();
    }

    function updateMetadata(asset, context = {}) {
      if (dom.stateName) dom.stateName.textContent = asset.name;
      if (dom.stateDescription) dom.stateDescription.textContent = context.description || asset.description;
      if (dom.mainImage) dom.mainImage.alt = `Eve animata: ${asset.name}`;
      if (dom.panelToggle) dom.panelToggle.setAttribute("aria-label", `Eve: ${asset.name}. Apri o chiudi il pannello`);
      document.documentElement.dataset.eveState = asset.id;
      document.documentElement.dataset.eveMotion = motionIsReduced() ? "reduced" : "animated";
      if (dom.live && context.announce !== false) {
        dom.live.textContent = `Stato di Eve: ${asset.name}. ${context.description || asset.description}`;
      }
    }

    function setState(id, context = {}) {
      const asset = REGISTRY.get(id);
      if (!asset) throw new Error(`Stato Eve sconosciuto: ${id}`);
      if (returnTimer) {
        window.clearTimeout(returnTimer);
        returnTimer = null;
      }
      currentStateId = id;
      const source = visibleSource(asset);
      const replay = context.replay === true;
      assignSource(dom.mainImage, source, replay);
      const compactId = `${id}-compact`;
      const compactAsset = REGISTRY.get(compactId) || (asset.category === "compact" ? asset : REGISTRY.get("eve-idle-soft-compact"));
      assignSource(dom.compactImage, visibleSource(compactAsset), replay);
      assignSource(dom.floatingImage, visibleSource(compactAsset), replay);
      if (dom.inspector && !dom.inspector.hidden && inspectorSelectedId === id) {
        assignSource(dom.previewImage, source, replay);
      }
      updateMetadata(asset, context);
      syncInspectorSelection();
      if (!asset.loop && context.autoReturn !== false) {
        const delay = Number(context.returnAfter || asset.durationMs || 1500) + 120;
        returnTimer = window.setTimeout(() => {
          setState(context.returnTo || DEFAULT_STATE, { announce: false, replay: true, autoReturn: false });
        }, delay);
      }
      return publicAsset(asset);
    }

    function replay(id = currentStateId) {
      return setState(id, { replay: true, autoReturn: false, announce: true });
    }

    function filterStates(filter = "ALL", query = "") {
      const normalizedFilter = String(filter || "ALL");
      const normalizedQuery = String(query || "").trim().toLocaleLowerCase("it");
      return ASSETS.filter((asset) => {
        const groupMatches = normalizedFilter === "ALL" || asset.group === normalizedFilter;
        const queryMatches = !normalizedQuery || `${asset.id} ${asset.name} ${asset.description}`.toLocaleLowerCase("it").includes(normalizedQuery);
        return groupMatches && queryMatches;
      }).map(publicAsset);
    }

    function preload(ids) {
      const queue = [...new Set(ids)].filter((id) => REGISTRY.has(id) && !preloadCache.has(id));
      const next = () => {
        const id = queue.shift();
        if (!id) return;
        const image = new Image();
        preloadCache.set(id, image);
        image.onload = image.onerror = () => {
          if (queue.length) window.setTimeout(next, 45);
        };
        image.src = visibleSource(REGISTRY.get(id));
      };
      next();
      return queue.length;
    }

    function createElement(tag, className, attributes = {}) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === "text") element.textContent = value;
        else element.setAttribute(key, value);
      });
      return element;
    }

    function mountPanelVisuals() {
      const card = document.getElementById("eveAssistantCard");
      const identity = card?.querySelector(".eve-identity");
      if (!card || !identity) return;
      const stage = createElement("section", "eve-animation-stage", { id: "eveAnimationStage", "aria-labelledby": "eveAnimationStateName" });
      const visual = createElement("div", "eve-animation-visual");
      dom.mainImage = createElement("img", "eve-animation-main", { id: "eveAnimationMain", alt: "Eve animata", width: "512", height: "512", decoding: "async" });
      dom.mainImage.addEventListener("error", () => assignSource(dom.mainImage, STATIC_AVATAR));
      visual.appendChild(dom.mainImage);
      const copy = createElement("div", "eve-animation-copy");
      copy.appendChild(createElement("span", "eve-animation-badge", { text: "Eve Animation Library 1.2.2" }));
      dom.stateName = createElement("h3", "", { id: "eveAnimationStateName", text: "Eve pronta" });
      dom.stateDescription = createElement("p", "", { id: "eveAnimationStateDescription", text: "Caricamento dello stato visivo ufficiale." });
      const open = createElement("button", "eve-animation-inspector-open", { id: "eveInspectorOpen", type: "button", text: "Animazioni Eve 1.2.2", "aria-haspopup": "dialog", "aria-controls": "eveAnimationInspector" });
      open.addEventListener("click", openInspector);
      copy.append(dom.stateName, dom.stateDescription, open);
      stage.append(visual, copy);
      identity.insertAdjacentElement("afterend", stage);
      dom.live = createElement("div", "eve-state-live", { id: "eveAnimationLive", "aria-live": "polite", "aria-atomic": "true" });
      card.appendChild(dom.live);

      dom.panelToggle = document.getElementById("evePanelToggle");
      if (dom.panelToggle) {
        dom.compactImage = createElement("img", "eve-runtime-compact", { id: "eveAnimationCompact", alt: "", width: "256", height: "256", "aria-hidden": "true", decoding: "async" });
        dom.panelToggle.appendChild(dom.compactImage);
      }
      const coreButton = document.querySelector("#eveAssistant .eve-core-button");
      if (coreButton) {
        dom.floatingImage = createElement("img", "eve-runtime-floating", { id: "eveAnimationFloating", alt: "", width: "256", height: "256", "aria-hidden": "true", decoding: "async" });
        coreButton.appendChild(dom.floatingImage);
      }
    }

    function mountInspector() {
      dom.inspector = createElement("div", "eve-inspector", { id: "eveAnimationInspector", role: "dialog", "aria-modal": "true", "aria-labelledby": "eveInspectorTitle" });
      dom.inspector.hidden = true;
      dom.inspector.innerHTML = `
        <section class="eve-inspector-dialog">
          <header class="eve-inspector-head">
            <div><span class="eve-animation-badge">64 asset ufficiali · 1.2.2</span><h2 id="eveInspectorTitle">Eve Animation Inspector</h2><p>Ricerca, filtra, riproduci e verifica gli stati incorporati nella demo canonica.</p></div>
            <button class="eve-inspector-close" id="eveInspectorClose" type="button" aria-label="Chiudi inspector">×</button>
          </header>
          <div class="eve-inspector-tools">
            <input class="eve-inspector-search" id="eveInspectorSearch" type="search" placeholder="Cerca per ID o descrizione" aria-label="Cerca animazioni Eve">
            <div class="eve-inspector-filters" role="group" aria-label="Filtra animazioni Eve">
              ${["ALL", "P0", "P1", "P2", "compact", "hero"].map((value) => `<button type="button" data-eve-filter="${value}" aria-pressed="${value === "ALL"}">${value === "ALL" ? "Tutte" : value}</button>`).join("")}
            </div>
          </div>
          <div class="eve-inspector-body">
            <section class="eve-inspector-list-wrap" aria-label="Elenco animazioni">
              <div class="eve-inspector-count" id="eveInspectorCount">64 stati</div>
              <div class="eve-inspector-list" id="eveInspectorList" role="listbox" aria-label="Stati Eve"></div>
            </section>
            <section class="eve-inspector-preview" aria-live="polite">
              <div class="eve-inspector-preview-grid">
                <div class="eve-inspector-image-wrap"><img class="eve-inspector-image" id="eveInspectorImage" alt="Anteprima animazione Eve" width="512" height="512" decoding="async"></div>
                <div class="eve-inspector-meta">
                  <span class="eve-animation-badge" id="eveInspectorGroup">P0</span>
                  <h3 id="eveInspectorStateId">eve-idle-soft</h3>
                  <p id="eveInspectorDescription"></p>
                  <dl id="eveInspectorDetails"></dl>
                  <div class="eve-inspector-actions"><button type="button" id="eveInspectorReplay">Replay</button><button type="button" id="eveInspectorIdle">Ritorna a idle</button><button type="button" id="eveInspectorMotion" aria-pressed="false">Fallback statico</button></div>
                </div>
              </div>
            </section>
          </div>
        </section>`;
      document.body.appendChild(dom.inspector);
      dom.search = document.getElementById("eveInspectorSearch");
      dom.list = document.getElementById("eveInspectorList");
      dom.count = document.getElementById("eveInspectorCount");
      dom.previewImage = document.getElementById("eveInspectorImage");
      dom.previewImage.addEventListener("error", () => assignSource(dom.previewImage, STATIC_AVATAR));
      document.getElementById("eveInspectorClose").addEventListener("click", closeInspector);
      document.getElementById("eveInspectorReplay").addEventListener("click", () => replay(inspectorSelectedId));
      document.getElementById("eveInspectorIdle").addEventListener("click", () => selectInspectorState(DEFAULT_STATE));
      document.getElementById("eveInspectorMotion").addEventListener("click", toggleReducedMotionPreview);
      dom.search.addEventListener("input", renderInspectorList);
      dom.inspector.querySelector(".eve-inspector-filters").addEventListener("click", (event) => {
        const button = event.target.closest("[data-eve-filter]");
        if (!button) return;
        inspectorFilter = button.dataset.eveFilter;
        dom.inspector.querySelectorAll("[data-eve-filter]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
        renderInspectorList();
      });
      dom.list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-eve-state-id]");
        if (button) selectInspectorState(button.dataset.eveStateId);
      });
      dom.inspector.addEventListener("click", (event) => {
        if (event.target === dom.inspector) closeInspector();
      });
    }

    function renderInspectorList() {
      const states = filterStates(inspectorFilter, dom.search?.value || "");
      dom.count.textContent = `${states.length} ${states.length === 1 ? "stato" : "stati"}`;
      dom.list.replaceChildren(...states.map((asset) => {
        const button = createElement("button", "eve-inspector-state", { type: "button", role: "option", "data-eve-state-id": asset.id, "aria-selected": String(asset.id === inspectorSelectedId) });
        button.append(createElement("strong", "", { text: asset.id }), createElement("span", "", { text: asset.group }));
        return button;
      }));
    }

    function syncInspectorSelection() {
      if (!dom.list) return;
      dom.list.querySelectorAll("[data-eve-state-id]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.eveStateId === inspectorSelectedId)));
    }

    function selectInspectorState(id) {
      const asset = REGISTRY.get(id);
      if (!asset) return;
      inspectorSelectedId = id;
      document.getElementById("eveInspectorGroup").textContent = asset.group;
      document.getElementById("eveInspectorStateId").textContent = asset.id;
      document.getElementById("eveInspectorDescription").textContent = asset.description;
      const details = [
        ["FPS", asset.fps], ["Frame", asset.frameCount], ["Durata", `${asset.durationMs} ms`], ["Loop", asset.loop ? "Sì" : "No"],
        ["Risoluzione", `${asset.width} × ${asset.height}`], ["Priorità", asset.priority], ["Categoria", asset.category], ["Versione", VERSION]
      ];
      const dl = document.getElementById("eveInspectorDetails");
      dl.replaceChildren(...details.map(([term, value]) => {
        const row = createElement("div");
        row.append(createElement("dt", "", { text: term }), createElement("dd", "", { text: String(value) }));
        return row;
      }));
      setState(id, { replay: true, autoReturn: false, description: `Anteprima inspector · ${asset.description}` });
      assignSource(dom.previewImage, visibleSource(asset), true);
      syncInspectorSelection();
    }

    function openInspector() {
      previousFocus = document.activeElement;
      dom.inspector.hidden = false;
      document.body.classList.add("eve-inspector-open");
      inspectorSelectedId = currentStateId;
      renderInspectorList();
      selectInspectorState(inspectorSelectedId);
      window.setTimeout(() => dom.search.focus(), 0);
    }

    function closeInspector() {
      if (!dom.inspector || dom.inspector.hidden) return;
      dom.inspector.hidden = true;
      document.body.classList.remove("eve-inspector-open");
      previousFocus?.focus?.();
      previousFocus = null;
    }

    function toggleReducedMotionPreview() {
      forcedReducedMotion = !forcedReducedMotion;
      const button = document.getElementById("eveInspectorMotion");
      button?.setAttribute("aria-pressed", String(forcedReducedMotion));
      if (button) button.textContent = forcedReducedMotion ? "Fallback statico attivo" : "Fallback statico";
      refreshForMotionPreference();
    }

    function setEveAppState(stateId, context = {}) {
      return setState(stateId, { replay: context.replay !== false, ...context });
    }

    function wrapFunction(name, hooks = {}) {
      const original = window[name];
      if (typeof original !== "function" || original.__eveAnimationWrapped) return;
      const wrapped = function(...args) {
        hooks.before?.(args);
        let result;
        try {
          result = original.apply(this, args);
        } catch (error) {
          hooks.error?.(error, args);
          throw error;
        }
        if (result && typeof result.then === "function") {
          return result.then((value) => { hooks.after?.(value, args); return value; }, (error) => { hooks.error?.(error, args); throw error; });
        }
        hooks.after?.(result, args);
        return result;
      };
      wrapped.__eveAnimationWrapped = true;
      window[name] = wrapped;
    }

    function installAppHooks() {
      wrapFunction("setEveContext", { after: (_value, args) => {
        if (document.getElementById("eveAssistant")?.classList.contains("eve-speaking")) return;
        const contextKey = String(args[0] || "");
        const stateId = CONTEXT_STATES[contextKey] || (contextKey.startsWith("material") ? "eve-reading" : DEFAULT_STATE);
        setEveAppState(stateId, { autoReturn: false, announce: false });
      }});
      wrapFunction("toggleEvePanel", { after: () => setEveAppState(document.getElementById("eveAssistantCard")?.classList.contains("is-panel-collapsed") ? DEFAULT_STATE : "eve-wake") });
      wrapFunction("openEvePanelFromMascot", { before: () => setEveAppState("eve-wake") });
      wrapFunction("toggleEveAssistant", { before: () => setEveAppState("eve-wake") });
      wrapFunction("askEveContextualHelp", { before: () => setEveAppState("eve-explaining") });
      wrapFunction("sendChatMessage", { before: () => setEveAppState("eve-thinking-loop", { autoReturn: false }), after: () => setEveAppState("eve-success", { description: "Messaggio inviato nella conversazione attiva." }) });
      wrapFunction("sendChatAttachments", { before: () => setEveAppState("eve-uploading"), after: () => setEveAppState("eve-success", { description: "Allegato aggiunto alla conversazione." }) });
      wrapFunction("selectQuiz", { after: (_value, args) => setEveAppState(args[1] ? "eve-correct-answer" : "eve-incorrect-answer-support") });
      wrapFunction("giveExerciseHint", { before: () => setEveAppState("eve-hint") });
      wrapFunction("finishExercise", { before: () => setEveAppState("eve-action-running", { autoReturn: false }), after: () => setEveAppState("eve-goal-complete") });
      wrapFunction("saveNotes", { after: () => setEveAppState("eve-memory-save") });
      wrapFunction("toggleTimer", { after: () => setEveAppState(typeof state !== "undefined" && state.timerRunning ? "eve-focus-timer" : DEFAULT_STATE, { autoReturn: false }) });
      wrapFunction("submitProject", { before: () => setEveAppState("eve-publishing", { autoReturn: false }), after: () => setEveAppState(typeof state !== "undefined" && state.projectSubmitted ? "eve-published" : "eve-confirmation-needed") });
      wrapFunction("openDrawer", { after: (_value, args) => setEveAppState(CONTEXT_STATES[args[0]] || DEFAULT_STATE, { autoReturn: false }) });
      wrapFunction("aulaMaterialsPanelOpen", { before: () => setEveAppState("eve-reading", { autoReturn: false }) });
      wrapFunction("aulaTextOpen", { before: () => setEveAppState("eve-reading", { autoReturn: false }) });
      wrapFunction("aulaMaterialAddSubmit", { before: () => setEveAppState("eve-uploading", { autoReturn: false }), after: () => setEveAppState("eve-indexing") });
      wrapFunction("aulaMaterialImport", { before: () => setEveAppState("eve-uploading", { autoReturn: false }), after: () => setEveAppState("eve-indexing") });
      wrapFunction("aulaMaterialDiagnosticsOpen", { before: () => setEveAppState("eve-test-running", { autoReturn: false }), after: () => setEveAppState("eve-tests-passed") });
      wrapFunction("aulaMaterialRetry", { before: () => setEveAppState("eve-reconnecting", { autoReturn: false }), after: () => setEveAppState("eve-success") });
      wrapFunction("catalogDemoRender", { before: () => setEveAppState("eve-searching") });
      wrapFunction("catalogDemoImportPath", { before: () => setEveAppState("eve-rag-retrieval", { autoReturn: false }), after: () => setEveAppState("eve-source-citation") });
      wrapFunction("portalDashboardCreateRoom", { before: () => setEveAppState("eve-publishing", { autoReturn: false }), after: () => setEveAppState("eve-published"), error: () => setEveAppState("eve-error-supportive") });
      wrapFunction("portalDashboardJoinRoom", { before: () => setEveAppState("eve-reconnecting", { autoReturn: false }), after: () => setEveAppState("eve-welcome"), error: () => setEveAppState("eve-error-supportive") });
      wrapFunction("portalDashboardDeleteRoom", { before: () => setEveAppState("eve-rollback", { autoReturn: false }), after: () => setEveAppState("eve-success"), error: () => setEveAppState("eve-error-supportive") });
      wrapFunction("checklistToggle", { after: () => setEveAppState("eve-goal-complete") });
      wrapFunction("checklistSetStatus", { after: () => setEveAppState("eve-progress") });
      wrapFunction("checklistAdd", { after: () => setEveAppState("eve-version-created") });
      wrapFunction("checklistRemove", { before: () => setEveAppState("eve-rollback") });
      if (typeof window.aulaMaterialImportStart !== "function" && typeof window.aulaMaterialImport === "function") {
        window.aulaMaterialImportStart = window.aulaMaterialImport;
      }

      const chatInput = document.getElementById("chatInput");
      chatInput?.addEventListener("focus", () => setEveAppState("eve-listening", { autoReturn: false }));
      chatInput?.addEventListener("blur", () => { if (!chatInput.value.trim()) setEveAppState(DEFAULT_STATE, { autoReturn: false }); });
      chatInput?.addEventListener("input", () => setEveAppState(chatInput.value.trim() ? "eve-question" : "eve-listening"));

      window.addEventListener("offline", () => setEveAppState("eve-offline", { autoReturn: false }));
      window.addEventListener("online", () => setEveAppState("eve-reconnecting", { returnTo: DEFAULT_STATE }));
      document.addEventListener("visibilitychange", () => setEveAppState(document.hidden ? "eve-sleep" : "eve-wake", { autoReturn: !document.hidden }));

      const voiceStatus = document.getElementById("audioLessonStatus");
      const assistant = document.getElementById("eveAssistant");
      if (voiceStatus && assistant) {
        let lastSpeakingClass = assistant.classList.contains("eve-speaking");
        const syncVoiceState = () => {
          const text = voiceStatus.textContent.toLocaleLowerCase("it");
          const isSpeaking = assistant.classList.contains("eve-speaking") || text.includes("riproducendo l’anteprima");
          if (isSpeaking && !assistant.classList.contains("eve-paused")) {
            setEveAppState("eve-speaking-loop-a", { autoReturn: false, announce: false });
          } else if ((text.includes("browser") && text.includes("interrott")) || text.includes("non è riuscito") || text.includes("non e riuscito")) {
            setEveAppState("eve-error-supportive");
          } else if (text.includes("eve ha interrotto")) {
            setEveAppState(DEFAULT_STATE, { autoReturn: false });
          } else if (text.includes("completat") || text.includes("terminat") || text.includes("voce pronta")) {
            setEveAppState("eve-success");
          }
        };
        new MutationObserver(() => {
          const nextSpeakingClass = assistant.classList.contains("eve-speaking");
          if (nextSpeakingClass === lastSpeakingClass) return;
          lastSpeakingClass = nextSpeakingClass;
          syncVoiceState();
        }).observe(assistant, { attributes: true, attributeFilter: ["class"] });
        new MutationObserver(syncVoiceState).observe(voiceStatus, { childList: true, characterData: true, subtree: true });
      }
    }

    function handleKeyboard(event) {
      if (event.key === "Escape" && dom.inspector && !dom.inspector.hidden) {
        event.preventDefault();
        closeInspector();
        return;
      }
      if (event.key !== "Tab" || !dom.inspector || dom.inspector.hidden) return;
      const focusable = [...dom.inspector.querySelectorAll("button:not([disabled]), input:not([disabled])")].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    function refreshForMotionPreference() {
      setState(currentStateId, { replay: true, autoReturn: false, announce: false });
      if (dom.inspector && !dom.inspector.hidden) selectInspectorState(inspectorSelectedId);
    }

    function init() {
      mountPanelVisuals();
      mountInspector();
      installAppHooks();
      document.addEventListener("keydown", handleKeyboard);
      if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", refreshForMotionPreference);
      else reducedMotion.addListener(refreshForMotionPreference);
      window.AULA_DEMO_VERSION = DEMO_VERSION;
      window.AULA_EVE_INTEGRATION_VERSION = "eve.1";
      document.documentElement.dataset.aulaDemoVersion = DEMO_VERSION;
      setState(DEFAULT_STATE, { replay: true, autoReturn: false, announce: false });
      const p0 = ASSETS.filter((asset) => asset.group === "P0").map((asset) => asset.id);
      (window.requestIdleCallback || ((callback) => window.setTimeout(callback, 600)))(() => preload(p0));
    }

    window.setEveAppState = setEveAppState;
    window.openEveAnimationInspector = openInspector;
    window.closeEveAnimationInspector = closeInspector;
    window.EveAnimationRuntime = Object.freeze({
      version: VERSION,
      totalAssets: ASSETS.length,
      defaultState: DEFAULT_STATE,
      get currentState() { return currentStateId; },
      listStates: () => ASSETS.map(publicAsset),
      filterStates,
      setState,
      replay,
      toIdle: () => setState(DEFAULT_STATE, { replay: true, autoReturn: false }),
      preload,
      isReducedMotion: motionIsReduced
    });

    init();
  })();
  </script>
"""


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def data_uri(path: Path) -> str:
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/webp;base64,{payload}"


def strip_existing_integration(html: str) -> str:
    for start, end in ((STYLE_START, STYLE_END), (RUNTIME_START, RUNTIME_END)):
        html = re.sub(
            r"(?m)^[ \t]*" + re.escape(start) + r".*?" + re.escape(end) + r"\r?\n?",
            "",
            html,
            flags=re.DOTALL,
        )
    html = html.replace(f'<meta name="aula-demo-version" content="{FINAL_VERSION}" />', f'<meta name="aula-demo-version" content="{BASE_VERSION}" />')
    return html


def group_for(asset: dict) -> str:
    category = asset["category"]
    return {
        "conversation": "P0",
        "studio": "P1",
        "advanced": "P2",
        "compact": "compact",
        "hero": "hero",
    }[category]


def load_registry(library: Path) -> tuple[list[dict], dict]:
    manifest_path = library / "eve-animations-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("libraryVersion") != LIBRARY_VERSION:
        raise ValueError(f"Versione libreria inattesa: {manifest.get('libraryVersion')}")
    assets = manifest.get("assets", [])
    if manifest.get("totalAssets") != 64 or len(assets) != 64:
        raise ValueError("Il manifesto deve contenere esattamente 64 asset")
    ids = [asset.get("id") for asset in assets]
    if len(set(ids)) != 64:
        raise ValueError("Gli ID degli asset non sono univoci")

    counts = {key: 0 for key in EXPECTED_GROUPS}
    registry: list[dict] = []
    for asset in assets:
        group = group_for(asset)
        counts[group] += 1
        webp = library / asset["file"]
        animation_json = library / asset["animationJson"]
        if not webp.is_file() or webp.stat().st_size == 0:
            raise ValueError(f"WebP mancante o vuoto: {asset['file']}")
        if not animation_json.is_file():
            raise ValueError(f"animation.json mancante: {asset['animationJson']}")
        metadata = json.loads(animation_json.read_text(encoding="utf-8"))
        for key in ("id", "version", "fps", "frameCount", "durationMs", "loop", "width", "height"):
            expected = asset["version"] if key == "version" else asset[key]
            if metadata.get(key) != expected:
                raise ValueError(f"Mismatch {key} per {asset['id']}: {metadata.get(key)!r} != {expected!r}")
        registry.append({
            "id": asset["id"],
            "name": metadata.get("name") or asset["id"],
            "description": metadata.get("description") or asset["id"],
            "priority": asset["priority"],
            "category": asset["category"],
            "group": group,
            "fps": asset["fps"],
            "frameCount": asset["frameCount"],
            "durationMs": asset["durationMs"],
            "loop": asset["loop"],
            "width": asset["width"],
            "height": asset["height"],
            "dataUri": data_uri(webp),
        })
    if counts != EXPECTED_GROUPS:
        raise ValueError(f"Suddivisione asset inattesa: {counts}")
    return registry, {"manifest": manifest, "counts": counts}


def build(args: argparse.Namespace) -> dict:
    library = args.library.resolve()
    html_path = args.html.resolve()
    checkpoint_path = args.checkpoint.resolve()
    report_path = args.report.resolve()
    source_text = html_path.read_text(encoding="utf-8")
    base_text = strip_existing_integration(source_text)
    base_bytes = base_text.encode("utf-8")
    base_hash = sha256_bytes(base_bytes)
    if base_hash != EXPECTED_BASE_SHA256:
        raise ValueError(f"La base canonica non coincide con quella attesa: {base_hash}")

    registry, validation = load_registry(library)
    static_path = library / validation["manifest"]["avatarStatic256"]
    if not static_path.is_file() or static_path.stat().st_size == 0:
        raise ValueError("Avatar statico ufficiale mancante")
    registry_json = json.dumps(registry, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    runtime = (JS_TEMPLATE
        .replace("__LIBRARY_VERSION__", LIBRARY_VERSION)
        .replace("__FINAL_VERSION__", FINAL_VERSION)
        .replace("__STATIC_DATA_URI__", data_uri(static_path))
        .replace("__REGISTRY_JSON__", registry_json))

    output = base_text.replace(
        f'<meta name="aula-demo-version" content="{BASE_VERSION}" />',
        f'<meta name="aula-demo-version" content="{FINAL_VERSION}" />',
        1,
    )
    if "</head>" not in output or "</body>" not in output:
        raise ValueError("HTML canonico privo dei tag di chiusura richiesti")
    output = output.replace("</head>", f"  {STYLE_START}\n{CSS}  {STYLE_END}\n</head>", 1)
    output = output.replace("</body>", f"  {RUNTIME_START}\n{runtime}  <!-- AULA STUDIO VIRTUALE — CHECKPOINT AUTONOMO {FINAL_VERSION} -->\n  {RUNTIME_END}\n</body>", 1)
    output_bytes = output.encode("utf-8")

    for destination in (html_path, checkpoint_path):
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(destination.suffix + ".tmp")
        temporary.write_bytes(output_bytes)
        temporary.replace(destination)

    report = {
        "libraryVersion": LIBRARY_VERSION,
        "demoBaseVersion": BASE_VERSION,
        "demoFinalVersion": FINAL_VERSION,
        "baseSha256": base_hash,
        "finalSha256": sha256_bytes(output_bytes),
        "baseBytes": len(base_bytes),
        "finalBytes": len(output_bytes),
        "baseLines": len(base_text.splitlines()),
        "finalLines": len(output.splitlines()),
        "totalAssets": len(registry),
        "uniqueIds": len({asset["id"] for asset in registry}),
        "groups": validation["counts"],
        "embeddedWebpBytes": sum((library / asset["file"]).stat().st_size for asset in validation["manifest"]["assets"]),
        "staticAvatarBytes": static_path.stat().st_size,
        "checkpoint": checkpoint_path.as_posix(),
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--library", type=Path, required=True)
    parser.add_argument("--html", type=Path, default=Path("reference/demo-aula-studio-virtuale-canonica.html"))
    parser.add_argument("--checkpoint", type=Path, default=Path("reference/checkpoints/eve/demo-aula-studio-virtuale-1.4.0-alpha.1-eve.1.html"))
    parser.add_argument("--report", type=Path, default=Path("reference/checkpoints/eve/build-report-1.2.2.json"))
    return parser.parse_args()


if __name__ == "__main__":
    build(parse_args())

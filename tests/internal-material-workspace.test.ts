import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addWatchedInterval, isVideoCompleted, mergeWatchedRanges, shouldCountActiveTime, videoCompletionPercentage, watchedUniqueSeconds } from "@/lib/material-progress";
import { isSafePublicHttpsUrl, materialAccessPriority, resolveMaterialAccess, youtubeEmbedUrl } from "@/lib/material-access";
import { rankCatalogMaterials, interpretCatalogQuery } from "@/lib/catalog/search";
import type { CatalogMaterial, CatalogTopic } from "@/lib/catalog/types";

const root = process.cwd();
const room = readFileSync(join(root, "src/components/room/study-room.tsx"), "utf8");
const workspace = readFileSync(join(root, "src/components/room/material-workspace-viewer.tsx"), "utf8");
const contentRoute = readFileSync(join(root, "src/app/api/rooms/[roomId]/materials/[materialId]/content/route.ts"), "utf8");
const progressRoute = readFileSync(join(root, "src/app/api/rooms/[roomId]/materials/[materialId]/progress/route.ts"), "utf8");
const catalog = readFileSync(join(root, "src/components/catalog/catalog-explorer.tsx"), "utf8");
const reader = readFileSync(join(root, "src/components/reader/txt-document-reader.tsx"), "utf8");
const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
const migration = readFileSync(join(root, "supabase/migrations/0015_internal_material_workspace.sql"), "utf8").toLowerCase();

describe("adattatori dei materiali", () => {
  it("apre TXT, PDF, DOCX e PPTX caricati con viewer interni", () => {
    expect(resolveMaterialAccess({ title: "note.txt", storage_path: "r/u/note.txt" })).toMatchObject({ accessMode: "internal", internalViewer: "text", monitoringLevel: "full" });
    expect(resolveMaterialAccess({ title: "manuale.pdf", storage_path: "r/u/manuale.pdf", type: "pdf" })).toMatchObject({ accessMode: "internal", internalViewer: "pdf" });
    expect(resolveMaterialAccess({ title: "lezione.docx", storage_path: "r/u/lezione.docx" })).toMatchObject({ internalViewer: "document", importStatus: "ready" });
    expect(resolveMaterialAccess({ title: "slide.pptx", storage_path: "r/u/slide.pptx" })).toMatchObject({ internalViewer: "presentation", importStatus: "ready" });
  });

  it("riconosce video YouTube, playlist, Vimeo e file HTML5", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=M7lc1UVf-VE")).toContain("youtube-nocookie.com/embed/M7lc1UVf-VE");
    expect(youtubeEmbedUrl("https://www.youtube.com/playlist?list=PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V")).toContain("videoseries");
    expect(resolveMaterialAccess({ title: "Video", url: "https://vimeo.com/76979871", material_type: "video" })).toMatchObject({ internalViewer: "video", provider: "vimeo" });
    expect(resolveMaterialAccess({ title: "Video", url: "https://media.example.edu/lesson.mp4" })).toMatchObject({ internalViewer: "video", provider: "html5-video" });
  });

  it("non importa o incorpora URL privati e classifica le pagine generiche con prudenza", () => {
    for (const url of ["http://example.org/a", "https://localhost/a", "https://127.0.0.1/a", "https://10.1.2.3/a", "https://192.168.1.1/a"]) expect(isSafePublicHttpsUrl(url)).toBe(false);
    expect(resolveMaterialAccess({ title: "Corso", url: "https://example.edu/course" })).toMatchObject({ accessMode: "import-required", monitoringLevel: "none", internalViewer: "web-article" });
    expect(resolveMaterialAccess({ title: "Manuale.pdf", url: "https://example.edu/manuale.pdf", type: "pdf" })).toMatchObject({ accessMode: "import-required", importStatus: "pending" });
    expect(youtubeEmbedUrl("https://evilyoutube.com/watch?v=M7lc1UVf-VE")).toBeNull();
  });
});

describe("monitoraggio reale", () => {
  it("unisce intervalli riprodotti senza contare due volte le sovrapposizioni", () => {
    const merged = mergeWatchedRanges([{ start: 0, end: 10 }, { start: 5, end: 14 }, { start: 20, end: 24 }]);
    expect(merged).toEqual([{ start: 0, end: 14 }, { start: 20, end: 24 }]);
    expect(watchedUniqueSeconds(merged)).toBe(18);
  });

  it("un salto alla fine non completa il video", () => {
    let watched = addWatchedInterval([], 0, 4, 100);
    watched = addWatchedInterval(watched, 4, 98, 100);
    expect(videoCompletionPercentage(watched, 100)).toBe(4);
    expect(isVideoCompleted(watched, 100)).toBe(false);
  });

  it("completa solo dopo aver riprodotto almeno il 90% unico", () => {
    const watched = [{ start: 0, end: 91 }];
    expect(videoCompletionPercentage(watched, 100)).toBe(91);
    expect(isVideoCompleted(watched, 100)).toBe(true);
  });

  it("sospende il tempo se la pagina è nascosta o inattiva", () => {
    expect(shouldCountActiveTime(1_000, 61_001, true, false)).toBe(false);
    expect(shouldCountActiveTime(1_000, 2_000, false, true)).toBe(false);
    expect(shouldCountActiveTime(1_000, 100_000, true, true)).toBe(true);
    expect(workspace).toContain('content.kind === "video"');
    expect(workspace).toContain("visible && playingRef.current");
  });
});

describe("integrazione e sicurezza", () => {
  it("usa il workspace come apertura predefinita e mantiene l'esterno solo nel messaggio di incompatibilità", () => {
    expect(room).toContain("<MaterialWorkspaceViewer");
    expect(room).not.toContain("function openSafely");
    expect(room).toContain("Studia nel workspace");
    expect(workspace).toContain("Monitoraggio completo non disponibile");
    expect(workspace).toContain("isTrackableContent(content)");
    expect(workspace).toContain('target="_blank"');
    expect(catalog).not.toContain('<a href={material.source_url} target="_blank" rel="noreferrer" className="button-secondary flex-1');
  });

  it("riusa il lettore TXT e preserva salvataggio periodico, visibilità e pagehide", () => {
    expect(workspace).toContain('content.kind === "text"');
    expect(reader).toContain('window.setInterval(() => void saveProgress(), 8_000)');
    expect(reader).toContain('document.addEventListener("visibilitychange"');
    expect(reader).toContain('window.addEventListener("pagehide"');
  });

  it("converte Office sul server senza eseguire macro o HTML attivo", () => {
    expect(contentRoute).toContain("mammoth.extractRawText");
    expect(contentRoute).toContain("JSZip.loadAsync");
    expect(contentRoute).not.toContain("convertToHtml");
    expect(contentRoute).not.toContain("eval(");
  });

  it("non accetta userId, URL o percorsi Storage nella route di avanzamento", () => {
    expect(progressRoute).toContain("supabase.auth.getUser()");
    expect(progressRoute).toContain("isSameOriginRequest(request)");
    expect(progressRoute).not.toMatch(/userId\s*:/);
    expect(progressRoute).not.toMatch(/storagePath\s*:/);
    expect(progressRoute).not.toMatch(/sourceUrl\s*:/);
  });

  it("estende la tabella canonica e activity_events senza creare un secondo event store", () => {
    expect(migration).toContain("alter table public.material_reader_progress");
    expect(migration).toContain("insert into public.activity_events");
    expect(migration).not.toContain("create table public.material_learning_events");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("public.is_room_member(p_room_id)");
  });

  it("conserva posizione documento, timestamp, intervalli, esercizio e tempo attivo", () => {
    for (const field of ["page_number", "video_time_seconds", "watched_ranges", "watched_unique_seconds", "exercise_state", "active_seconds", "last_interaction_at"]) expect(migration).toContain(field);
    expect(workspace).toContain("navigator.sendBeacon");
    expect(workspace).toContain('window.addEventListener("online"');
    expect(contentRoute).toContain("PDFDocument.load");
  });

  it("consente soltanto i provider previsti nei frame e conserva il consenso per microfono e videocamera", () => {
    expect(nextConfig).toContain("https://www.youtube-nocookie.com");
    expect(nextConfig).toContain("https://player.vimeo.com");
    expect(nextConfig).not.toContain("frame-src 'none'");
    expect(nextConfig).toContain('camera=(self), microphone=(self)');
    expect(workspace).toContain("event.origin !== allowedOrigin");
    expect(workspace).toContain("initializeEmbeddedPlayer");
  });
});

describe("priorità Eve", () => {
  const topic: CatalogTopic = { id: "t", name: "Fisica", slug: "fisica", description: null, parent_id: null, topic_type: "subject", level: null, aliases: [], sort_order: 1 };
  const base: CatalogMaterial = { id: "a", title: "Fisica", description: "Corso di fisica", author: null, provider: "Fonte", source_url: "https://example.edu/fisica", material_type: "course", language: "it", level: "beginner", estimated_duration_minutes: 10, price_type: "free", price: null, currency: null, certificate_available: false, prerequisites: [], license_type: null, verification_status: "official_source", source_origin: "verified", verified_at: null, last_checked_at: null, viewer_compatibility: "external", access_requirements: [], topicLinks: [{ topic_id: "t", relevance_score: 1, is_primary: true }] };

  it("ordina il materiale pienamente monitorabile prima del link generico", () => {
    const internal = { ...base, id: "internal", source_url: "https://www.youtube.com/watch?v=M7lc1UVf-VE", material_type: "video", access_mode: "embedded" as const, monitoring_level: "full" as const, internal_viewer: "video" as const, import_status: "not-required" as const };
    const external = { ...base, id: "external", access_mode: "import-required" as const, monitoring_level: "none" as const, internal_viewer: "web-article" as const, import_status: "pending" as const };
    const interpretation = interpretCatalogQuery("fisica", [topic]);
    expect(materialAccessPriority(internal)).toBeGreaterThan(materialAccessPriority(external));
    expect(rankCatalogMaterials("fisica", interpretation, [topic], [external, internal])[0].id).toBe("internal");
  });
});

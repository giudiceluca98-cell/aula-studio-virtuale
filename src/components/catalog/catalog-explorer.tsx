"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, BookOpen, Bot, Check,
  ChevronDown, ChevronRight, Clock3, ExternalLink, Filter, GraduationCap,
  Languages, Loader2, Plus, Route, Search, ShieldCheck, Sparkles, X,
} from "lucide-react";
import type {
  CatalogFilters, CatalogInterpretation, CatalogMaterial, CatalogTopic,
  LearningPathDraft, RankedCatalogMaterial, WebResourceType,
} from "@/lib/catalog/types";

type Room = { id: string; name: string };
type Preferences = { allow_progress_personalization?: boolean };
type Bootstrap = {
  assistantName: string;
  topics: CatalogTopic[];
  materials: CatalogMaterial[];
  savedMaterialIds: string[];
  rooms: Room[];
  preferences: Preferences;
};

const levelLabels: Record<string, string> = {
  no_experience: "Da zero", beginner: "Base", intermediate: "Intermedio",
  advanced: "Avanzato", professional: "Professionale", university: "Universitario",
};
const formatLabels: Record<string, string> = {
  course: "Corso", documentation: "Documentazione", interactive: "Interattivo",
  video: "Video", book: "Libro", exercise: "Esercizi", article: "Articolo",
  pdf: "PDF", lecture: "Lezione", podcast: "Podcast", project: "Progetto",
  quiz: "Quiz", simulator: "Simulatore", material: "Materiale", checkpoint: "Verifica",
};
const resourceTypeLabels: Record<WebResourceType, string> = {
  page: "Pagina web",
  pdf: "PDF",
  document: "Documento",
  dataset: "Dataset",
  notebook: "Notebook",
  archive: "Archivio",
  file: "File",
  video: "Video",
  course: "Corso",
  book: "Libro",
  podcast: "Podcast",
};

type ManualMaterial = {
  title: string;
  url: string;
  description: string;
  provider: string;
  resourceType: WebResourceType;
  language: string;
};

const emptyManualMaterial: ManualMaterial = {
  title: "",
  url: "",
  description: "",
  provider: "",
  resourceType: "page",
  language: "it",
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "request_failed");
  return body;
}

function MaterialCard({ material, saved, selected, rooms, defaultRoomId, busy, onSave, onSelect, onImport, onOpen }: {
  material: RankedCatalogMaterial; saved: boolean; selected: boolean; rooms: Room[]; defaultRoomId: string;
  busy: string | null; onSave: () => void; onSelect: () => void; onImport: (roomId: string) => void; onOpen: (roomId: string) => void;
}) {
  const [roomId, setRoomId] = useState(defaultRoomId);
  return (
    <article className={`panel flex h-full flex-col p-5 transition ${selected ? "border-moss-400 ring-2 ring-moss-100" : "hover:-translate-y-0.5 hover:border-moss-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-moss-100 px-2.5 py-1 text-[0.65rem] font-bold text-moss-800">{formatLabels[material.material_type] ?? material.material_type}</span>
          <span className="rounded-full bg-[#f4e5d7] px-2.5 py-1 text-[0.65rem] font-bold text-[#8a542d]">{levelLabels[material.level] ?? material.level}</span>
          {material.price_type === "free" && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[0.65rem] font-bold text-sky-700">Gratuito</span>}
        </div>
        <button type="button" onClick={onSave} aria-label={saved ? "Rimuovi dai salvati" : "Salva materiale"} className="rounded-lg p-2 text-black/35 hover:bg-moss-50 hover:text-moss-700">
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-black/38">{material.provider}</p>
      <h3 className="mt-1 text-lg font-bold leading-snug">{material.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-black/52">{material.description}</p>
      <p className={`mt-3 rounded-xl px-3 py-2 text-[0.68rem] font-bold ${material.monitoring_level === "full" ? "bg-moss-50 text-moss-800" : material.monitoring_level === "partial" ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-800"}`}>{material.monitoring_level === "full" ? "Apribile e monitorabile nell’aula" : material.monitoring_level === "partial" ? "Apribile nell’aula · monitoraggio parziale" : material.access_mode === "import-required" ? "Richiede importazione o un file compatibile" : "Monitoraggio completo non disponibile"}</p>
      {material.recommendationReasons.length > 0 && <p className="mt-3 text-[0.7rem] leading-4 text-moss-700">Perché: {material.recommendationReasons.join(" · ")}</p>}
      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2 text-[0.68rem] text-black/40">
          <ShieldCheck size={14} className="text-moss-600" /> {material.verification_status === "pending" ? "Aggiunto da te · da verificare" : `Fonte ${material.verification_status === "official_source" ? "ufficiale" : "verificata"}`}
          <span>·</span><Languages size={13} /> {material.language.toUpperCase()}
          {material.estimated_duration_minutes && <><span>·</span><Clock3 size={13} /> {Math.ceil(material.estimated_duration_minutes / 60)} h</>}
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-xs font-semibold">
          <input type="checkbox" checked={selected} onChange={onSelect} className="rounded border-black/15 text-moss-700 focus:ring-moss-500" /> Usa nel percorso
        </label>
        <div className="mt-2 space-y-2">
          {rooms.length > 0 && <div className="flex gap-1">
            <select value={roomId} onChange={(event) => setRoomId(event.target.value)} aria-label="Stanza per il materiale" className="min-w-0 flex-1 rounded-xl border-black/10 bg-white px-2 text-[0.68rem]">
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
            <button type="button" onClick={() => onOpen(roomId)} disabled={busy === material.id} className="button-primary px-3 py-2 text-xs" aria-label="Studia nell’aula">{busy === material.id ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />} Studia nell’aula</button>
          </div>}
          <div className="flex gap-2"><button type="button" onClick={() => onImport(roomId)} disabled={!rooms.length || busy === material.id} className="button-secondary flex-1 px-3 py-2 text-xs"><Plus size={13} /> Aggiungi senza aprire</button>{material.access_mode && ["external-unmonitored","unsupported"].includes(material.access_mode) && <a href={material.source_url} target="_blank" rel="noreferrer" className="button-secondary px-3 py-2 text-xs" aria-label="Apri fonte esterna"><ExternalLink size={13} /></a>}</div>
        </div>
      </div>
    </article>
  );
}

export function CatalogExplorer({ preferredRoomId }: { preferredRoomId?: string }) {
  const router = useRouter();
  const [data, setData] = useState<Bootstrap | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CatalogFilters>({ verifiedOnly: false });
  const [results, setResults] = useState<RankedCatalogMaterial[]>([]);
  const [interpretation, setInterpretation] = useState<CatalogInterpretation | null>(null);
  const [roadmap, setRoadmap] = useState<LearningPathDraft | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pathOpen, setPathOpen] = useState(false);
  const [pathDraft, setPathDraft] = useState<LearningPathDraft | null>(null);
  const [pathId, setPathId] = useState<string | null>(null);
  const [pathLevel, setPathLevel] = useState("no_experience");
  const [targetLevel, setTargetLevel] = useState("intermediate");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [roomId, setRoomId] = useState("");
  const [personalization, setPersonalization] = useState(false);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [manualMaterial, setManualMaterial] = useState<ManualMaterial>(emptyManualMaterial);

  useEffect(() => {
    void api<Bootstrap>("/api/catalog/bootstrap").then((payload) => {
      setData(payload);
      setSavedIds(new Set(payload.savedMaterialIds));
      setResults(payload.materials.map((material) => ({ ...material, relevance: 0, recommendationReasons: [] })));
      setRoomId(payload.rooms.some((room) => room.id === preferredRoomId) ? preferredRoomId! : (payload.rooms[0]?.id ?? ""));
      setPersonalization(Boolean(payload.preferences?.allow_progress_personalization));
    }).catch(() => setError("Il catalogo non è ancora disponibile.")).finally(() => setLoading(false));
  }, [preferredRoomId]);

  const rootTopics = useMemo(() => data?.topics.filter((topic) => !topic.parent_id) ?? [], [data]);
  const subtopics = (parentId: string) => data?.topics.filter((topic) => topic.parent_id === parentId) ?? [];
  const googleSearchUrl = query.trim().length >= 2
    ? `https://www.google.com/search?q=${encodeURIComponent(`percorso di studio ${query.trim()} dalle basi al livello desiderato corsi video PDF esercizi guida`)}`
    : "https://www.google.com/";

  async function searchCatalog(searchQuery = query, generalPath = false) {
    const cleaned = searchQuery.trim();
    if (cleaned.length < 2) return;
    setQuery(cleaned); setSearching(true); setError(null); setMessage(null);
    try {
      const payload = await api<{ interpretation: CatalogInterpretation; roadmap: LearningPathDraft; results: RankedCatalogMaterial[] }>("/api/catalog/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleaned, filters, generalPath, includeWeb: false }),
      });
      setInterpretation(payload.interpretation); setRoadmap(payload.roadmap); setResults(payload.results);
    } catch { setError("Non sono riuscita a completare la ricerca. Riprova tra poco."); }
    finally { setSearching(false); }
  }

  async function addManualMaterial() {
    setBusy("manual-material"); setError(null); setMessage(null);
    try {
      const normalizedUrl = new URL(manualMaterial.url.trim());
      const filename = normalizedUrl.pathname.split("/").pop() ?? "";
      const extension = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() ?? null : null;
      const payload = await api<{ materialId: string }>("/api/catalog/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_web_material",
          title: manualMaterial.title.trim(),
          description: manualMaterial.description.trim() || "Materiale aggiunto manualmente al catalogo.",
          provider: manualMaterial.provider.trim() || normalizedUrl.hostname,
          url: normalizedUrl.toString(),
          language: manualMaterial.language,
          resourceType: manualMaterial.resourceType,
          fileExtension: extension && extension.length <= 8 ? extension : null,
        }),
      });
      const refreshed = await api<Bootstrap>("/api/catalog/bootstrap");
      setData(refreshed);
      setSavedIds(new Set(refreshed.savedMaterialIds));
      setResults(refreshed.materials.map((material) => ({ ...material, relevance: 0, recommendationReasons: [] })));
      setSelectedIds((current) => new Set(current).add(payload.materialId));
      setManualMaterial(emptyManualMaterial);
      setAddMaterialOpen(false);
      setMessage("Materiale aggiunto al tuo catalogo. Ora Eve può usarlo nei percorsi.");
    } catch {
      setError("Non sono riuscita ad aggiungere il materiale. Controlla che il link inizi con https:// e riprova.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleSave(materialId: string) {
    const saved = savedIds.has(materialId);
    setSavedIds((current) => { const next = new Set(current); if (saved) next.delete(materialId); else next.add(materialId); return next; });
    try {
      await api("/api/catalog/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: saved ? "unsave_material" : "save_material", materialId }) });
    } catch {
      setSavedIds((current) => { const next = new Set(current); if (saved) next.add(materialId); else next.delete(materialId); return next; });
      setError("Non sono riuscita ad aggiornare i materiali salvati.");
    }
  }

  async function importMaterial(materialId: string, selectedRoomId: string, openAfter = false) {
    setBusy(materialId); setError(null);
    try {
      const payload = await api<{ result?: { already_present?: boolean; material_id?: string } }>("/api/catalog/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_material", materialId, roomId: selectedRoomId, courseId: null }) });
      setMessage(payload.result?.already_present ? "Il materiale era già presente nella stanza." : "Materiale aggiunto alla stanza.");
      if (openAfter && payload.result?.material_id) router.push(`/room/${selectedRoomId}?materialId=${payload.result.material_id}`);
    } catch { setError("Non sono riuscita ad aggiungere il materiale alla stanza."); }
    finally { setBusy(null); }
  }

  async function createPath() {
    const objective = query.trim() || interpretation?.normalizedObjective || "Percorso generale di studio";
    setBusy("path"); setError(null); setPathDraft(null); setPathId(null);
    try {
      const payload = await api<{ pathId: string; draft: LearningPathDraft; generatedBy: string }>("/api/catalog/path", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: objective, topicSlugs: interpretation?.detectedTopicSlugs ?? [], materialIds: [...selectedIds], initialLevel: pathLevel, targetLevel, weeklyHours, curriculumId: null }),
      });
      setPathDraft(payload.draft); setPathId(payload.pathId);
    } catch { setError("Non sono riuscita a salvare questo percorso. Riprova tra poco."); }
    finally { setBusy(null); }
  }

  async function importPath() {
    if (!pathId || !roomId) return;
    setBusy("import-path"); setError(null);
    try {
      await api("/api/catalog/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_path", pathId, roomId }) });
      setMessage("Percorso aggiunto: nella stanza troverai corso, materiali e checklist."); setPathOpen(false);
    } catch { setError("Non sono riuscita ad aggiungere il percorso alla stanza."); }
    finally { setBusy(null); }
  }

  async function updatePersonalization(value: boolean) {
    setPersonalization(value);
    try {
      await api("/api/catalog/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_personalization", allowProgressPersonalization: value }) });
      setMessage(value ? "Personalizzazione attivata con il tuo consenso." : "Personalizzazione disattivata.");
    } catch { setPersonalization(!value); setError("Non sono riuscita a salvare questa preferenza."); }
  }

  if (loading) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-moss-700" /></main>;

  return (
    <main data-ui-surface="dark" data-ui-page="catalog" className="min-h-screen px-4 py-5 sm:px-7 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href={preferredRoomId ? `/room/${preferredRoomId}` : "/dashboard"} className="button-secondary px-3 py-2"><ArrowLeft size={16} /> {preferredRoomId ? "Torna all’aula" : "Scrivania"}</Link>
        <div className="flex items-center gap-2 text-sm font-bold"><span className="grid size-9 place-items-center rounded-xl bg-moss-800 text-white"><BookOpen size={18} /></span>Catalogo</div>
        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold shadow-sm"><Bot size={16} className="text-moss-700" /> Eve</span>
      </nav>

      <section className="mx-auto max-w-4xl pb-8 pt-14 text-center">
        <p className="eyebrow">Catalogo intelligente</p>
        <h1 className="mt-3 font-[family-name:var(--font-serif)] text-4xl font-medium tracking-tight sm:text-6xl">Cosa vuoi studiare?</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-black/48">Cerca tra i materiali già presenti. Eve li ordina in un percorso di studio senza usare OpenAI e senza consumare credito.</p>
        <form onSubmit={(event) => { event.preventDefault(); void searchCatalog(query); }} className="mx-auto mt-7 flex max-w-4xl flex-wrap gap-2 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-card">
          <Search size={20} className="ml-2 mt-3 shrink-0 text-black/32" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={1000} placeholder="Es. voglio imparare Python per analizzare dati satellitari" className="min-w-[14rem] flex-1 border-0 bg-transparent px-2 text-sm focus:ring-0" />
          <button className="button-primary shrink-0" disabled={searching || query.trim().length < 2}>{searching ? <Loader2 size={16} className="animate-spin" /> : <>Cerca nel catalogo <ArrowRight size={16} /></>}</button>
          <a href={googleSearchUrl} target="_blank" rel="noopener noreferrer" aria-disabled={query.trim().length < 2} className={`button-secondary shrink-0 ${query.trim().length < 2 ? "pointer-events-none opacity-40" : ""}`}><ExternalLink size={15} /> Cerca percorso su Google</a>
        </form>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
          <button type="button" onClick={() => void searchCatalog("Non so da dove iniziare: aiutami a scegliere un percorso generale", true)} className="text-moss-700 hover:underline"><Sparkles size={14} className="mr-1 inline" />Non so da dove iniziare</button>
          <button type="button" onClick={() => setAddMaterialOpen(true)} className="text-sky-700 hover:underline"><Plus size={14} className="mr-1 inline" />Aggiungi materiale</button>
          <span className="font-normal text-black/42">Google si apre con una ricerca didattica già preparata, sempre gratuita.</span>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8">
        <aside className="order-2 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="panel p-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Esplora gli argomenti</h2><GraduationCap size={17} className="text-moss-700" /></div>
            <div className="mt-3 space-y-2">
              {rootTopics.map((topic) => <details key={topic.id} className="group rounded-xl border border-black/[0.05] bg-black/[0.015] px-3 py-2">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold"><button type="button" onClick={(event) => { event.preventDefault(); void searchCatalog(topic.name); }}>{topic.name}</button><ChevronDown size={14} className="transition group-open:rotate-180" /></summary>
                <div className="mt-2 space-y-1 border-t border-black/[0.05] pt-2">{subtopics(topic.id).map((child) => <button type="button" key={child.id} onClick={() => void searchCatalog(child.name)} className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[0.7rem] text-black/55 hover:bg-white hover:text-moss-800"><ChevronRight size={12} />{child.name}</button>)}</div>
              </details>)}
            </div>
          </section>
          <section className="panel p-4">
            <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-moss-700" /><div><h2 className="text-xs font-bold">Privacy</h2><p className="mt-1 text-[0.68rem] leading-4 text-black/48">Ricerche, preferenze e percorsi sono privati. I progressi vengono usati da Eve solo se lo autorizzi.</p></div></div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.7rem] font-semibold"><input type="checkbox" checked={personalization} onChange={(event) => void updatePersonalization(event.target.checked)} className="rounded border-black/15 text-moss-700 focus:ring-moss-500" />Usa i miei progressi per personalizzare</label>
          </section>
        </aside>

        <section className="order-1">
          {searching && <div className="mb-4 flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/80 p-4 text-sm text-black/55"><Loader2 size={17} className="animate-spin text-sky-700" /> Ricerca gratuita nel catalogo...</div>}
          {error && <div role="alert" className="mb-4 flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button onClick={() => setError(null)}><X size={16} /></button></div>}
          {message && <div className="mb-4 flex items-start justify-between rounded-xl border border-moss-200 bg-moss-50 p-4 text-sm text-moss-800"><span><Check size={15} className="mr-2 inline" />{message}</span><button onClick={() => setMessage(null)}><X size={16} /></button></div>}
          {interpretation && <div className="mb-4 rounded-2xl border border-moss-100 bg-white/70 p-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-moss-800 text-white"><Bot size={17} /></span><div><p className="text-xs font-bold">Eve ha organizzato la richiesta usando il catalogo</p><p className="mt-1 text-xs leading-5 text-black/52">{interpretation.summary}</p>{interpretation.detectedTopicSlugs.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{interpretation.detectedTopicSlugs.map((slug) => <span key={slug} className="rounded-full bg-moss-100 px-2 py-1 text-[0.65rem] font-semibold text-moss-800">{data?.topics.find((topic) => topic.slug === slug)?.name ?? slug}</span>)}</div>}</div></div></div>}

          {roadmap && <section className="mb-8 rounded-3xl border border-moss-100 bg-white/80 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><div className="flex flex-wrap items-center gap-2"><p className="eyebrow">Percorso suggerito da Eve</p><span className="rounded-full bg-moss-100 px-2.5 py-1 text-[0.65rem] font-bold text-moss-800">Creato dal catalogo · gratuito</span></div><h2 className="mt-2 text-2xl font-bold">{roadmap.title}</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-black/52">{roadmap.rationale}</p></div>
              <button type="button" onClick={() => setPathOpen(true)} className="button-primary shrink-0 px-3 py-2"><Route size={15} /> Personalizza e salva</button>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{roadmap.modules.map((module, moduleIndex) => {
              const activity = module.items.find((item) => item.itemType !== "material");
              const materials = module.items.filter((item) => item.itemType === "material");
              const stageContext = `${query} ${module.title} ${module.description}`;
              const guidedGoogleSearches = module.googleQueries
                ? ([
                    ["Lezioni", module.googleQueries.lessons],
                    ["Esercizi", module.googleQueries.exercises],
                    ["Video", module.googleQueries.videos],
                    ["PDF", module.googleQueries.pdfs],
                  ] as Array<[string, string[]]>).flatMap(([label, searches]) => searches.map((search, index) => ({ label: `${label} ${index === 0 ? "IT" : "EN"}`, query: search })))
                : [
                    { label: "Lezioni", query: `${stageContext} spiegazione corso lezioni dalle basi` },
                    { label: "Esercizi", query: `${stageContext} esercizi svolti con soluzioni` },
                    { label: "Video", query: `${stageContext} video lezioni playlist corso` },
                    { label: "PDF", query: `${stageContext} dispensa manuale filetype:pdf` },
                  ];
              return <article key={`${module.title}-${moduleIndex}`} className="rounded-2xl border border-black/[0.06] bg-[#f7f6f1] p-4">
                <span className="grid size-7 place-items-center rounded-full bg-moss-800 text-[0.68rem] font-bold text-white">{moduleIndex + 1}</span>
                <h3 className="mt-3 text-sm font-bold leading-5">{module.title}</h3>
                <p className="mt-2 text-[0.7rem] leading-5 text-black/50">{module.description}</p>
                {module.concepts?.length ? <p className="mt-3 text-[0.68rem] leading-4 text-black/48"><strong>Concetti:</strong> {module.concepts.slice(0, 5).join(" · ")}</p> : null}
                {module.objectives?.length ? <p className="mt-2 text-[0.68rem] leading-4 text-moss-800"><strong>Obiettivi:</strong> {module.objectives.join(" · ")}</p> : activity && <p className="mt-3 text-[0.68rem] leading-4 text-moss-800"><strong>Attività:</strong> {activity.description}</p>}
                {module.projects?.[0] && <p className="mt-2 text-[0.68rem] leading-4 text-[#8a542d]"><strong>Progetto:</strong> {module.projects[0]}</p>}
                {materials.length > 0 && <div className="mt-3 space-y-1.5"><p className="text-[0.65rem] font-bold uppercase tracking-wide text-black/35">Materiali consigliati</p>{materials.map((item, itemIndex) => item.sourceUrl ? <a key={`${item.title}-${itemIndex}`} href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-[0.68rem] font-semibold leading-4 text-sky-700 hover:underline"><BookOpen size={12} className="mt-0.5 shrink-0" />{item.title}</a> : <p key={`${item.title}-${itemIndex}`} className="text-[0.68rem] font-semibold leading-4 text-sky-700">{item.title}</p>)}</div>}
                {module.completionCriteria[0] && <p className="mt-2 text-[0.68rem] leading-4 text-black/45"><strong>Passi avanti quando sai:</strong> {module.completionCriteria[0]}</p>}
                <div className="mt-4 border-t border-black/[0.06] pt-3"><p className="text-[0.62rem] font-bold uppercase tracking-wide text-black/35">Cerca questa tappa su Google</p><div className="mt-2 grid grid-cols-2 gap-1.5">{guidedGoogleSearches.map((search) => <a key={search.label} href={`https://www.google.com/search?q=${encodeURIComponent(search.query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-[0.65rem] font-bold text-[#3458a4] shadow-sm hover:bg-sky-50">{search.label} <ExternalLink size={10} /></a>)}</div></div>
              </article>;
            })}</div>
          </section>}

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><p className="eyebrow">Dal catalogo</p><h2 className="mt-1 text-2xl font-bold">{results.length} risultati già disponibili</h2></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowFilters((value) => !value)} className="button-secondary px-3 py-2"><Filter size={15} /> Filtri</button>
              <button type="button" onClick={() => setPathOpen(true)} className="button-primary px-3 py-2"><Route size={15} /> Crea percorso{selectedIds.size ? ` (${selectedIds.size})` : ""}</button>
            </div>
          </div>
          {showFilters && <div className="mt-3 grid gap-3 rounded-2xl border border-black/[0.06] bg-white/75 p-4 sm:grid-cols-4">
            <select value={filters.language ?? ""} onChange={(event) => setFilters({ ...filters, language: event.target.value || undefined })} className="field"><option value="">Tutte le lingue</option><option value="it">Italiano</option><option value="en">Inglese</option></select>
            <select value={filters.level ?? ""} onChange={(event) => setFilters({ ...filters, level: (event.target.value || undefined) as CatalogFilters["level"] })} className="field"><option value="">Tutti i livelli</option>{Object.entries(levelLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={filters.materialType ?? ""} onChange={(event) => setFilters({ ...filters, materialType: event.target.value || undefined })} className="field"><option value="">Tutti i formati</option>{Object.entries(formatLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button type="button" onClick={() => void searchCatalog()} className="button-secondary">Applica filtri</button>
          </div>}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map((material) => <MaterialCard key={material.id} material={material} saved={savedIds.has(material.id)} selected={selectedIds.has(material.id)} rooms={data?.rooms ?? []} defaultRoomId={roomId} busy={busy} onSave={() => void toggleSave(material.id)} onSelect={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(material.id)) next.delete(material.id); else next.add(material.id); return next; })} onImport={(selectedRoomId) => void importMaterial(material.id, selectedRoomId)} onOpen={(selectedRoomId) => void importMaterial(material.id, selectedRoomId, true)} />)}</div>
          {!results.length && <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white/50 p-12 text-center"><Search className="mx-auto text-black/25" /><p className="mt-4 text-sm font-bold">Nessun materiale compatibile</p><p className="mt-1 text-xs text-black/45">Prova una ricerca più ampia o rimuovi qualche filtro.</p></div>}

        </section>
      </div>

      {pathOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPathOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Crea un percorso" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#f7f6f1] p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between"><div><p className="eyebrow">Percorso guidato</p><h2 className="mt-1 text-2xl font-bold">Personalizzalo e aggiungilo alla stanza</h2><p className="mt-1 text-xs text-black/48">Il curriculum creato da Eve conserva l’ordine delle tappe e tutti i materiali reali collegati. Salvandolo potrai importarlo come corso completo nella stanza.</p></div><button className="rounded-xl p-2 hover:bg-black/5" onClick={() => setPathOpen(false)}><X size={19} /></button></div>
          {!pathDraft ? <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3"><label className="text-xs font-bold">Livello iniziale<select className="field mt-2" value={pathLevel} onChange={(event) => setPathLevel(event.target.value)}>{Object.entries(levelLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold">Obiettivo<select className="field mt-2" value={targetLevel} onChange={(event) => setTargetLevel(event.target.value)}>{Object.entries(levelLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold">Ore a settimana<input className="field mt-2" type="number" min={0.5} max={168} step={0.5} value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))} /></label></div>
            <div className="mt-5 rounded-2xl bg-white p-4 text-xs leading-5 text-black/52"><strong className="text-ink">Contenuto:</strong> {selectedIds.size ? `${selectedIds.size} materiali scelti da te.` : results.length ? "Verranno collegati i risultati più pertinenti del catalogo." : "Il percorso conterrà attività ed esercizi e potrai aggiungere fonti in seguito."}</div>
            <button type="button" onClick={() => void createPath()} disabled={busy === "path"} className="button-primary mt-5 w-full">{busy === "path" ? <><Loader2 size={16} className="animate-spin" /> Eve sta salvando il percorso…</> : <><Sparkles size={16} /> Salva questo percorso</>}</button>
          </> : <>
            <div className="mt-5 rounded-2xl bg-white p-5"><h3 className="text-lg font-bold">{pathDraft.title}</h3><p className="mt-2 text-xs leading-5 text-black/52">{pathDraft.rationale}</p></div>
            <div className="mt-4 space-y-3">{pathDraft.modules.map((module, moduleIndex) => <div key={`${module.title}-${moduleIndex}`} className="rounded-2xl border border-black/[0.06] bg-white p-4"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-moss-100 text-xs font-bold text-moss-800">{moduleIndex + 1}</span><div><h4 className="text-sm font-bold">{module.title}</h4><p className="mt-1 text-xs text-black/48">{module.description}</p><ul className="mt-3 space-y-1.5">{module.items.map((item, itemIndex) => <li key={`${item.title}-${itemIndex}`} className="flex gap-2 text-xs"><Check size={14} className="mt-0.5 shrink-0 text-moss-600" /><span>{item.title}<span className="ml-1 text-black/35">· {formatLabels[item.itemType] ?? item.itemType}</span></span></li>)}</ul></div></div></div>)}</div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => { setPathDraft(null); setPathId(null); }} className="button-secondary">Rigenera</button>{data?.rooms.length ? <><select className="field" value={roomId} onChange={(event) => setRoomId(event.target.value)}>{data.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select><button type="button" onClick={() => void importPath()} disabled={busy === "import-path"} className="button-primary shrink-0">{busy === "import-path" ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />} Aggiungi alla stanza</button></> : <p className="rounded-xl bg-[#fff7ed] p-3 text-xs">Crea prima una stanza dalla scrivania per importare il percorso.</p>}</div>
          </>}
        </section>
      </div>}

      {addMaterialOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddMaterialOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Aggiungi materiale al catalogo" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#f7f6f1] p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="eyebrow">Amplia il catalogo</p><h2 className="mt-1 text-2xl font-bold">Aggiungi un materiale</h2><p className="mt-1 text-xs leading-5 text-black/48">Incolla un collegamento HTTPS a un video, PDF, corso, esercizio o altra risorsa. Rimarrà nel tuo catalogo e Eve potrà inserirlo nei percorsi.</p></div>
            <button type="button" aria-label="Chiudi" className="rounded-xl p-2 hover:bg-black/5" onClick={() => setAddMaterialOpen(false)}><X size={19} /></button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void addManualMaterial(); }} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold sm:col-span-2">Titolo *<input required maxLength={240} className="field mt-2" value={manualMaterial.title} onChange={(event) => setManualMaterial({ ...manualMaterial, title: event.target.value })} placeholder="Es. Introduzione alla biologia cellulare" /></label>
            <label className="text-xs font-bold sm:col-span-2">Link HTTPS *<input required type="url" maxLength={4096} pattern="https://.*" className="field mt-2" value={manualMaterial.url} onChange={(event) => setManualMaterial({ ...manualMaterial, url: event.target.value })} placeholder="https://..." /></label>
            <label className="text-xs font-bold">Tipo<select className="field mt-2" value={manualMaterial.resourceType} onChange={(event) => setManualMaterial({ ...manualMaterial, resourceType: event.target.value as WebResourceType })}>{Object.entries(resourceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-xs font-bold">Lingua<select className="field mt-2" value={manualMaterial.language} onChange={(event) => setManualMaterial({ ...manualMaterial, language: event.target.value })}><option value="it">Italiano</option><option value="en">Inglese</option><option value="und">Altra / non specificata</option></select></label>
            <label className="text-xs font-bold sm:col-span-2">Fonte o autore<input maxLength={160} className="field mt-2" value={manualMaterial.provider} onChange={(event) => setManualMaterial({ ...manualMaterial, provider: event.target.value })} placeholder="Facoltativo: se vuoto useremo il nome del sito" /></label>
            <label className="text-xs font-bold sm:col-span-2">Descrizione<textarea maxLength={4000} rows={4} className="field mt-2 resize-y" value={manualMaterial.description} onChange={(event) => setManualMaterial({ ...manualMaterial, description: event.target.value })} placeholder="Cosa contiene e per quale argomento è utile" /></label>
            <div className="sm:col-span-2 flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" className="button-secondary" onClick={() => setAddMaterialOpen(false)}>Annulla</button>
              <button type="submit" disabled={busy === "manual-material"} className="button-primary">{busy === "manual-material" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Aggiungi al catalogo</button>
            </div>
          </form>
        </section>
      </div>}
    </main>
  );
}

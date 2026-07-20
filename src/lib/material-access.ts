export type MaterialAccessMode = "internal" | "embedded" | "import-required" | "external-unmonitored" | "unsupported";
export type MaterialMonitoringLevel = "full" | "partial" | "opened-only" | "none";
export type InternalMaterialViewer = "pdf" | "text" | "document" | "presentation" | "video" | "web-article" | "exercise" | "lesson" | null;
export type MaterialImportStatus = "ready" | "pending" | "failed" | "not-required";

export interface MaterialAccessDescriptor {
  accessMode: MaterialAccessMode;
  monitoringLevel: MaterialMonitoringLevel;
  internalViewer: InternalMaterialViewer;
  importStatus: MaterialImportStatus;
  sourceUrl: string | null;
  reason: string;
  provider: "youtube" | "vimeo" | "html5-video" | "internal" | "web" | "none";
  embedUrl: string | null;
}

interface MaterialLike {
  title: string;
  type?: string | null;
  url?: string | null;
  source_url?: string | null;
  storage_path?: string | null;
  material_type?: string | null;
  access_mode?: string | null;
  monitoring_level?: string | null;
  internal_viewer?: string | null;
  import_status?: string | null;
  metadata?: Record<string, unknown> | null;
}

const ACCESS_MODES = new Set<MaterialAccessMode>(["internal", "embedded", "import-required", "external-unmonitored", "unsupported"]);
const MONITORING_LEVELS = new Set<MaterialMonitoringLevel>(["full", "partial", "opened-only", "none"]);
const VIEWERS = new Set<Exclude<InternalMaterialViewer, null>>(["pdf", "text", "document", "presentation", "video", "web-article", "exercise", "lesson"]);
const IMPORT_STATUSES = new Set<MaterialImportStatus>(["ready", "pending", "failed", "not-required"]);

function value<T extends string>(candidate: unknown, allowed: Set<T>): T | null {
  return typeof candidate === "string" && allowed.has(candidate as T) ? candidate as T : null;
}

function extension(material: MaterialLike) {
  const candidate = material.storage_path ?? material.url ?? material.source_url ?? material.title;
  return candidate?.split(/[?#]/, 1)[0]?.toLocaleLowerCase().match(/\.([a-z0-9]{2,8})$/)?.[1] ?? null;
}

export function isSafePublicHttpsUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLocaleLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "::1") return false;
    const parts = host.split(".").map(Number);
    if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
      const [a, b] = parts;
      if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function youtubeEmbedUrl(candidate: string): string | null {
  if (!isSafePublicHttpsUrl(candidate)) return null;
  const url = new URL(candidate);
  const host = url.hostname.replace(/^www\./, "");
  const isYouTubeHost = host === "youtube.com" || host.endsWith(".youtube.com");
  if (host !== "youtu.be" && !isYouTubeHost) return null;
  const list = url.searchParams.get("list");
  let videoId = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] : url.searchParams.get("v");
  if (!videoId && isYouTubeHost && url.pathname.startsWith("/embed/")) videoId = url.pathname.split("/")[2];
  const validId = videoId && /^[\w-]{6,20}$/.test(videoId) ? videoId : null;
  const validList = list && /^[\w-]{10,80}$/.test(list) ? list : null;
  if (!validId && !validList) return null;
  const embed = new URL(validId ? `https://www.youtube-nocookie.com/embed/${validId}` : "https://www.youtube-nocookie.com/embed/videoseries");
  if (validList) embed.searchParams.set("list", validList);
  embed.searchParams.set("enablejsapi", "1");
  embed.searchParams.set("playsinline", "1");
  return embed.toString();
}

export function vimeoEmbedUrl(candidate: string): string | null {
  if (!isSafePublicHttpsUrl(candidate)) return null;
  const url = new URL(candidate);
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && !host.endsWith(".vimeo.com")) return null;
  const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d{5,12}$/.test(part));
  if (!id) return null;
  return `https://player.vimeo.com/video/${id}?api=1&dnt=1`;
}

export function resolveMaterialAccess(material: MaterialLike): MaterialAccessDescriptor {
  const metadata = material.metadata ?? {};
  const sourceUrl = material.url ?? material.source_url ?? (typeof metadata.source_url === "string" ? metadata.source_url : null);
  const stored = Boolean(material.storage_path);
  const ext = extension(material);
  const materialType = material.material_type ?? (typeof metadata.material_type === "string" ? metadata.material_type : material.type);
  const youtube = sourceUrl ? youtubeEmbedUrl(sourceUrl) : null;
  const vimeo = sourceUrl ? vimeoEmbedUrl(sourceUrl) : null;
  const directVideo = sourceUrl && isSafePublicHttpsUrl(sourceUrl) && ["mp4", "webm", "ogg"].includes(ext ?? "") ? sourceUrl : null;

  const explicitAccess = value(material.access_mode ?? metadata.access_mode, ACCESS_MODES);
  const explicitMonitoring = value(material.monitoring_level ?? metadata.monitoring_level, MONITORING_LEVELS);
  const explicitViewer = value(material.internal_viewer ?? metadata.internal_viewer, VIEWERS);
  const explicitImport = value(material.import_status ?? metadata.import_status, IMPORT_STATUSES);

  let derived: MaterialAccessDescriptor;
  if (stored && ext === "txt") derived = { accessMode: "internal", monitoringLevel: "full", internalViewer: "text", importStatus: "ready", sourceUrl, reason: "Testo privato pronto nel lettore interno.", provider: "internal", embedUrl: null };
  else if (stored && (ext === "pdf" || material.type === "pdf" || materialType === "pdf")) derived = { accessMode: "internal", monitoringLevel: "partial", internalViewer: "pdf", importStatus: "ready", sourceUrl, reason: "PDF consultabile nel workspace con posizione salvata.", provider: "internal", embedUrl: null };
  else if (sourceUrl && (ext === "pdf" || material.type === "pdf" || materialType === "pdf")) derived = { accessMode: "import-required", monitoringLevel: "none", internalViewer: "pdf", importStatus: "pending", sourceUrl, reason: "Il PDF deve essere importato legalmente nello spazio protetto prima del monitoraggio.", provider: "web", embedUrl: null };
  else if (stored && ["doc", "docx"].includes(ext ?? "")) derived = { accessMode: "internal", monitoringLevel: "full", internalViewer: "document", importStatus: "ready", sourceUrl, reason: "Documento convertito in testo sicuro sul server.", provider: "internal", embedUrl: null };
  else if (stored && ["ppt", "pptx"].includes(ext ?? "")) derived = { accessMode: "internal", monitoringLevel: "full", internalViewer: "presentation", importStatus: "ready", sourceUrl, reason: "Presentazione renderizzata come slide testuali sicure.", provider: "internal", embedUrl: null };
  else if (youtube) derived = { accessMode: "embedded", monitoringLevel: "full", internalViewer: "video", importStatus: "not-required", sourceUrl, reason: "Video YouTube compatibile con il player ufficiale incorporato.", provider: "youtube", embedUrl: youtube };
  else if (vimeo) derived = { accessMode: "embedded", monitoringLevel: "full", internalViewer: "video", importStatus: "not-required", sourceUrl, reason: "Video Vimeo compatibile con il player ufficiale incorporato.", provider: "vimeo", embedUrl: vimeo };
  else if (directVideo) derived = { accessMode: "embedded", monitoringLevel: "full", internalViewer: "video", importStatus: "not-required", sourceUrl, reason: "File video HTTPS compatibile con il player HTML5.", provider: "html5-video", embedUrl: directVideo };
  else if (materialType === "exercise" || materialType === "quiz") derived = { accessMode: "import-required", monitoringLevel: "none", internalViewer: "exercise", importStatus: "pending", sourceUrl, reason: "L’esercizio deve essere importato o ricreato prima del monitoraggio.", provider: "web", embedUrl: null };
  else if (sourceUrl && isSafePublicHttpsUrl(sourceUrl)) derived = { accessMode: "import-required", monitoringLevel: "none", internalViewer: "web-article", importStatus: "pending", sourceUrl, reason: "La pagina richiede una copia leggibile autorizzata o un file compatibile.", provider: "web", embedUrl: null };
  else derived = { accessMode: "unsupported", monitoringLevel: "none", internalViewer: null, importStatus: "failed", sourceUrl, reason: "La risorsa non dispone di un formato interno sicuro.", provider: "none", embedUrl: null };

  return {
    ...derived,
    accessMode: explicitAccess ?? derived.accessMode,
    monitoringLevel: explicitMonitoring ?? derived.monitoringLevel,
    internalViewer: explicitViewer ?? derived.internalViewer,
    importStatus: explicitImport ?? derived.importStatus,
  };
}

export function materialAccessPriority(material: MaterialLike): number {
  const access = resolveMaterialAccess(material);
  const accessScore = { internal: 50, embedded: 40, "import-required": 25, "external-unmonitored": 10, unsupported: 0 }[access.accessMode];
  const monitoringScore = { full: 20, partial: 12, "opened-only": 5, none: 0 }[access.monitoringLevel];
  return accessScore + monitoringScore;
}

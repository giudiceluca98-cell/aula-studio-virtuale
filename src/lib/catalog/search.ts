import type {
  CatalogFilters,
  CatalogInterpretation,
  CatalogMaterial,
  CatalogObjectiveType,
  CatalogTopic,
  LearningPathDraft,
  RankedCatalogMaterial,
} from "./types";
import { materialAccessPriority } from "@/lib/material-access";

const STOP_WORDS = new Set(["a","ad","al","alla","alle","con","da","dal","dalla","de","dei","del","della","di","e","fare","il","imparare","in","la","le","lo","mi","per","studiare","un","una","voglio","vorrei"]);
const LEVEL_ORDER = ["no_experience", "beginner", "intermediate", "advanced", "professional", "university"];

export function normalizeCatalogText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim().replace(/\s+/g, " ");
}

export function catalogTokens(value: string) {
  return [...new Set(normalizeCatalogText(value).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token)))];
}

function detectObjectiveType(query: string): CatalogObjectiveType {
  const normalized = normalizeCatalogText(query);
  if (/esame|verifica|test|interrogazione/.test(normalized)) return "exam";
  if (/diventare|lavorare|professione|carriera|engineer|programmatore|sviluppatore/.test(normalized)) return "profession";
  if (/creare|costruire|sviluppare|realizzare|progetto|app|sito/.test(normalized)) return "project";
  if (/non so|aiutami|mi piacciono|interessa/.test(normalized)) return "exploration";
  if (/imparare|capire|prepararmi|obiettivo/.test(normalized)) return "goal";
  return catalogTokens(query).length <= 2 ? "subject" : "topic";
}

function topicScore(query: string, topic: CatalogTopic) {
  const normalized = normalizeCatalogText(query);
  const tokens = catalogTokens(query);
  const names = [topic.name, topic.slug, ...(topic.aliases ?? [])].map(normalizeCatalogText);
  let score = 0;
  for (const name of names) {
    if (normalized === name) score = Math.max(score, 20);
    else if (` ${normalized} `.includes(` ${name} `) || ` ${name} `.includes(` ${normalized} `)) score = Math.max(score, 10);
    const nameTokens = catalogTokens(name);
    score += nameTokens.filter((token) => tokens.includes(token)).length * 3;
  }
  return score;
}

export function interpretCatalogQuery(query: string, topics: CatalogTopic[]): CatalogInterpretation {
  const objectiveType = detectObjectiveType(query);
  const scored = topics.map((topic) => ({ topic, score: topicScore(query, topic) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.topic.sort_order - b.topic.sort_order);
  const detected = scored.slice(0, 6).map((item) => item.topic.slug);
  const detectedIds = new Set(scored.slice(0, 3).map((item) => item.topic.id));
  const parents = new Set(scored.slice(0, 3).map((item) => item.topic.parent_id).filter(Boolean));
  const directions = topics.filter((topic) => topic.parent_id && (detectedIds.has(topic.parent_id) || parents.has(topic.parent_id))).slice(0, 8).map((topic) => topic.slug);
  const fallbackDirections = topics.filter((topic) => topic.parent_id === null).sort((a,b) => a.sort_order-b.sort_order).slice(0, 6).map((topic) => topic.slug);
  const normalizedObjective = query.trim().replace(/\s+/g, " ");
  const questions = objectiveType === "exploration" || objectiveType === "goal" ? [
    "Parti completamente da zero?",
    "Quanto tempo puoi dedicare ogni settimana?",
    "Preferisci video, testi o progetti pratici?",
  ] : [];
  return {
    objectiveType,
    normalizedObjective,
    detectedTopicSlugs: detected,
    suggestedDirectionSlugs: directions.length ? directions : fallbackDirections,
    clarificationQuestions: questions,
    summary: detected.length ? `Ho collegato la richiesta a ${detected.slice(0,3).join(", ")}.` : "La richiesta è ampia: puoi esplorare le aree disponibili o creare un percorso generale.",
    source: "deterministic",
  };
}

export function sanitizeEveInterpretation(
  value: Omit<CatalogInterpretation, "source">,
  topics: CatalogTopic[],
): CatalogInterpretation {
  const allowed = new Set(topics.map((topic) => topic.slug));
  return {
    ...value,
    detectedTopicSlugs: [...new Set(value.detectedTopicSlugs)].filter((slug) => allowed.has(slug)).slice(0, 12),
    suggestedDirectionSlugs: [...new Set(value.suggestedDirectionSlugs)].filter((slug) => allowed.has(slug)).slice(0, 12),
    clarificationQuestions: value.clarificationQuestions.slice(0, 6),
    source: "eve",
  };
}

function levelDistance(current: string | undefined, material: string) {
  if (!current) return 0;
  const a = LEVEL_ORDER.indexOf(current);
  const b = LEVEL_ORDER.indexOf(material);
  return a < 0 || b < 0 ? 0 : Math.abs(a - b);
}

export function rankCatalogMaterials(
  query: string,
  interpretation: CatalogInterpretation,
  topics: CatalogTopic[],
  materials: CatalogMaterial[],
  filters: CatalogFilters = {},
): RankedCatalogMaterial[] {
  const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const tokens = catalogTokens(query);
  const selectedSlugs = interpretation.detectedTopicSlugs.length
    ? interpretation.detectedTopicSlugs
    : tokens.length === 0 ? interpretation.suggestedDirectionSlugs : [];
  const selectedTopicIds = new Set(selectedSlugs.map((slug) => topicBySlug.get(slug)?.id).filter((id): id is string => Boolean(id)));
  return materials.filter((material) => {
    if (filters.language && material.language !== filters.language) return false;
    if (filters.level && material.level !== filters.level) return false;
    if (filters.materialType && material.material_type !== filters.materialType) return false;
    if (filters.priceType && material.price_type !== filters.priceType) return false;
    if (filters.verifiedOnly && !["verified","official_source"].includes(material.verification_status)) return false;
    if (filters.certificateOnly && material.certificate_available !== true) return false;
    return true;
  }).map((material) => {
    let relevance = material.verification_status === "official_source" ? 2 : material.verification_status === "verified" ? 1.5 : 0;
    const reasons: string[] = [];
    const topicMatch = material.topicLinks.filter((link) => selectedTopicIds.has(link.topic_id));
    if (topicMatch.length) {
      relevance += topicMatch.reduce((sum, link) => sum + Number(link.relevance_score) * 12, 0);
      reasons.push("corrisponde agli argomenti individuati");
    }
    const haystack = normalizeCatalogText(`${material.title} ${material.description} ${material.provider}`);
    const overlap = tokens.filter((token) => haystack.includes(token)).length;
    relevance += overlap * 2.5;
    if (overlap) reasons.push("corrisponde alle parole della ricerca");
    if (filters.level) {
      const distance = levelDistance(filters.level, material.level);
      relevance += Math.max(0, 3 - distance);
    }
    if (material.price_type === "free") reasons.push("accesso indicato come gratuito dalla fonte verificata");
    if (material.verification_status === "official_source") reasons.push("fonte ufficiale");
    if (material.monitoring_level === "full") reasons.push("monitorabile interamente nell’aula");
    else if (material.access_mode === "internal" || material.access_mode === "embedded") reasons.push("apribile nel workspace");
    return { ...material, relevance, recommendationReasons: [...new Set(reasons)].slice(0, 3) };
  }).filter((material) => material.relevance > 2 || (!tokens.length && material.verification_status === "official_source"))
    .sort((a, b) => materialAccessPriority(b) - materialAccessPriority(a) || b.relevance - a.relevance || a.title.localeCompare(b.title)).slice(0, 40);
}

export function createDeterministicPath(
  query: string,
  materials: CatalogMaterial[],
  initialLevel: LearningPathDraft["initialLevel"],
  targetLevel: LearningPathDraft["targetLevel"],
  weeklyHours: number,
): LearningPathDraft {
  const ordered = [...materials].sort((a,b) => LEVEL_ORDER.indexOf(a.level)-LEVEL_ORDER.indexOf(b.level)).slice(0,8);
  const foundation = ordered.slice(0, Math.max(1, Math.ceil(ordered.length / 2)));
  const development = ordered.slice(foundation.length);
  const materialItem = (material: CatalogMaterial) => ({
    catalogMaterialId: material.id,
    itemType: "material" as const,
    title: material.title,
    description: `Studia la risorsa verificata di ${material.provider}.`,
    isRequired: true,
    estimatedDurationMinutes: material.estimated_duration_minutes,
  });
  const modules = [
    {
      title: "Fondamenti e orientamento",
      description: "Comprendi il lessico, i concetti essenziali e i prerequisiti.",
      estimatedDurationMinutes: null,
      prerequisites: [],
      completionCriteria: ["Comprendere i concetti principali", "Annotare dubbi e prerequisiti mancanti"],
      items: foundation.map(materialItem),
    },
    ...(development.length ? [{
      title: "Competenze principali",
      description: "Approfondisci l’argomento con fonti reali e applicazioni progressive.",
      estimatedDurationMinutes: null,
      prerequisites: ["Modulo Fondamenti e orientamento"],
      completionCriteria: ["Completare le risorse essenziali", "Saper spiegare i concetti con parole proprie"],
      items: development.map(materialItem),
    }] : []),
    {
      title: "Progetto e verifica",
      description: "Applica ciò che hai studiato e verifica le lacune prima di proseguire.",
      estimatedDurationMinutes: 180,
      prerequisites: ["Moduli precedenti"],
      completionCriteria: ["Produrre un risultato verificabile", "Elencare cosa approfondire"],
      items: [{ catalogMaterialId: null, itemType: "project" as const, title: `Progetto pratico: ${query.slice(0,160)}`, description: "Realizza un piccolo progetto coerente con l’obiettivo e annota le decisioni prese.", isRequired: true, estimatedDurationMinutes: 120 }, { catalogMaterialId: null, itemType: "checkpoint" as const, title: "Verifica finale", description: "Rivedi obiettivi, difficoltà e prossimi passi.", isRequired: true, estimatedDurationMinutes: 60 }],
    },
  ];
  return {
    title: `Percorso · ${query.trim().slice(0,180)}`,
    objective: query.trim(), initialLevel, targetLevel, weeklyHours,
    rationale: "Percorso costruito esclusivamente con materiali presenti nel catalogo e ordinati dal livello più accessibile.",
    modules,
  };
}

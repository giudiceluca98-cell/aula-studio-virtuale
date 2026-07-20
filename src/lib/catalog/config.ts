import "server-only";

function intEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

export function getCatalogConfig() {
  return {
    enabled: process.env.CATALOG_ENABLED === "true" || process.env.NEXT_PUBLIC_CATALOG_ENABLED === "1",
    // Il Catalogo e i percorsi di Eve sono intenzionalmente locali e gratuiti.
    // Questi flag restano falsi anche se su Vercel sono presenti vecchie variabili.
    eveEnabled: false,
    webSearchEnabled: false,
    apiKey: process.env.OPENAI_API_KEY ?? "",
    interpretationModel: process.env.EVE_CATALOG_MODEL ?? "gpt-5-mini",
    webSearchModel: process.env.EVE_WEB_SEARCH_MODEL ?? process.env.EVE_CATALOG_MODEL ?? "gpt-5-mini",
    pathModel: process.env.EVE_PATH_MODEL ?? process.env.OPENAI_MODEL_TERRA ?? "gpt-5.6-terra",
    curriculumModel: process.env.EVE_CURRICULUM_MODEL ?? process.env.OPENAI_MODEL_SOL ?? "gpt-5.6-sol",
    automaticCurriculumEnabled: false,
    timeoutMs: intEnv("EVE_REQUEST_TIMEOUT_MS", 20000, 1000, 120000),
    curriculumTimeoutMs: intEnv("EVE_CURRICULUM_TIMEOUT_MS", 60000, 5000, 120000),
    dailyLimit: intEnv("EVE_DAILY_REQUEST_LIMIT_PER_USER", 20, 1, 1000),
  };
}

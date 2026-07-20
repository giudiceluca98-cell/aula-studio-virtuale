import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { getCatalogConfig } from "@/lib/catalog/config";
import { consumeCatalogBurst } from "@/lib/catalog/rate-limit";
import { loadCatalog } from "@/lib/catalog/repository";
import { catalogSearchRequestSchema } from "@/lib/catalog/schema";
import { interpretCatalogQuery, rankCatalogMaterials } from "@/lib/catalog/search";
import { createSubjectRoadmap } from "@/lib/catalog/roadmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", ...headers } });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 16 * 1024) return json({ error: "payload_too_large" }, 413);
  if (!getCatalogConfig().enabled) return json({ error: "catalog_disabled" }, 404);

  let decoded: unknown;
  try { decoded = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = catalogSearchRequestSchema.safeParse(decoded);
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const burst = consumeCatalogBurst(user.id);
  if (!burst.allowed) return json({ error: "rate_limit_exceeded" }, 429, { "Retry-After": String(burst.retryAfterSeconds) });

  let catalog;
  try { catalog = await loadCatalog(supabase); } catch { return json({ error: "catalog_unavailable" }, 503); }

  const interpretation = interpretCatalogQuery(parsed.data.query, catalog.topics);
  const results = rankCatalogMaterials(parsed.data.query, interpretation, catalog.topics, catalog.materials, parsed.data.filters);
  const roadmap = createSubjectRoadmap(parsed.data.query, results.slice(0, 10));

  await supabase.from("catalog_searches").insert({
    user_id: user.id,
    raw_query: parsed.data.query,
    interpreted_objective: interpretation.normalizedObjective,
    objective_type: interpretation.objectiveType,
    detected_topics: interpretation.detectedTopicSlugs,
    selected_level: parsed.data.filters.level ?? null,
    filters: parsed.data.filters,
    result_count: results.length,
    interpretation_source: "deterministic",
  });

  return json({
    interpretation,
    roadmap,
    results,
    webResults: [],
    eveNotice: null,
    webNotice: "catalog_only",
    curriculumId: null,
    curriculumSource: "deterministic",
    discoveriesAdded: 0,
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { getCatalogConfig } from "@/lib/catalog/config";
import { loadCatalog } from "@/lib/catalog/repository";
import { catalogPathRequestSchema } from "@/lib/catalog/schema";
import { interpretCatalogQuery, rankCatalogMaterials } from "@/lib/catalog/search";
import { createSubjectRoadmap } from "@/lib/catalog/roadmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 24 * 1024) return json({ error: "payload_too_large" }, 413);
  if (!getCatalogConfig().enabled) return json({ error: "catalog_disabled" }, 404);

  let decoded: unknown;
  try { decoded = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = catalogPathRequestSchema.safeParse(decoded);
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);

  let catalog;
  try { catalog = await loadCatalog(supabase); } catch { return json({ error: "catalog_unavailable" }, 503); }

  const allowedRequested = new Set(parsed.data.materialIds);
  let candidates = parsed.data.materialIds.length
    ? catalog.materials.filter((material) => allowedRequested.has(material.id))
    : [];
  if (!candidates.length) {
    const interpretation = interpretCatalogQuery(parsed.data.query, catalog.topics);
    const withRequestedTopics = parsed.data.topicSlugs.length
      ? { ...interpretation, detectedTopicSlugs: parsed.data.topicSlugs }
      : interpretation;
    candidates = rankCatalogMaterials(parsed.data.query, withRequestedTopics, catalog.topics, catalog.materials, {}).slice(0, 10);
  }

  const draft = createSubjectRoadmap(
    parsed.data.query,
    candidates,
    parsed.data.initialLevel,
    parsed.data.targetLevel,
    parsed.data.weeklyHours,
  );
  const { data: pathId, error: saveError } = await supabase.rpc("create_learning_path_from_json", {
    p_title: draft.title,
    p_objective: draft.objective,
    p_initial_level: draft.initialLevel,
    p_target_level: draft.targetLevel,
    p_weekly_hours: draft.weeklyHours,
    p_generated_by: "deterministic",
    p_rationale: draft.rationale,
    p_modules: draft.modules,
  });
  if (saveError || !pathId) return json({ error: "path_save_failed" }, 503);
  return json({ pathId, generatedBy: "deterministic", draft });
}

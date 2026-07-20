import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogMaterial, CatalogTopic } from "./types";

const MATERIAL_COLUMNS = `id,title,description,author,provider,source_url,material_type,language,level,estimated_duration_minutes,price_type,price,currency,certificate_available,prerequisites,license_type,verification_status,source_origin,verified_at,last_checked_at,viewer_compatibility,access_mode,monitoring_level,internal_viewer,import_status,internal_resource_id,access_requirements,catalog_material_topics(topic_id,relevance_score,is_primary)`;

export async function loadCatalog(client: SupabaseClient) {
  const [{ data: topicRows, error: topicError }, { data: materialRows, error: materialError }] = await Promise.all([
    client.from("catalog_topics").select("id,name,slug,description,parent_id,topic_type,level,aliases,sort_order").order("sort_order"),
    client.from("catalog_materials").select(MATERIAL_COLUMNS).order("title"),
  ]);
  if (topicError) throw topicError;
  if (materialError) throw materialError;
  const topics = (topicRows ?? []).map((row) => ({ ...row, aliases: Array.isArray(row.aliases) ? row.aliases.filter((value): value is string => typeof value === "string") : [] })) as CatalogTopic[];
  const materials = (materialRows ?? []).map((row) => {
    const links = Array.isArray(row.catalog_material_topics) ? row.catalog_material_topics : [];
    return {
      ...row,
      estimated_duration_minutes: row.estimated_duration_minutes === null ? null : Number(row.estimated_duration_minutes),
      price: row.price === null ? null : Number(row.price),
      prerequisites: Array.isArray(row.prerequisites) ? row.prerequisites.filter((value): value is string => typeof value === "string") : [],
      access_requirements: Array.isArray(row.access_requirements) ? row.access_requirements.filter((value): value is string => typeof value === "string") : [],
      topicLinks: links.map((link) => ({ topic_id: String(link.topic_id), relevance_score: Number(link.relevance_score), is_primary: Boolean(link.is_primary) })),
    };
  }) as CatalogMaterial[];
  return { topics, materials };
}

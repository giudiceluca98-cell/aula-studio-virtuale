-- Private Eve curriculum cache and safe batch ingestion of cited web resources.
begin;

create table if not exists public.catalog_curriculum_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query_hash text not null check (query_hash ~ '^[a-f0-9]{64}$'),
  raw_query text not null check (char_length(raw_query) between 2 and 1000),
  draft jsonb not null check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) <= 196608),
  web_results jsonb not null default '[]'::jsonb
    check (jsonb_typeof(web_results) = 'array' and octet_length(web_results::text) <= 131072),
  model_id text not null check (char_length(model_id) between 1 and 120),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '30 days'),
  unique (user_id, query_hash)
);

create index if not exists catalog_curriculum_cache_lookup_idx
  on public.catalog_curriculum_cache(user_id, query_hash, expires_at desc);

alter table public.catalog_curriculum_cache enable row level security;

drop policy if exists catalog_curriculum_cache_select_own on public.catalog_curriculum_cache;
create policy catalog_curriculum_cache_select_own on public.catalog_curriculum_cache
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists catalog_curriculum_cache_insert_own on public.catalog_curriculum_cache;
create policy catalog_curriculum_cache_insert_own on public.catalog_curriculum_cache
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists catalog_curriculum_cache_update_own on public.catalog_curriculum_cache;
create policy catalog_curriculum_cache_update_own on public.catalog_curriculum_cache
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists catalog_curriculum_cache_delete_own on public.catalog_curriculum_cache;
create policy catalog_curriculum_cache_delete_own on public.catalog_curriculum_cache
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.catalog_curriculum_cache from public, anon;
grant select, insert, update, delete on public.catalog_curriculum_cache to authenticated;

create or replace function public.save_eve_discoveries_to_catalog(p_materials jsonb)
returns table(source_url text, material_id uuid, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_entry jsonb;
  v_url text;
  v_title text;
  v_description text;
  v_provider text;
  v_language text;
  v_material_type text;
  v_viewer text;
  v_material uuid;
  v_created boolean;
  v_status text;
  v_active boolean;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if jsonb_typeof(p_materials) <> 'array'
     or jsonb_array_length(p_materials) not between 1 and 24
     or octet_length(p_materials::text) > 131072 then
    raise exception 'INVALID_DISCOVERIES_PAYLOAD';
  end if;

  for v_entry in select value from jsonb_array_elements(p_materials) loop
    v_url := v_entry ->> 'sourceUrl';
    v_title := pg_catalog.btrim(v_entry ->> 'title');
    v_description := pg_catalog.btrim(v_entry ->> 'description');
    v_provider := pg_catalog.btrim(v_entry ->> 'provider');
    v_language := pg_catalog.lower(pg_catalog.btrim(coalesce(v_entry ->> 'language', 'und')));
    v_material_type := v_entry ->> 'materialType';
    v_viewer := case when v_material_type = 'pdf' then 'download' else 'external' end;
    if char_length(v_title) not between 1 and 240
       or char_length(v_description) not between 1 and 4000
       or char_length(v_provider) not between 1 and 160
       or char_length(v_language) not between 2 and 35
       or v_material_type not in ('course','video','book','pdf','article','documentation','exercise','lecture','podcast','interactive')
       or char_length(v_url) > 4096
       or v_url !~* '^https://'
       or v_url ~* '^https://(?:localhost|127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)'
       or v_url ~* '\.(?:exe|msi|dmg|pkg|apk|bat|cmd|ps1|sh|scr)(?:\?|#|$)' then
      raise exception 'INVALID_EVE_DISCOVERY';
    end if;

    v_material := null;
    v_created := false;
    select m.id, m.verification_status, m.is_active into v_material, v_status, v_active
      from public.catalog_materials m where m.source_url = v_url limit 1;
    if v_material is not null and (not v_active or v_status = 'rejected') then
      raise exception 'EVE_DISCOVERY_NOT_AVAILABLE';
    end if;
    if v_material is null then
      begin
        insert into public.catalog_materials(
          title, description, provider, source_url, material_type, language, level,
          price_type, verification_status, source_origin, viewer_compatibility,
          created_by, is_active
        ) values (
          v_title, v_description, v_provider, v_url, v_material_type, v_language,
          'beginner', 'unknown', 'pending', 'community', v_viewer, v_user, true
        ) returning id into v_material;
        v_created := true;
      exception when unique_violation then
        select m.id into v_material from public.catalog_materials m
          where m.source_url = v_url and m.is_active and m.verification_status <> 'rejected';
        if v_material is null then raise exception 'EVE_DISCOVERY_NOT_AVAILABLE'; end if;
      end;
    end if;
    insert into public.saved_catalog_materials(user_id, material_id)
      values (v_user, v_material) on conflict (user_id, material_id) do nothing;
    return query select v_url, v_material, v_created;
  end loop;
end;
$$;

revoke all on function public.save_eve_discoveries_to_catalog(jsonb) from public, anon;
grant execute on function public.save_eve_discoveries_to_catalog(jsonb) to authenticated;

commit;

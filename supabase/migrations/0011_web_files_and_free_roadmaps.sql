-- Save cited web pages and non-executable educational files with their real catalog type.
begin;

create or replace function public.save_web_result_to_catalog(
  p_title text,
  p_description text,
  p_provider text,
  p_source_url text,
  p_language text,
  p_material_type text
)
returns table(material_id uuid, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_material uuid;
  v_created boolean := false;
  v_status text;
  v_active boolean;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if char_length(pg_catalog.btrim(p_title)) not between 1 and 240
     or char_length(pg_catalog.btrim(p_description)) not between 1 and 4000
     or char_length(pg_catalog.btrim(p_provider)) not between 1 and 160
     or char_length(pg_catalog.btrim(p_language)) not between 2 and 35
     or p_material_type not in ('article', 'pdf', 'documentation', 'exercise')
     or char_length(p_source_url) > 4096
     or p_source_url !~* '^https://'
     or p_source_url ~* '^https://(?:localhost|127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)'
     or p_source_url ~* '\.(?:exe|msi|dmg|pkg|apk|bat|cmd|ps1|sh|scr)(?:\?|#|$)' then
    raise exception 'INVALID_WEB_MATERIAL';
  end if;

  select m.id, m.verification_status, m.is_active into v_material, v_status, v_active
  from public.catalog_materials m
  where m.source_url = p_source_url
  limit 1;

  if v_material is not null and (not v_active or v_status = 'rejected') then
    raise exception 'WEB_MATERIAL_NOT_AVAILABLE';
  end if;

  if v_material is null then
    begin
      insert into public.catalog_materials(
        title, description, provider, source_url, material_type, language, level,
        price_type, verification_status, source_origin, viewer_compatibility,
        created_by, is_active
      ) values (
        pg_catalog.btrim(p_title), pg_catalog.btrim(p_description),
        pg_catalog.btrim(p_provider), p_source_url, p_material_type,
        pg_catalog.lower(pg_catalog.btrim(p_language)), 'beginner', 'unknown',
        'pending', 'community', case when p_material_type = 'pdf' then 'download' else 'external' end,
        v_user, true
      ) returning id into v_material;
      v_created := true;
    exception when unique_violation then
      select m.id into v_material from public.catalog_materials m
      where m.source_url = p_source_url and m.is_active and m.verification_status <> 'rejected';
      if v_material is null then raise exception 'WEB_MATERIAL_NOT_AVAILABLE'; end if;
    end;
  end if;

  insert into public.saved_catalog_materials(user_id, material_id)
  values (v_user, v_material)
  on conflict (user_id, material_id) do nothing;

  return query select v_material, v_created;
end;
$$;

revoke all on function public.save_web_result_to_catalog(text,text,text,text,text,text) from public, anon;
grant execute on function public.save_web_result_to_catalog(text,text,text,text,text,text) to authenticated;

commit;

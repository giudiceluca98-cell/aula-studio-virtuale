-- Structured programming subject package, curated sources and ordered imports.

begin;

alter table public.learning_path_modules
  add column if not exists stage_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.learning_path_modules
  drop constraint if exists learning_path_modules_stage_id_check,
  add constraint learning_path_modules_stage_id_check
    check (stage_id is null or (char_length(stage_id) between 1 and 120 and stage_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')),
  drop constraint if exists learning_path_modules_metadata_check,
  add constraint learning_path_modules_metadata_check
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768);

alter table public.tasks
  add column if not exists learning_path_id uuid references public.learning_paths(id) on delete set null,
  add column if not exists stage_id text,
  add column if not exists task_type text,
  add column if not exists order_index integer,
  add column if not exists completion_criteria jsonb not null default '[]'::jsonb,
  add column if not exists estimated_minutes integer;

alter table public.tasks
  drop constraint if exists tasks_stage_id_check,
  add constraint tasks_stage_id_check
    check (stage_id is null or (char_length(stage_id) between 1 and 120 and stage_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')),
  drop constraint if exists tasks_task_type_check,
  add constraint tasks_task_type_check
    check (task_type is null or task_type in ('lesson','exercise','project','assessment')),
  drop constraint if exists tasks_order_index_check,
  add constraint tasks_order_index_check
    check (order_index is null or order_index between 0 and 100000),
  drop constraint if exists tasks_completion_criteria_check,
  add constraint tasks_completion_criteria_check
    check (jsonb_typeof(completion_criteria) = 'array' and octet_length(completion_criteria::text) <= 8192),
  drop constraint if exists tasks_estimated_minutes_check,
  add constraint tasks_estimated_minutes_check
    check (estimated_minutes is null or estimated_minutes between 1 and 1000000);

create index if not exists tasks_learning_path_order_idx
  on public.tasks(room_id, learning_path_id, order_index)
  where learning_path_id is not null;

insert into public.catalog_topics(name, slug, description, parent_id, topic_type, level, aliases, sort_order)
values (
  'Programmazione', 'programmazione',
  'Dalle basi della logica alla realizzazione di software completo e verificabile.',
  null, 'area', null,
  array['coding','sviluppo software','software development','informatica pratica','imparare a programmare','programmatore','developer','sviluppo applicazioni'], 10
)
on conflict (slug) do update set
  description = excluded.description,
  aliases = excluded.aliases,
  is_active = true,
  updated_at = clock_timestamp();

insert into public.catalog_topics(name, slug, description, parent_id, topic_type, level, aliases, sort_order)
select 'Python', 'python', 'Python come primo linguaggio per apprendere concetti trasferibili.', id, 'skill', 'beginner',
  array['python da zero','programmazione python','corso python'], 11
from public.catalog_topics where slug = 'programmazione'
on conflict (slug) do update set
  description = excluded.description,
  parent_id = excluded.parent_id,
  aliases = excluded.aliases,
  is_active = true,
  updated_at = clock_timestamp();

insert into public.catalog_materials(
  title, description, provider, source_url, material_type, language, level,
  estimated_duration_minutes, price_type, certificate_available, prerequisites,
  license_type, verification_status, source_origin, verified_at, last_checked_at,
  viewer_compatibility, access_requirements, is_active
)
values
  ('Python Programming MOOC 2026', 'Percorso universitario completo con introduzione, corso avanzato, esercizi ed esami.', 'University of Helsinki', 'https://programming-26.mooc.fi/', 'course', 'en', 'beginner', 12000, 'free', true, '[]', null, 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('CS50''s Introduction to Programming with Python', 'Corso OpenCourseWare con lezioni, problem set, test, file, OOP e progetto finale.', 'Harvard CS50', 'https://cs50.harvard.edu/python/', 'course', 'en', 'beginner', 6000, 'free', true, '[]', null, 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('Playlist ufficiale CS50P', 'Playlist video ufficiale del corso CS50P dedicato alla programmazione in Python.', 'Harvard CS50', 'https://www.youtube.com/playlist?list=PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V', 'video', 'en', 'beginner', 1800, 'free', false, '[]', null, 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('Python for Everybody', 'Materiali, lezioni, libro ed esercizi aperti per imparare a programmare in Python.', 'University of Michigan / PY4E', 'https://www.py4e.com/', 'course', 'en', 'beginner', 4800, 'free', false, '[]', 'CC BY 4.0', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('The Python Tutorial', 'Tutoriale ufficiale Python da usare come riferimento dopo le basi della programmazione.', 'Python Software Foundation', 'https://docs.python.org/3/tutorial/', 'documentation', 'en', 'intermediate', 1200, 'free', false, '["Conoscenza di base della programmazione"]', 'PSF License', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('Python Documentation', 'Indice ufficiale di tutoriale, libreria standard, riferimento del linguaggio e guide Python.', 'Python Software Foundation', 'https://docs.python.org/3/', 'documentation', 'en', 'intermediate', null, 'free', false, '[]', 'PSF License', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('freeCodeCamp Python Certification', 'Percorso interattivo gratuito con esercizi e progetti Python.', 'freeCodeCamp', 'https://www.freecodecamp.org/learn/python-v9', 'interactive', 'en', 'beginner', 6000, 'free', true, '[]', null, 'verified', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('Pro Git', 'Libro ufficiale e gratuito su Git, dalla configurazione ai flussi avanzati.', 'Git SCM', 'https://git-scm.com/book/en/v2', 'book', 'en', 'beginner', 1800, 'free', false, '[]', 'CC BY-NC-SA 3.0', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('Git Learn', 'Raccolta ufficiale di risorse introduttive, video e documentazione per imparare Git.', 'Git SCM', 'https://git-scm.com/learn', 'course', 'en', 'beginner', 600, 'free', false, '[]', null, 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('pytest — Getting Started', 'Guida ufficiale per installare pytest e scrivere i primi test automatici.', 'pytest', 'https://docs.pytest.org/en/stable/getting-started.html', 'documentation', 'en', 'intermediate', 180, 'free', false, '["Python di base"]', 'MIT', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('MDN Learn Web Development', 'Percorso strutturato MDN per le competenze fondamentali dello sviluppo web.', 'Mozilla MDN', 'https://developer.mozilla.org/en-US/docs/Learn_web_development', 'course', 'en', 'beginner', 6000, 'free', false, '[]', 'CC BY-SA', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true),
  ('PostgreSQL Tutorial', 'Tutoriale ufficiale a PostgreSQL, SQL, query, JOIN, aggregazioni e funzionalità avanzate.', 'PostgreSQL Global Development Group', 'https://www.postgresql.org/docs/current/tutorial.html', 'documentation', 'en', 'beginner', 900, 'free', false, '[]', 'PostgreSQL License', 'official_source', 'verified', clock_timestamp(), clock_timestamp(), 'external', '{}', true)
on conflict (source_url) do update set
  title = excluded.title,
  description = excluded.description,
  provider = excluded.provider,
  material_type = excluded.material_type,
  language = excluded.language,
  level = excluded.level,
  estimated_duration_minutes = excluded.estimated_duration_minutes,
  price_type = excluded.price_type,
  certificate_available = excluded.certificate_available,
  prerequisites = excluded.prerequisites,
  license_type = excluded.license_type,
  verification_status = excluded.verification_status,
  source_origin = excluded.source_origin,
  verified_at = excluded.verified_at,
  last_checked_at = excluded.last_checked_at,
  viewer_compatibility = excluded.viewer_compatibility,
  is_active = true,
  updated_at = clock_timestamp();

insert into public.catalog_material_topics(material_id, topic_id, relevance_score, is_primary)
select material.id, topic.id,
  case when topic.slug = 'python' then 1.0 else 0.95 end,
  topic.slug = 'python'
from public.catalog_materials material
cross join public.catalog_topics topic
where material.source_url = any(array[
  'https://programming-26.mooc.fi/',
  'https://cs50.harvard.edu/python/',
  'https://www.youtube.com/playlist?list=PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V',
  'https://www.py4e.com/',
  'https://docs.python.org/3/tutorial/',
  'https://docs.python.org/3/',
  'https://www.freecodecamp.org/learn/python-v9',
  'https://git-scm.com/book/en/v2',
  'https://git-scm.com/learn',
  'https://docs.pytest.org/en/stable/getting-started.html',
  'https://developer.mozilla.org/en-US/docs/Learn_web_development',
  'https://www.postgresql.org/docs/current/tutorial.html'
]) and topic.slug in ('programmazione','python')
on conflict (material_id, topic_id) do update set
  relevance_score = excluded.relevance_score,
  is_primary = excluded.is_primary;

create or replace function public.create_learning_path_from_json(
  p_title text,
  p_objective text,
  p_initial_level text,
  p_target_level text,
  p_weekly_hours numeric,
  p_generated_by text,
  p_rationale text,
  p_modules jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_path_id uuid;
  v_module_id uuid;
  v_module record;
  v_item record;
  v_material_id uuid;
  v_estimated integer := 0;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if char_length(pg_catalog.btrim(p_title)) not between 1 and 240
     or char_length(pg_catalog.btrim(p_objective)) not between 1 and 4000
     or p_initial_level not in ('no_experience','beginner','intermediate','advanced','professional','university')
     or p_target_level not in ('no_experience','beginner','intermediate','advanced','professional','university')
     or p_generated_by not in ('deterministic','eve','user')
     or p_weekly_hours not between 0.5 and 168
     or jsonb_typeof(p_modules) <> 'array'
     or jsonb_array_length(p_modules) not between 1 and 20
     or octet_length(p_modules::text) > 131072 then
    raise exception 'INVALID_PATH_PAYLOAD';
  end if;
  select coalesce(sum(coalesce((entry.value ->> 'estimatedDurationMinutes')::integer, 0)), 0)::integer
    into v_estimated from jsonb_array_elements(p_modules) entry(value);
  insert into public.learning_paths(
    owner_user_id,title,objective,initial_level,target_level,weekly_hours,
    estimated_duration_minutes,status,generated_by,rationale
  ) values (
    v_user,pg_catalog.btrim(p_title),pg_catalog.btrim(p_objective),p_initial_level,p_target_level,
    p_weekly_hours,nullif(v_estimated,0),'draft',p_generated_by,p_rationale
  ) returning id into v_path_id;
  for v_module in select value, ordinality from jsonb_array_elements(p_modules) with ordinality loop
    if jsonb_typeof(v_module.value -> 'items') <> 'array'
       or jsonb_array_length(v_module.value -> 'items') > 30 then
      raise exception 'INVALID_MODULE_ITEMS';
    end if;
    insert into public.learning_path_modules(
      learning_path_id,stage_id,title,description,order_index,estimated_duration_minutes,
      prerequisites,completion_criteria,metadata
    ) values (
      v_path_id,nullif(v_module.value ->> 'stageId',''),pg_catalog.left(v_module.value ->> 'title',240),
      pg_catalog.left(v_module.value ->> 'description',4000),(v_module.ordinality - 1)::integer,
      nullif(v_module.value ->> 'estimatedDurationMinutes','')::integer,
      coalesce(v_module.value -> 'prerequisites','[]'::jsonb),
      coalesce(v_module.value -> 'completionCriteria','[]'::jsonb),
      pg_catalog.jsonb_build_object(
        'concepts',coalesce(v_module.value -> 'concepts','[]'::jsonb),
        'objectives',coalesce(v_module.value -> 'objectives','[]'::jsonb),
        'activities',coalesce(v_module.value -> 'activities','[]'::jsonb),
        'exercises',coalesce(v_module.value -> 'exercises','[]'::jsonb),
        'projects',coalesce(v_module.value -> 'projects','[]'::jsonb),
        'googleQueries',coalesce(v_module.value -> 'googleQueries','{}'::jsonb)
      )
    ) returning id into v_module_id;
    for v_item in select value, ordinality from jsonb_array_elements(v_module.value -> 'items') with ordinality loop
      v_material_id := null;
      if v_item.value ->> 'itemType' = 'material' then
        v_material_id := nullif(v_item.value ->> 'catalogMaterialId','')::uuid;
        if v_material_id is null or not exists (
          select 1 from public.catalog_materials cm
          where cm.id = v_material_id and cm.is_active and cm.verification_status <> 'rejected'
        ) then raise exception 'UNKNOWN_CATALOG_MATERIAL'; end if;
      elsif v_item.value ->> 'itemType' not in ('exercise','project','checkpoint') then
        raise exception 'INVALID_PATH_ITEM';
      end if;
      insert into public.learning_path_items(
        module_id,catalog_material_id,item_type,title,description,order_index,is_required,estimated_duration_minutes
      ) values (
        v_module_id,v_material_id,v_item.value ->> 'itemType',pg_catalog.left(v_item.value ->> 'title',240),
        pg_catalog.left(v_item.value ->> 'description',4000),(v_item.ordinality - 1)::integer,
        coalesce((v_item.value ->> 'isRequired')::boolean,true),
        nullif(v_item.value ->> 'estimatedDurationMinutes','')::integer
      );
    end loop;
  end loop;
  return v_path_id;
end;
$$;

create or replace function public.add_learning_path_to_room(p_path_id uuid, p_room_id uuid)
returns table(course_id uuid, materials_added integer, tasks_added integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_path public.learning_paths%rowtype;
  v_course uuid;
  v_module record;
  v_item record;
  v_material_count integer := 0;
  v_task_count integer := 0;
  v_task_type text;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED'; end if;
  select * into v_path from public.learning_paths where id = p_path_id and owner_user_id = v_user;
  if not found then raise exception 'LEARNING_PATH_NOT_FOUND'; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_path_id::text || ':' || p_room_id::text, 91313)
  );
  select imports.course_id into v_course from public.learning_path_room_imports imports where imports.path_id = p_path_id and imports.room_id = p_room_id;
  if found then return query select v_course, 0, 0; return; end if;
  insert into public.courses(room_id, title, description, created_by)
  values (p_room_id, v_path.title, v_path.objective, v_user) returning id into v_course;
  for v_module in select * from public.learning_path_modules where learning_path_id = p_path_id order by order_index loop
    for v_item in
      select items.*, catalog.title as material_title, catalog.description as material_description,
        catalog.source_url, catalog.provider, catalog.verification_status, catalog.source_origin
      from public.learning_path_items items
      left join public.catalog_materials catalog on catalog.id = items.catalog_material_id
      where items.module_id = v_module.id order by items.order_index
    loop
      if v_item.item_type = 'material' and v_item.catalog_material_id is not null and v_item.source_url is not null then
        if not exists (select 1 from public.materials material where material.room_id = p_room_id and material.metadata ->> 'catalog_material_id' = v_item.catalog_material_id::text) then
          insert into public.materials(room_id, course_id, type, title, description, url, storage_path, metadata, created_by)
          values (p_room_id, v_course, 'link', v_item.material_title, v_item.material_description, v_item.source_url, null,
            pg_catalog.jsonb_build_object('catalog_material_id', v_item.catalog_material_id, 'provider', v_item.provider,
              'verification_status', v_item.verification_status, 'source_origin', v_item.source_origin, 'path_id', p_path_id,
              'stage_id', v_module.stage_id), v_user);
          v_material_count := v_material_count + 1;
        end if;
      else
        v_task_type := case
          when v_item.item_type = 'project' then 'project'
          when v_item.item_type = 'checkpoint' then 'assessment'
          when v_item.title like 'Lezioni · %' then 'lesson'
          else 'exercise'
        end;
        insert into public.tasks(
          room_id,created_by,assigned_to,assignment_mode,title,description,completed,priority,
          learning_path_id,stage_id,task_type,order_index,completion_criteria,estimated_minutes
        ) values (
          p_room_id,v_user,null,'everyone',pg_catalog.left(v_item.title,300),v_item.description,false,
          case when v_task_type in ('project','assessment') then 'high'::public.task_priority else 'medium'::public.task_priority end,
          p_path_id,v_module.stage_id,v_task_type,(v_module.order_index * 100) + v_item.order_index,
          v_module.completion_criteria,v_item.estimated_duration_minutes
        );
        v_task_count := v_task_count + 1;
      end if;
    end loop;
  end loop;
  insert into public.learning_path_room_imports(path_id, room_id, imported_by, course_id)
  values (p_path_id, p_room_id, v_user, v_course);
  insert into public.activity_events(room_id, actor_id, event_type, entity_type, entity_id, summary, payload)
  values (p_room_id, v_user, 'learning_path_added', 'course', v_course, 'ha aggiunto un percorso dal Catalogo',
    pg_catalog.jsonb_build_object('path_id', p_path_id, 'title', v_path.title));
  return query select v_course, v_material_count, v_task_count;
end;
$$;

revoke all on function public.create_learning_path_from_json(text,text,text,text,numeric,text,text,jsonb) from public, anon;
revoke all on function public.add_learning_path_to_room(uuid,uuid) from public, anon;
grant execute on function public.create_learning_path_from_json(text,text,text,text,numeric,text,text,jsonb) to authenticated;
grant execute on function public.add_learning_path_to_room(uuid,uuid) to authenticated;

commit;

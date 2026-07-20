-- Intelligent catalog and private learning paths. Eve may interpret intent, but
-- catalog materials always come from these database rows.

begin;

create table public.catalog_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 2000),
  parent_id uuid references public.catalog_topics(id) on delete restrict,
  topic_type text not null default 'subject'
    check (topic_type in ('area', 'subject', 'skill', 'profession', 'project', 'exam')),
  level text check (level is null or level in ('beginner', 'intermediate', 'advanced', 'professional', 'university')),
  aliases text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (parent_id is null or parent_id <> id),
  check (cardinality(aliases) <= 40)
);

create table public.catalog_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  description text not null check (char_length(description) between 1 and 4000),
  author text check (author is null or char_length(author) <= 160),
  provider text not null check (char_length(provider) between 1 and 160),
  source_url text not null unique
    check (char_length(source_url) <= 4096 and source_url ~* '^https://'),
  material_type text not null
    check (material_type in ('course', 'video', 'book', 'pdf', 'article', 'documentation', 'exercise', 'quiz', 'project', 'simulator', 'lecture', 'podcast', 'interactive')),
  language text not null default 'en' check (char_length(language) between 2 and 35),
  level text not null default 'beginner'
    check (level in ('no_experience', 'beginner', 'intermediate', 'advanced', 'professional', 'university')),
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes between 1 and 1000000),
  price_type text not null default 'unknown'
    check (price_type in ('free', 'paid', 'freemium', 'unknown')),
  price numeric(12,2) check (price is null or price >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  certificate_available boolean,
  prerequisites jsonb not null default '[]'::jsonb
    check (jsonb_typeof(prerequisites) = 'array' and octet_length(prerequisites::text) <= 8192),
  license_type text check (license_type is null or char_length(license_type) <= 160),
  verification_status text not null default 'pending'
    check (verification_status in ('verified', 'official_source', 'community', 'pending', 'rejected')),
  source_origin text not null default 'external'
    check (source_origin in ('verified', 'internal', 'community', 'external')),
  verified_at timestamptz,
  last_checked_at timestamptz,
  viewer_compatibility text not null default 'external'
    check (viewer_compatibility in ('internal', 'external', 'download')),
  access_requirements text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check ((verification_status in ('verified', 'official_source') and verified_at is not null) or verification_status not in ('verified', 'official_source')),
  check ((price_type = 'paid' and price is not null and currency is not null) or price_type <> 'paid')
);

create table public.catalog_material_topics (
  material_id uuid not null references public.catalog_materials(id) on delete cascade,
  topic_id uuid not null references public.catalog_topics(id) on delete cascade,
  relevance_score numeric(4,3) not null default 1 check (relevance_score between 0 and 1),
  is_primary boolean not null default false,
  primary key (material_id, topic_id)
);

create table public.saved_catalog_materials (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.catalog_materials(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  primary key (user_id, material_id)
);

create table public.user_learning_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_languages text[] not null default array['it','en']::text[],
  preferred_formats text[] not null default '{}',
  weekly_hours numeric(5,2) check (weekly_hours is null or weekly_hours between 0.5 and 168),
  budget text not null default 'free_only' check (budget in ('free_only', 'mostly_free', 'flexible')),
  certificate_preference text not null default 'indifferent' check (certificate_preference in ('required', 'preferred', 'indifferent')),
  theory_practice_balance integer not null default 50 check (theory_practice_balance between 0 and 100),
  current_level text not null default 'no_experience'
    check (current_level in ('no_experience', 'beginner', 'intermediate', 'advanced', 'professional', 'university')),
  accessibility_preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(accessibility_preferences) = 'object' and octet_length(accessibility_preferences::text) <= 8192),
  allow_progress_personalization boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (cardinality(preferred_languages) between 1 and 20),
  check (cardinality(preferred_formats) <= 20)
);

create table public.catalog_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  raw_query text not null check (char_length(raw_query) between 2 and 1000),
  interpreted_objective text check (interpreted_objective is null or char_length(interpreted_objective) <= 2000),
  objective_type text check (objective_type is null or objective_type in ('subject', 'topic', 'goal', 'profession', 'project', 'exam', 'exploration')),
  detected_topics jsonb not null default '[]'::jsonb
    check (jsonb_typeof(detected_topics) = 'array' and octet_length(detected_topics::text) <= 8192),
  selected_level text,
  filters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(filters) = 'object' and octet_length(filters::text) <= 8192),
  result_count integer not null default 0 check (result_count >= 0),
  interpretation_source text not null default 'deterministic'
    check (interpretation_source in ('deterministic', 'eve')),
  created_at timestamptz not null default clock_timestamp()
);

create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  objective text not null check (char_length(objective) between 1 and 4000),
  initial_level text not null default 'no_experience',
  target_level text not null default 'intermediate',
  weekly_hours numeric(5,2) check (weekly_hours is null or weekly_hours between 0.5 and 168),
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes between 1 and 1000000),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  generated_by text not null default 'deterministic' check (generated_by in ('deterministic', 'eve', 'user')),
  rationale text check (rationale is null or char_length(rationale) <= 4000),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table public.learning_path_modules (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  description text check (description is null or char_length(description) <= 4000),
  order_index integer not null check (order_index between 0 and 1000),
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes between 1 and 1000000),
  prerequisites jsonb not null default '[]'::jsonb
    check (jsonb_typeof(prerequisites) = 'array' and octet_length(prerequisites::text) <= 8192),
  completion_criteria jsonb not null default '[]'::jsonb
    check (jsonb_typeof(completion_criteria) = 'array' and octet_length(completion_criteria::text) <= 8192),
  created_at timestamptz not null default clock_timestamp(),
  unique (learning_path_id, order_index)
);

create table public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.learning_path_modules(id) on delete cascade,
  catalog_material_id uuid references public.catalog_materials(id) on delete restrict,
  item_type text not null check (item_type in ('material', 'exercise', 'project', 'checkpoint')),
  title text not null check (char_length(title) between 1 and 240),
  description text check (description is null or char_length(description) <= 4000),
  order_index integer not null check (order_index between 0 and 1000),
  is_required boolean not null default true,
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes between 1 and 1000000),
  created_at timestamptz not null default clock_timestamp(),
  unique (module_id, order_index),
  check ((item_type = 'material' and catalog_material_id is not null) or item_type <> 'material')
);

create table public.learning_path_room_imports (
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  imported_by uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null,
  imported_at timestamptz not null default clock_timestamp(),
  primary key (path_id, room_id),
  foreign key (course_id, room_id) references public.courses(id, room_id) on delete cascade
);

alter table public.ai_usage_events alter column room_id drop not null;
alter table public.ai_usage_events alter column material_id drop not null;
alter table public.ai_usage_events add column feature_scope text not null default 'translation'
  check (feature_scope in ('translation', 'catalog', 'tutor'));

create index catalog_topics_parent_idx on public.catalog_topics(parent_id, sort_order) where is_active;
create index catalog_topics_aliases_idx on public.catalog_topics using gin(aliases);
create index catalog_materials_filter_idx on public.catalog_materials(language, level, price_type, material_type) where is_active;
create index catalog_material_topics_topic_idx on public.catalog_material_topics(topic_id, relevance_score desc);
create index catalog_searches_user_idx on public.catalog_searches(user_id, created_at desc);
create index learning_paths_owner_idx on public.learning_paths(owner_user_id, updated_at desc);
create index learning_path_modules_path_idx on public.learning_path_modules(learning_path_id, order_index);
create index learning_path_items_module_idx on public.learning_path_items(module_id, order_index);

create trigger catalog_topics_set_updated_at before update on public.catalog_topics
for each row execute function public.set_updated_at();
create trigger catalog_materials_set_updated_at before update on public.catalog_materials
for each row execute function public.set_updated_at();
create trigger user_learning_preferences_set_updated_at before update on public.user_learning_preferences
for each row execute function public.set_updated_at();
create trigger learning_paths_set_updated_at before update on public.learning_paths
for each row execute function public.set_updated_at();

alter table public.catalog_topics enable row level security;
alter table public.catalog_materials enable row level security;
alter table public.catalog_material_topics enable row level security;
alter table public.saved_catalog_materials enable row level security;
alter table public.user_learning_preferences enable row level security;
alter table public.catalog_searches enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_modules enable row level security;
alter table public.learning_path_items enable row level security;
alter table public.learning_path_room_imports enable row level security;

create policy catalog_topics_read_active on public.catalog_topics for select to authenticated
using (is_active);
create policy catalog_materials_read_active on public.catalog_materials for select to authenticated
using (is_active and verification_status <> 'rejected');
create policy catalog_material_topics_read on public.catalog_material_topics for select to authenticated
using (exists (select 1 from public.catalog_materials m where m.id = material_id and m.is_active and m.verification_status <> 'rejected'));

create policy saved_catalog_materials_own on public.saved_catalog_materials for select to authenticated
using ((select auth.uid()) = user_id);
create policy saved_catalog_materials_insert_own on public.saved_catalog_materials for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy saved_catalog_materials_delete_own on public.saved_catalog_materials for delete to authenticated
using ((select auth.uid()) = user_id);

create policy user_learning_preferences_own on public.user_learning_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy user_learning_preferences_insert_own on public.user_learning_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy user_learning_preferences_update_own on public.user_learning_preferences for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_learning_preferences_delete_own on public.user_learning_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

create policy catalog_searches_own on public.catalog_searches for select to authenticated
using ((select auth.uid()) = user_id);
create policy catalog_searches_insert_own on public.catalog_searches for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy catalog_searches_delete_own on public.catalog_searches for delete to authenticated
using ((select auth.uid()) = user_id);

create policy learning_paths_own on public.learning_paths for select to authenticated
using ((select auth.uid()) = owner_user_id);
create policy learning_paths_insert_own on public.learning_paths for insert to authenticated
with check ((select auth.uid()) = owner_user_id);
create policy learning_paths_update_own on public.learning_paths for update to authenticated
using ((select auth.uid()) = owner_user_id) with check ((select auth.uid()) = owner_user_id);
create policy learning_paths_delete_own on public.learning_paths for delete to authenticated
using ((select auth.uid()) = owner_user_id);

create policy learning_path_modules_own on public.learning_path_modules for select to authenticated
using (exists (select 1 from public.learning_paths p where p.id = learning_path_id and p.owner_user_id = (select auth.uid())));
create policy learning_path_modules_insert_own on public.learning_path_modules for insert to authenticated
with check (exists (select 1 from public.learning_paths p where p.id = learning_path_id and p.owner_user_id = (select auth.uid())));
create policy learning_path_modules_update_own on public.learning_path_modules for update to authenticated
using (exists (select 1 from public.learning_paths p where p.id = learning_path_id and p.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.learning_paths p where p.id = learning_path_id and p.owner_user_id = (select auth.uid())));
create policy learning_path_modules_delete_own on public.learning_path_modules for delete to authenticated
using (exists (select 1 from public.learning_paths p where p.id = learning_path_id and p.owner_user_id = (select auth.uid())));

create policy learning_path_items_own on public.learning_path_items for select to authenticated
using (exists (select 1 from public.learning_path_modules m join public.learning_paths p on p.id = m.learning_path_id where m.id = module_id and p.owner_user_id = (select auth.uid())));
create policy learning_path_items_insert_own on public.learning_path_items for insert to authenticated
with check (exists (select 1 from public.learning_path_modules m join public.learning_paths p on p.id = m.learning_path_id where m.id = module_id and p.owner_user_id = (select auth.uid())));
create policy learning_path_items_update_own on public.learning_path_items for update to authenticated
using (exists (select 1 from public.learning_path_modules m join public.learning_paths p on p.id = m.learning_path_id where m.id = module_id and p.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.learning_path_modules m join public.learning_paths p on p.id = m.learning_path_id where m.id = module_id and p.owner_user_id = (select auth.uid())));
create policy learning_path_items_delete_own on public.learning_path_items for delete to authenticated
using (exists (select 1 from public.learning_path_modules m join public.learning_paths p on p.id = m.learning_path_id where m.id = module_id and p.owner_user_id = (select auth.uid())));

create policy learning_path_room_imports_visible on public.learning_path_room_imports for select to authenticated
using (imported_by = (select auth.uid()) or public.is_room_member(room_id));

revoke all on public.catalog_topics, public.catalog_materials, public.catalog_material_topics,
  public.saved_catalog_materials, public.user_learning_preferences, public.catalog_searches,
  public.learning_paths, public.learning_path_modules, public.learning_path_items,
  public.learning_path_room_imports from public, anon, authenticated;

grant select on public.catalog_topics, public.catalog_materials, public.catalog_material_topics to authenticated;
grant select, insert, delete on public.saved_catalog_materials to authenticated;
grant select, insert, delete on public.catalog_searches to authenticated;
grant select, insert, update, delete on public.user_learning_preferences to authenticated;
grant select, insert, update, delete on public.learning_paths to authenticated;
grant select, insert, update, delete on public.learning_path_modules to authenticated;
grant select, insert, update, delete on public.learning_path_items to authenticated;
grant select on public.learning_path_room_imports to authenticated;

create or replace function public.reserve_catalog_ai_usage(
  p_user_id uuid,
  p_model_id text,
  p_request_hash text,
  p_estimated_cost_usd numeric,
  p_daily_limit integer
)
returns table(allowed boolean, usage_id uuid, reason_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_usage_id uuid;
begin
  if p_daily_limit < 1 or p_daily_limit > 10000 or not exists (select 1 from public.profiles p where p.id = p_user_id) then
    return query select false, null::uuid, 'ACCESS_DENIED'::text;
    return;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 47811));
  select count(*)::integer into v_count from public.ai_usage_events e
  where e.user_id = p_user_id and e.cache_hit = false
    and e.created_at >= pg_catalog.date_trunc('day', clock_timestamp())
    and e.status in ('reserved', 'completed', 'failed_after_dispatch');
  if v_count >= p_daily_limit then
    return query select false, null::uuid, 'DAILY_LIMIT_REACHED'::text;
    return;
  end if;
  begin
    insert into public.ai_usage_events (
      user_id, room_id, material_id, operation_type, model_id, routing_mode,
      request_hash, estimated_cost_usd, cache_hit, status, feature_scope
    ) values (
      p_user_id, null, null, 'catalog_interpretation', pg_catalog.left(p_model_id, 160),
      'eve_catalog', p_request_hash, p_estimated_cost_usd, false, 'reserved', 'catalog'
    ) returning id into v_usage_id;
  exception when unique_violation then
    return query select false, null::uuid, 'REQUEST_IN_PROGRESS'::text;
    return;
  end;
  return query select true, v_usage_id, 'RESERVED'::text;
end;
$$;

revoke all on function public.reserve_catalog_ai_usage(uuid, text, text, numeric, integer) from public, anon, authenticated;
grant execute on function public.reserve_catalog_ai_usage(uuid, text, text, numeric, integer) to service_role;

create or replace function public.add_catalog_material_to_room(p_material_id uuid, p_room_id uuid, p_course_id uuid default null)
returns table(course_id uuid, material_id uuid, already_present boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_catalog public.catalog_materials%rowtype;
  v_course uuid := p_course_id;
  v_material uuid;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED'; end if;
  select * into v_catalog from public.catalog_materials
  where id = p_material_id and is_active and verification_status <> 'rejected';
  if not found then raise exception 'CATALOG_MATERIAL_NOT_FOUND'; end if;
  if v_course is not null and not exists (select 1 from public.courses c where c.id = v_course and c.room_id = p_room_id) then
    raise exception 'COURSE_NOT_FOUND';
  end if;
  select m.id, m.course_id into v_material, v_course from public.materials m
  where m.room_id = p_room_id and m.metadata ->> 'catalog_material_id' = p_material_id::text limit 1;
  if found then return query select v_course, v_material, true; return; end if;
  if v_course is null then
    insert into public.courses(room_id, title, description, created_by)
    values (p_room_id, pg_catalog.left('Catalogo · ' || v_catalog.title, 200), 'Materiale verificato aggiunto dal Catalogo.', v_user)
    returning id into v_course;
  end if;
  insert into public.materials(room_id, course_id, type, title, description, url, storage_path, metadata, created_by)
  values (
    p_room_id, v_course, 'link', v_catalog.title, v_catalog.description, v_catalog.source_url, null,
    pg_catalog.jsonb_build_object('catalog_material_id', v_catalog.id, 'provider', v_catalog.provider,
      'verification_status', v_catalog.verification_status, 'source_origin', v_catalog.source_origin), v_user
  ) returning id into v_material;
  insert into public.activity_events(room_id, actor_id, event_type, entity_type, entity_id, summary, payload)
  values (p_room_id, v_user, 'catalog_material_added', 'material', v_material,
    'ha aggiunto un materiale dal Catalogo', pg_catalog.jsonb_build_object('title', v_catalog.title, 'provider', v_catalog.provider));
  return query select v_course, v_material, false;
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
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED'; end if;
  select * into v_path from public.learning_paths where id = p_path_id and owner_user_id = v_user;
  if not found then raise exception 'LEARNING_PATH_NOT_FOUND'; end if;
  select i.course_id into v_course from public.learning_path_room_imports i where i.path_id = p_path_id and i.room_id = p_room_id;
  if found then return query select v_course, 0, 0; return; end if;
  insert into public.courses(room_id, title, description, created_by)
  values (p_room_id, v_path.title, v_path.objective, v_user) returning id into v_course;
  for v_module in select * from public.learning_path_modules where learning_path_id = p_path_id order by order_index loop
    insert into public.tasks(room_id, created_by, assigned_to, assignment_mode, title, description, completed, priority)
    values (p_room_id, v_user, null, 'everyone', pg_catalog.left('Modulo ' || (v_module.order_index + 1)::text || ' · ' || v_module.title, 300),
      v_module.description, false, 'medium');
    v_task_count := v_task_count + 1;
    for v_item in
      select i.*, cm.title as material_title, cm.description as material_description, cm.source_url,
        cm.provider, cm.verification_status, cm.source_origin
      from public.learning_path_items i
      left join public.catalog_materials cm on cm.id = i.catalog_material_id
      where i.module_id = v_module.id order by i.order_index
    loop
      if v_item.item_type = 'material' and v_item.catalog_material_id is not null and v_item.source_url is not null then
        if not exists (select 1 from public.materials m where m.room_id = p_room_id and m.metadata ->> 'catalog_material_id' = v_item.catalog_material_id::text) then
          insert into public.materials(room_id, course_id, type, title, description, url, storage_path, metadata, created_by)
          values (p_room_id, v_course, 'link', v_item.material_title, v_item.material_description, v_item.source_url, null,
            pg_catalog.jsonb_build_object('catalog_material_id', v_item.catalog_material_id, 'provider', v_item.provider,
              'verification_status', v_item.verification_status, 'source_origin', v_item.source_origin, 'path_id', p_path_id), v_user);
          v_material_count := v_material_count + 1;
        end if;
      else
        insert into public.tasks(room_id, created_by, assigned_to, assignment_mode, title, description, completed, priority)
        values (p_room_id, v_user, null, 'everyone', pg_catalog.left(v_item.title, 300), v_item.description, false, 'medium');
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

revoke all on function public.add_catalog_material_to_room(uuid, uuid, uuid) from public, anon;
revoke all on function public.add_learning_path_to_room(uuid, uuid) from public, anon;
grant execute on function public.add_catalog_material_to_room(uuid, uuid, uuid) to authenticated;
grant execute on function public.add_learning_path_to_room(uuid, uuid) to authenticated;

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
  select coalesce(sum(coalesce((module.value ->> 'estimatedDurationMinutes')::integer, 0)), 0)::integer
  into v_estimated from jsonb_array_elements(p_modules) module(value);
  insert into public.learning_paths(
    owner_user_id,title,objective,initial_level,target_level,weekly_hours,
    estimated_duration_minutes,status,generated_by,rationale
  ) values (
    v_user,pg_catalog.btrim(p_title),pg_catalog.btrim(p_objective),p_initial_level,p_target_level,
    p_weekly_hours,nullif(v_estimated,0),'draft',p_generated_by,p_rationale
  ) returning id into v_path_id;
  for v_module in
    select value, ordinality from jsonb_array_elements(p_modules) with ordinality
  loop
    if jsonb_typeof(v_module.value -> 'items') <> 'array'
       or jsonb_array_length(v_module.value -> 'items') > 30 then
      raise exception 'INVALID_MODULE_ITEMS';
    end if;
    insert into public.learning_path_modules(
      learning_path_id,title,description,order_index,estimated_duration_minutes,
      prerequisites,completion_criteria
    ) values (
      v_path_id,pg_catalog.left(v_module.value ->> 'title',240),
      pg_catalog.left(v_module.value ->> 'description',4000),(v_module.ordinality - 1)::integer,
      nullif(v_module.value ->> 'estimatedDurationMinutes','')::integer,
      coalesce(v_module.value -> 'prerequisites','[]'::jsonb),
      coalesce(v_module.value -> 'completionCriteria','[]'::jsonb)
    ) returning id into v_module_id;
    for v_item in
      select value, ordinality from jsonb_array_elements(v_module.value -> 'items') with ordinality
    loop
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
        module_id,catalog_material_id,item_type,title,description,order_index,
        is_required,estimated_duration_minutes
      ) values (
        v_module_id,v_material_id,v_item.value ->> 'itemType',
        pg_catalog.left(v_item.value ->> 'title',240),
        pg_catalog.left(v_item.value ->> 'description',4000),(v_item.ordinality - 1)::integer,
        coalesce((v_item.value ->> 'isRequired')::boolean,true),
        nullif(v_item.value ->> 'estimatedDurationMinutes','')::integer
      );
    end loop;
  end loop;
  return v_path_id;
end;
$$;

revoke all on function public.create_learning_path_from_json(text,text,text,text,numeric,text,text,jsonb) from public, anon;
grant execute on function public.create_learning_path_from_json(text,text,text,text,numeric,text,text,jsonb) to authenticated;

-- Stable initial taxonomy.
insert into public.catalog_topics(id,name,slug,description,parent_id,topic_type,aliases,sort_order) values
('10000000-0000-4000-8000-000000000001','Programmazione','programmazione','Fondamenti, linguaggi e pratiche per creare software.',null,'area',array['coding','sviluppo software','programmare'],10),
('10000000-0000-4000-8000-000000000002','Sviluppo web','sviluppo-web','Frontend, backend, API, database e pubblicazione.',null,'area',array['web development','siti web','web app'],20),
('10000000-0000-4000-8000-000000000003','Intelligenza artificiale','intelligenza-artificiale','Fondamenti e applicazioni dei sistemi di intelligenza artificiale.',null,'area',array['ai','ia','artificial intelligence'],30),
('10000000-0000-4000-8000-000000000004','Matematica','matematica','Dai fondamenti al calcolo e alla statistica.',null,'area',array['math','mathematics'],40),
('10000000-0000-4000-8000-000000000005','Fisica','fisica','Meccanica, energia, onde e modelli del mondo fisico.',null,'area',array['physics'],50),
('10000000-0000-4000-8000-000000000006','Spazio e astronomia','spazio-astronomia','Astronomia, scienze spaziali e dati satellitari.',null,'area',array['spazio','astronomia','space','aerospace'],60),
('10000000-0000-4000-8000-000000000007','Robotica','robotica','Elettronica, sensori, controllo e sistemi autonomi.',null,'area',array['robotics','embedded','sistemi autonomi'],70),
('10000000-0000-4000-8000-000000000008','Inglese','inglese','Comprensione, grammatica e comunicazione in lingua inglese.',null,'area',array['english','lingua inglese'],80),
('10000000-0000-4000-8000-000000000009','Preparazione esami','preparazione-esami','Organizzazione e ripasso mirato per prove ed esami.',null,'exam',array['esame','test','verifica'],90)
on conflict (slug) do update set name=excluded.name,description=excluded.description,aliases=excluded.aliases,sort_order=excluded.sort_order,is_active=true;

insert into public.catalog_topics(id,name,slug,description,parent_id,topic_type,level,aliases,sort_order) values
('11000000-0000-4000-8000-000000000001','Python','python','Linguaggio general purpose adatto ad automazione, dati e backend.','10000000-0000-4000-8000-000000000001','skill','beginner',array['python 3'],10),
('11000000-0000-4000-8000-000000000002','JavaScript','javascript','Linguaggio del web e delle applicazioni multipiattaforma.','10000000-0000-4000-8000-000000000001','skill','beginner',array['js'],20),
('11000000-0000-4000-8000-000000000003','TypeScript','typescript','JavaScript con tipi statici.','10000000-0000-4000-8000-000000000001','skill','intermediate',array['ts'],30),
('11000000-0000-4000-8000-000000000004','Frontend','frontend','Interfacce web, HTML, CSS e JavaScript.','10000000-0000-4000-8000-000000000002','subject','beginner',array['front end','interfacce web'],10),
('11000000-0000-4000-8000-000000000005','Backend e API','backend-api','Server, API, autenticazione e logica applicativa.','10000000-0000-4000-8000-000000000002','subject','intermediate',array['backend','api','server'],20),
('11000000-0000-4000-8000-000000000006','Database','database','Modellazione, SQL e gestione dei dati.','10000000-0000-4000-8000-000000000002','subject','beginner',array['sql','postgresql','dati'],30),
('11000000-0000-4000-8000-000000000007','Machine learning','machine-learning','Modelli che apprendono da dati ed esempi.','10000000-0000-4000-8000-000000000003','subject','intermediate',array['ml','apprendimento automatico'],10),
('11000000-0000-4000-8000-000000000008','AI generativa','ai-generativa','Modelli generativi, API e applicazioni assistite.','10000000-0000-4000-8000-000000000003','subject','intermediate',array['generative ai','genai','llm'],20),
('11000000-0000-4000-8000-000000000009','Algebra','algebra','Espressioni, equazioni, funzioni e strutture algebriche.','10000000-0000-4000-8000-000000000004','subject','beginner',array['equazioni'],10),
('11000000-0000-4000-8000-000000000010','Analisi matematica','analisi-matematica','Limiti, derivate, integrali e serie.','10000000-0000-4000-8000-000000000004','subject','university',array['calculus','analisi','calcolo'],20),
('11000000-0000-4000-8000-000000000011','Statistica','statistica','Descrizione, inferenza e interpretazione dei dati.','10000000-0000-4000-8000-000000000004','subject','intermediate',array['statistics','probabilita'],30),
('11000000-0000-4000-8000-000000000012','Simulazione scientifica','simulazione-scientifica','Modelli numerici e software per simulare sistemi fisici.','10000000-0000-4000-8000-000000000005','profession','advanced',array['simulation software engineer','calcolo scientifico','modellazione numerica'],10),
('11000000-0000-4000-8000-000000000013','Dati satellitari','dati-satellitari','Osservazione della Terra e analisi di immagini e segnali satellitari.','10000000-0000-4000-8000-000000000006','profession','intermediate',array['satellite data','earth observation'],10),
('11000000-0000-4000-8000-000000000014','Sistemi autonomi','sistemi-autonomi','Sensori, controllo e decisioni automatiche per robot e veicoli.','10000000-0000-4000-8000-000000000007','subject','advanced',array['autonomous systems','robotica spaziale'],10)
on conflict (slug) do update set name=excluded.name,description=excluded.description,parent_id=excluded.parent_id,aliases=excluded.aliases,level=excluded.level,sort_order=excluded.sort_order,is_active=true;

insert into public.catalog_materials(
  id,title,description,author,provider,source_url,material_type,language,level,price_type,
  certificate_available,prerequisites,license_type,verification_status,source_origin,verified_at,last_checked_at,viewer_compatibility
) values
('20000000-0000-4000-8000-000000000001','The Python Tutorial','Tutoriale ufficiale che introduce concetti e caratteristiche principali di Python. Richiede una comprensione di base della programmazione.','Python documentation contributors','Python Software Foundation','https://docs.python.org/3/tutorial/','documentation','en','beginner','free',false,'["Fondamenti di programmazione"]','Python Software Foundation License Version 2','official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000002','The TypeScript Handbook','Guida ufficiale completa alla sintassi e al sistema di tipi di TypeScript.','TypeScript documentation contributors','Microsoft','https://www.typescriptlang.org/docs/handbook/intro.html','documentation','en','intermediate','free',false,'["JavaScript"]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000003','Learn web development','Percorso MDN per apprendere le competenze fondamentali dello sviluppo web.','MDN contributors','Mozilla MDN','https://developer.mozilla.org/en-US/docs/Learn_web_development','course','en','beginner','free',false,'[]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000004','Learn Next.js','Corso ufficiale interattivo per costruire un’applicazione Next.js.','Vercel','Vercel','https://nextjs.org/learn','course','en','intermediate','free',false,'["React","JavaScript"]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000005','PostgreSQL Tutorial','Tutoriale ufficiale introduttivo al database PostgreSQL e al linguaggio SQL.','PostgreSQL Global Development Group','PostgreSQL','https://www.postgresql.org/docs/current/tutorial.html','documentation','en','beginner','free',false,'[]','PostgreSQL License','official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000006','OpenAI API documentation','Documentazione ufficiale per costruire applicazioni con i modelli e le API OpenAI.','OpenAI','OpenAI','https://developers.openai.com/api/docs','documentation','en','intermediate','free',false,'["Programmazione","API HTTP"]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000007','scikit-learn User Guide','Guida ufficiale agli algoritmi, alla valutazione e ai flussi di lavoro di machine learning in Python.','scikit-learn developers','scikit-learn','https://scikit-learn.org/stable/user_guide.html','documentation','en','intermediate','free',false,'["Python","Algebra di base","Statistica di base"]','BSD-3-Clause','official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000008','Single Variable Calculus','Corso universitario MIT OpenCourseWare con video, appunti, esercizi ed esami sul calcolo a una variabile.','Prof. David Jerison','MIT OpenCourseWare','https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/','course','en','university','free',false,'["Algebra","Trigonometria"]','Creative Commons','verified','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000009','Algebra','Percorso Khan Academy dedicato ad algebra, equazioni e funzioni.','Khan Academy','Khan Academy','https://www.khanacademy.org/math/algebra','course','en','beginner','free',false,'["Aritmetica"]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000010','NASA Learning Resources','Raccolta ufficiale NASA di risorse STEM per studenti, educatori, università e professionisti.','NASA','NASA','https://www.nasa.gov/learning-resources/','interactive','en','beginner','free',false,'[]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000011','ESA Education','Portale educativo ufficiale dell’Agenzia Spaziale Europea.','European Space Agency','ESA','https://www.esa.int/Education','interactive','en','beginner','free',false,'[]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external'),
('20000000-0000-4000-8000-000000000012','Arduino Learn','Guide ufficiali Arduino su elettronica, programmazione, sensori e progetti.','Arduino','Arduino','https://docs.arduino.cc/learn/','documentation','en','beginner','free',false,'["Fondamenti di programmazione"]',null,'official_source','verified',clock_timestamp(),clock_timestamp(),'external')
on conflict (source_url) do update set title=excluded.title,description=excluded.description,provider=excluded.provider,
  material_type=excluded.material_type,language=excluded.language,level=excluded.level,price_type=excluded.price_type,
  prerequisites=excluded.prerequisites,verification_status=excluded.verification_status,source_origin=excluded.source_origin,
  verified_at=excluded.verified_at,last_checked_at=excluded.last_checked_at,is_active=true;

insert into public.catalog_material_topics(material_id,topic_id,relevance_score,is_primary) values
('20000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001',1,true),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',0.8,false),
('20000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000003',1,true),
('20000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000002',0.8,false),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002',1,true),
('20000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000004',0.9,false),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002',0.9,false),
('20000000-0000-4000-8000-000000000004','11000000-0000-4000-8000-000000000005',0.8,false),
('20000000-0000-4000-8000-000000000005','11000000-0000-4000-8000-000000000006',1,true),
('20000000-0000-4000-8000-000000000006','11000000-0000-4000-8000-000000000008',1,true),
('20000000-0000-4000-8000-000000000006','11000000-0000-4000-8000-000000000005',0.7,false),
('20000000-0000-4000-8000-000000000007','11000000-0000-4000-8000-000000000007',1,true),
('20000000-0000-4000-8000-000000000007','11000000-0000-4000-8000-000000000011',0.7,false),
('20000000-0000-4000-8000-000000000008','11000000-0000-4000-8000-000000000010',1,true),
('20000000-0000-4000-8000-000000000008','11000000-0000-4000-8000-000000000012',0.6,false),
('20000000-0000-4000-8000-000000000009','11000000-0000-4000-8000-000000000009',1,true),
('20000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000006',1,true),
('20000000-0000-4000-8000-000000000010','11000000-0000-4000-8000-000000000013',0.7,false),
('20000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000006',1,true),
('20000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000007',1,true),
('20000000-0000-4000-8000-000000000012','11000000-0000-4000-8000-000000000014',0.6,false)
on conflict (material_id,topic_id) do update set relevance_score=excluded.relevance_score,is_primary=excluded.is_primary;

commit;

-- Modular room UI support and non-destructive, authorized content removal.
begin;

alter table public.courses
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

alter table public.materials
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

alter table public.tasks
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

create index if not exists courses_room_active_idx
  on public.courses(room_id, created_at) where archived_at is null;
create index if not exists materials_room_active_idx
  on public.materials(room_id, course_id, created_at desc) where archived_at is null;
create index if not exists tasks_room_active_order_idx
  on public.tasks(room_id, order_index, created_at desc) where archived_at is null;

create table if not exists public.room_content_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  material_id uuid,
  storage_path text not null check (char_length(storage_path) between 1 and 1024),
  requested_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','completed')),
  attempts integer not null default 0 check (attempts between 0 and 1000),
  error_code text check (error_code is null or char_length(error_code) <= 80),
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz
);

create unique index if not exists room_content_cleanup_jobs_pending_path_idx
  on public.room_content_cleanup_jobs(room_id, storage_path)
  where status = 'pending';

alter table public.room_content_cleanup_jobs enable row level security;
revoke all on public.room_content_cleanup_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.room_content_cleanup_jobs to service_role;

create or replace function public.get_course_removal_impact(p_course_id uuid, p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_course public.courses%rowtype;
  v_path_id uuid;
  v_material_count integer := 0;
  v_task_count integer := 0;
  v_progress_count integer := 0;
begin
  if v_user is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  select * into v_course from public.courses where id = p_course_id and room_id = p_room_id;
  if not found then raise exception 'COURSE_NOT_FOUND'; end if;
  if not public.is_room_admin(p_room_id) and v_course.created_by is distinct from v_user then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  select imports.path_id into v_path_id
  from public.learning_path_room_imports imports
  where imports.course_id = p_course_id and imports.room_id = p_room_id
  limit 1;
  select count(*)::integer into v_material_count from public.materials
    where room_id = p_room_id and course_id = p_course_id and archived_at is null;
  if v_path_id is not null then
    select count(*)::integer into v_task_count from public.tasks
      where room_id = p_room_id and learning_path_id = v_path_id and archived_at is null;
  end if;
  select count(*)::integer into v_progress_count from public.progress_entries
    where room_id = p_room_id and course_id = p_course_id;
  return pg_catalog.jsonb_build_object(
    'id', v_course.id,
    'title', v_course.title,
    'materialCount', v_material_count,
    'taskCount', v_task_count,
    'progressCount', v_progress_count,
    'importedFromCatalog', v_path_id is not null,
    'alreadyRemoved', v_course.archived_at is not null
  );
end;
$$;

create or replace function public.get_material_removal_impact(p_material_id uuid, p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_material public.materials%rowtype;
  v_course_title text;
  v_reader_count integer := 0;
  v_note_count integer := 0;
begin
  if v_user is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  select * into v_material from public.materials where id = p_material_id and room_id = p_room_id;
  if not found then raise exception 'MATERIAL_NOT_FOUND'; end if;
  if not public.is_room_admin(p_room_id) and v_material.created_by is distinct from v_user then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  select title into v_course_title from public.courses where id = v_material.course_id and room_id = p_room_id;
  select count(*)::integer into v_reader_count from public.material_reader_progress
    where material_id = p_material_id and room_id = p_room_id;
  select count(*)::integer into v_note_count from public.shared_notes
    where material_id = p_material_id and room_id = p_room_id;
  return pg_catalog.jsonb_build_object(
    'id', v_material.id,
    'title', v_material.title,
    'type', v_material.type,
    'courseTitle', v_course_title,
    'readerProgressCount', v_reader_count,
    'noteCount', v_note_count,
    'checklistCount', 0,
    'importedFromCatalog', v_material.metadata ? 'catalog_material_id',
    'uploadedFile', v_material.storage_path is not null,
    'alreadyRemoved', v_material.archived_at is not null
  );
end;
$$;

create or replace function public.remove_room_material(p_material_id uuid, p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_material public.materials%rowtype;
  v_jobs jsonb := '[]'::jsonb;
begin
  if v_user is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('material:' || p_material_id::text, 14001));
  select * into v_material from public.materials where id = p_material_id and room_id = p_room_id for update;
  if not found then raise exception 'MATERIAL_NOT_FOUND'; end if;
  if not public.is_room_admin(p_room_id) and v_material.created_by is distinct from v_user then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  if v_material.archived_at is not null then
    return pg_catalog.jsonb_build_object('removed', true, 'alreadyRemoved', true, 'cleanup_jobs', '[]'::jsonb);
  end if;

  update public.materials set archived_at = clock_timestamp(), archived_by = v_user where id = p_material_id;
  if v_material.storage_path is not null and not exists (
    select 1 from public.materials other
    where other.id <> p_material_id and other.archived_at is null
      and other.storage_path = v_material.storage_path
  ) then
    insert into public.room_content_cleanup_jobs(room_id, material_id, storage_path, requested_by)
    values (p_room_id, p_material_id, v_material.storage_path, v_user)
    on conflict do nothing;
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', job.id, 'storage_path', job.storage_path)), '[]'::jsonb)
      into v_jobs from public.room_content_cleanup_jobs job
      where job.room_id = p_room_id and job.storage_path = v_material.storage_path and job.status = 'pending';
  end if;
  insert into public.activity_events(room_id, actor_id, event_type, entity_type, entity_id, summary, payload)
  values (p_room_id, v_user, 'material_removed', 'material', p_material_id,
    'ha rimosso il materiale “' || pg_catalog.left(v_material.title, 180) || '”',
    pg_catalog.jsonb_build_object('title', v_material.title, 'catalog_link', v_material.metadata ? 'catalog_material_id'));
  return pg_catalog.jsonb_build_object('removed', true, 'alreadyRemoved', false, 'cleanup_jobs', v_jobs);
end;
$$;

create or replace function public.remove_room_course(p_course_id uuid, p_room_id uuid, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_course public.courses%rowtype;
  v_path_id uuid;
  v_material_count integer := 0;
  v_task_count integer := 0;
  v_progress_count integer := 0;
  v_paths text[] := '{}'::text[];
  v_jobs jsonb := '[]'::jsonb;
begin
  if p_mode not in ('course_only','course_and_contents') then raise exception 'INVALID_REMOVAL_MODE'; end if;
  if v_user is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('course:' || p_course_id::text, 14002));
  select * into v_course from public.courses where id = p_course_id and room_id = p_room_id for update;
  if not found then raise exception 'COURSE_NOT_FOUND'; end if;
  if not public.is_room_admin(p_room_id) and v_course.created_by is distinct from v_user then
    raise exception using errcode = '42501', message = 'ACCESS_DENIED';
  end if;
  if v_course.archived_at is not null then
    return pg_catalog.jsonb_build_object('removed', true, 'alreadyRemoved', true, 'cleanup_jobs', '[]'::jsonb);
  end if;
  select imports.path_id into v_path_id from public.learning_path_room_imports imports
    where imports.course_id = p_course_id and imports.room_id = p_room_id limit 1;
  select count(*)::integer, coalesce(pg_catalog.array_agg(distinct storage_path) filter (where storage_path is not null), '{}'::text[])
    into v_material_count, v_paths from public.materials
    where room_id = p_room_id and course_id = p_course_id and archived_at is null;
  if v_path_id is not null then
    select count(*)::integer into v_task_count from public.tasks
      where room_id = p_room_id and learning_path_id = v_path_id and archived_at is null;
  end if;
  select count(*)::integer into v_progress_count from public.progress_entries
    where room_id = p_room_id and course_id = p_course_id;

  update public.courses set archived_at = clock_timestamp(), archived_by = v_user where id = p_course_id;
  delete from public.learning_path_room_imports where room_id = p_room_id and course_id = p_course_id;
  if p_mode = 'course_only' then
    update public.materials set course_id = null where room_id = p_room_id and course_id = p_course_id and archived_at is null;
    if v_path_id is not null then
      update public.tasks set learning_path_id = null, stage_id = null
      where room_id = p_room_id and learning_path_id = v_path_id and archived_at is null;
    end if;
  else
    update public.materials set archived_at = clock_timestamp(), archived_by = v_user
      where room_id = p_room_id and course_id = p_course_id and archived_at is null;
    if v_path_id is not null then
      update public.tasks set archived_at = clock_timestamp(), archived_by = v_user
      where room_id = p_room_id and learning_path_id = v_path_id and archived_at is null;
    end if;
    insert into public.room_content_cleanup_jobs(room_id, material_id, storage_path, requested_by)
    select p_room_id, archived.id, archived.storage_path, v_user
    from public.materials archived
    where archived.room_id = p_room_id and archived.course_id = p_course_id
      and archived.storage_path = any(v_paths)
      and not exists (
        select 1 from public.materials active
        where active.archived_at is null and active.storage_path = archived.storage_path
      )
    on conflict do nothing;
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', job.id, 'storage_path', job.storage_path)), '[]'::jsonb)
      into v_jobs from public.room_content_cleanup_jobs job
      where job.room_id = p_room_id and job.storage_path = any(v_paths) and job.status = 'pending';
  end if;
  insert into public.activity_events(room_id, actor_id, event_type, entity_type, entity_id, summary, payload)
  values (p_room_id, v_user, 'course_removed', 'course', p_course_id,
    'ha rimosso il corso “' || pg_catalog.left(v_course.title, 180) || '”',
    pg_catalog.jsonb_build_object('title', v_course.title, 'mode', p_mode, 'materials', v_material_count, 'tasks', v_task_count));
  return pg_catalog.jsonb_build_object(
    'removed', true, 'alreadyRemoved', false, 'materials', v_material_count,
    'tasks', v_task_count, 'progressPreserved', v_progress_count, 'cleanup_jobs', v_jobs
  );
end;
$$;

revoke all on function public.get_course_removal_impact(uuid,uuid) from public, anon;
revoke all on function public.get_material_removal_impact(uuid,uuid) from public, anon;
revoke all on function public.remove_room_material(uuid,uuid) from public, anon;
revoke all on function public.remove_room_course(uuid,uuid,text) from public, anon;
grant execute on function public.get_course_removal_impact(uuid,uuid) to authenticated;
grant execute on function public.get_material_removal_impact(uuid,uuid) to authenticated;
grant execute on function public.remove_room_material(uuid,uuid) to authenticated;
grant execute on function public.remove_room_course(uuid,uuid,text) to authenticated;

-- Archived Catalog links can be imported again without changing the Catalog record.
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
  v_archived timestamptz;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED'; end if;
  select * into v_catalog from public.catalog_materials where id = p_material_id and is_active and verification_status <> 'rejected';
  if not found then raise exception 'CATALOG_MATERIAL_NOT_FOUND'; end if;
  if v_course is not null and not exists (select 1 from public.courses c where c.id = v_course and c.room_id = p_room_id and c.archived_at is null) then raise exception 'COURSE_NOT_FOUND'; end if;
  select m.id, m.course_id, m.archived_at into v_material, v_course, v_archived from public.materials m
    where m.room_id = p_room_id and m.metadata ->> 'catalog_material_id' = p_material_id::text limit 1;
  if v_material is not null and v_archived is null then return query select v_course, v_material, true; return; end if;
  if v_course is null or not exists (select 1 from public.courses c where c.id = v_course and c.archived_at is null) then
    insert into public.courses(room_id, title, description, created_by)
    values (p_room_id, pg_catalog.left('Catalogo · ' || v_catalog.title, 200), 'Materiale verificato aggiunto dal Catalogo.', v_user)
    returning id into v_course;
  end if;
  if v_material is not null then
    update public.materials set course_id = v_course, archived_at = null, archived_by = null where id = v_material;
  else
    insert into public.materials(room_id, course_id, type, title, description, url, storage_path, metadata, created_by)
    values (p_room_id, v_course, 'link', v_catalog.title, v_catalog.description, v_catalog.source_url, null,
      pg_catalog.jsonb_build_object('catalog_material_id', v_catalog.id, 'provider', v_catalog.provider,
        'verification_status', v_catalog.verification_status, 'source_origin', v_catalog.source_origin), v_user)
    returning id into v_material;
  end if;
  insert into public.activity_events(room_id, actor_id, event_type, entity_type, entity_id, summary, payload)
  values (p_room_id, v_user, 'catalog_material_added', 'material', v_material,
    'ha aggiunto un materiale dal Catalogo', pg_catalog.jsonb_build_object('title', v_catalog.title, 'provider', v_catalog.provider));
  return query select v_course, v_material, false;
end;
$$;

revoke all on function public.add_catalog_material_to_room(uuid,uuid,uuid) from public, anon;
grant execute on function public.add_catalog_material_to_room(uuid,uuid,uuid) to authenticated;

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
  v_existing_material uuid;
  v_existing_archived timestamptz;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED'; end if;
  select * into v_path from public.learning_paths where id = p_path_id and owner_user_id = v_user;
  if not found then raise exception 'LEARNING_PATH_NOT_FOUND'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_path_id::text || ':' || p_room_id::text, 91313));
  select imports.course_id into v_course from public.learning_path_room_imports imports
    where imports.path_id = p_path_id and imports.room_id = p_room_id;
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
        v_existing_material := null;
        v_existing_archived := null;
        select material.id, material.archived_at into v_existing_material, v_existing_archived
        from public.materials material
        where material.room_id = p_room_id
          and material.metadata ->> 'catalog_material_id' = v_item.catalog_material_id::text
        limit 1;
        if v_existing_material is null then
          insert into public.materials(room_id, course_id, type, title, description, url, storage_path, metadata, created_by)
          values (p_room_id, v_course, 'link', v_item.material_title, v_item.material_description, v_item.source_url, null,
            pg_catalog.jsonb_build_object('catalog_material_id', v_item.catalog_material_id, 'provider', v_item.provider,
              'verification_status', v_item.verification_status, 'source_origin', v_item.source_origin, 'path_id', p_path_id,
              'stage_id', v_module.stage_id), v_user);
          v_material_count := v_material_count + 1;
        elsif v_existing_archived is not null then
          update public.materials set course_id = v_course, archived_at = null, archived_by = null,
            metadata = metadata || pg_catalog.jsonb_build_object('path_id', p_path_id, 'stage_id', v_module.stage_id)
          where id = v_existing_material;
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

revoke all on function public.add_learning_path_to_room(uuid,uuid) from public, anon;
grant execute on function public.add_learning_path_to_room(uuid,uuid) to authenticated;

commit;

begin;

-- The existing workspace remains unchanged; this migration only adds a native lesson adapter.
do $checks$
declare constraint_name text;
begin
  for constraint_name in
    select c.conname from pg_catalog.pg_constraint c
    join pg_catalog.pg_class t on t.oid = c.conrelid
    join pg_catalog.pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'catalog_materials' and c.contype = 'c'
      and pg_catalog.pg_get_constraintdef(c.oid) like '%internal_viewer%'
  loop execute pg_catalog.format('alter table public.catalog_materials drop constraint %I', constraint_name); end loop;
  for constraint_name in
    select c.conname from pg_catalog.pg_constraint c
    join pg_catalog.pg_class t on t.oid = c.conrelid
    join pg_catalog.pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'materials' and c.contype = 'c'
      and pg_catalog.pg_get_constraintdef(c.oid) like '%internal_viewer%'
  loop execute pg_catalog.format('alter table public.materials drop constraint %I', constraint_name); end loop;
  for constraint_name in
    select c.conname from pg_catalog.pg_constraint c
    join pg_catalog.pg_class t on t.oid = c.conrelid
    join pg_catalog.pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'material_reader_progress' and c.contype = 'c'
      and pg_catalog.pg_get_constraintdef(c.oid) like '%viewer%'
  loop execute pg_catalog.format('alter table public.material_reader_progress drop constraint %I', constraint_name); end loop;
end;
$checks$;

alter table public.catalog_materials add constraint catalog_materials_internal_viewer_check
  check (internal_viewer is null or internal_viewer in ('pdf','text','document','presentation','video','web-article','exercise','lesson'));
alter table public.materials add constraint materials_internal_viewer_check
  check (internal_viewer is null or internal_viewer in ('pdf','text','document','presentation','video','web-article','exercise','lesson'));
alter table public.material_reader_progress add constraint material_reader_progress_viewer_check
  check (viewer is null or viewer in ('pdf','text','document','presentation','video','web-article','exercise','lesson'));

insert into public.catalog_materials(
  title,description,author,provider,source_url,material_type,language,level,
  estimated_duration_minutes,price_type,certificate_available,prerequisites,license_type,
  verification_status,source_origin,verified_at,last_checked_at,viewer_compatibility,
  access_requirements,is_active,access_mode,monitoring_level,internal_viewer,import_status,
  internal_resource_id,access_notes
) values (
  'Che cosa significa programmare?',
  'Lezione nativa completa del percorso Programmazione da zero: teoria, glossario, esercizi, quiz, progetto, avanzamento ed Eve.',
  'Aula Studio Virtuale','Aula Studio Virtuale',
  'https://aula-studio-virtuale.vercel.app/internal/programming-0-1','interactive','it','no_experience',
  120,'free',false,'[]'::jsonb,'Contenuto editoriale interno',
  'verified','internal',clock_timestamp(),clock_timestamp(),'internal','{}',true,
  'internal','full','lesson','ready','9f219d2a-d532-4af2-bd97-5df8fc863101',
  '{"lesson_id":"programming-0-1","path_id":"programming-zero","runtime_ai":false}'::jsonb
) on conflict (source_url) do update set
  title=excluded.title,description=excluded.description,estimated_duration_minutes=excluded.estimated_duration_minutes,
  verification_status='verified',source_origin='internal',verified_at=clock_timestamp(),last_checked_at=clock_timestamp(),
  viewer_compatibility='internal',is_active=true,access_mode='internal',monitoring_level='full',
  internal_viewer='lesson',import_status='ready',internal_resource_id=excluded.internal_resource_id,
  access_notes=excluded.access_notes,updated_at=clock_timestamp();

insert into public.catalog_material_topics(material_id,topic_id,relevance_score,is_primary)
select material.id,topic.id,1.0,true from public.catalog_materials material
join public.catalog_topics topic on topic.slug in ('programmazione','python')
where material.source_url='https://aula-studio-virtuale.vercel.app/internal/programming-0-1'
on conflict (material_id,topic_id) do update set relevance_score=excluded.relevance_score,is_primary=excluded.is_primary;

create table public.native_lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null,
  material_id uuid not null,
  lesson_id text not null check (char_length(lesson_id) between 1 and 120),
  activity_id text not null check (char_length(activity_id) between 1 and 120),
  activity_type text not null check (activity_type in ('guided_exercise','independent_exercise','project','self_assessment')),
  response text not null check (char_length(response) between 20 and 8000),
  status text not null default 'submitted' check (status in ('draft','submitted')),
  submitted_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (material_id,room_id) references public.materials(id,room_id) on delete cascade,
  unique(user_id,material_id,activity_id)
);
create index native_lesson_submissions_room_user_idx on public.native_lesson_submissions(room_id,user_id,updated_at desc);
create trigger native_lesson_submissions_set_updated_at before update on public.native_lesson_submissions
  for each row execute function public.set_updated_at();
alter table public.native_lesson_submissions enable row level security;
create policy native_lesson_submissions_select_own on public.native_lesson_submissions for select to authenticated
  using ((select auth.uid())=user_id and public.is_room_member(room_id));
create policy native_lesson_submissions_insert_own on public.native_lesson_submissions for insert to authenticated
  with check ((select auth.uid())=user_id and public.is_room_member(room_id));
create policy native_lesson_submissions_update_own on public.native_lesson_submissions for update to authenticated
  using ((select auth.uid())=user_id and public.is_room_member(room_id))
  with check ((select auth.uid())=user_id and public.is_room_member(room_id));
create policy native_lesson_submissions_delete_own on public.native_lesson_submissions for delete to authenticated
  using ((select auth.uid())=user_id and public.is_room_member(room_id));
revoke all on public.native_lesson_submissions from public,anon,authenticated;
grant select,insert,update,delete on public.native_lesson_submissions to authenticated;

create or replace function public.record_native_lesson_progress(
  p_room_id uuid,p_material_id uuid,p_state jsonb,p_event_type text,p_client_event_id uuid,p_event_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := auth.uid(); v_material record; v_completion numeric; v_summary text; v_inserted integer := 0;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
  if jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>32768 then raise exception 'INVALID_STATE' using errcode='22023'; end if;
  if jsonb_typeof(coalesce(p_event_payload,'{}'::jsonb))<>'object' or octet_length(coalesce(p_event_payload,'{}'::jsonb)::text)>8192 then raise exception 'INVALID_EVENT_PAYLOAD' using errcode='22023'; end if;
  select id,course_id,title,internal_viewer,metadata into v_material from public.materials
    where id=p_material_id and room_id=p_room_id and archived_at is null;
  if not found then raise exception 'MATERIAL_NOT_FOUND' using errcode='P0002'; end if;
  if v_material.internal_viewer<>'lesson' or coalesce(v_material.metadata->>'lesson_id','')<>'programming-0-1' then raise exception 'INVALID_LESSON' using errcode='22023'; end if;
  if p_event_type is not null and p_event_type not in ('lesson_opened','lesson_section_viewed','lesson_section_completed','guided_exercise_started','guided_exercise_completed','independent_exercise_completed','quiz_started','quiz_answer_submitted','quiz_completed','project_started','project_submitted','lesson_completed','review_requested') then raise exception 'INVALID_EVENT' using errcode='22023'; end if;
  v_completion:=least(greatest(coalesce((p_state->>'completionPercentage')::numeric,0),0),100);
  insert into public.material_reader_progress(
    user_id,material_id,room_id,paragraph_index,token_index,scroll_ratio,document_position,last_opened_at,
    viewer,page_number,page_count,video_time_seconds,video_duration_seconds,watched_ranges,watched_unique_seconds,
    completion_percentage,active_seconds,learning_state,exercise_state,last_interaction_at
  ) values (
    v_user,p_material_id,p_room_id,0,0,0,coalesce(p_state->'documentPosition','{}'::jsonb),clock_timestamp(),
    'lesson',null,null,0,0,'[]'::jsonb,0,v_completion,least(coalesce((p_state->>'activeSeconds')::integer,0),100000000),
    case when p_state->>'state'='completed' then 'completed' else 'active' end,
    case when jsonb_typeof(p_state->'exerciseState')='object' and octet_length((p_state->'exerciseState')::text)<=16384 then p_state->'exerciseState' else '{}'::jsonb end,clock_timestamp()
  ) on conflict(user_id,material_id) do update set
    room_id=excluded.room_id,document_position=excluded.document_position,last_opened_at=clock_timestamp(),viewer='lesson',
    completion_percentage=excluded.completion_percentage,active_seconds=greatest(public.material_reader_progress.active_seconds,excluded.active_seconds),
    learning_state=excluded.learning_state,exercise_state=excluded.exercise_state,last_interaction_at=clock_timestamp();
  if p_event_type is not null then
    v_summary:=case
      when p_event_type='lesson_opened' then 'ha aperto la lezione '||v_material.title
      when p_event_type='lesson_section_viewed' then 'sta studiando una sezione di '||v_material.title
      when p_event_type='lesson_section_completed' then 'ha compreso una sezione di '||v_material.title
      when p_event_type='guided_exercise_started' then 'ha iniziato l''esercizio guidato'
      when p_event_type='guided_exercise_completed' then 'ha completato l''esercizio guidato'
      when p_event_type='independent_exercise_completed' then 'ha completato un esercizio della lezione'
      when p_event_type='quiz_started' then 'ha iniziato il quiz della lezione'
      when p_event_type='quiz_answer_submitted' then 'ha risposto a una domanda del quiz'
      when p_event_type='quiz_completed' then 'ha completato il quiz della lezione'
      when p_event_type='project_started' then 'ha iniziato il progetto della lezione'
      when p_event_type='project_submitted' then 'ha consegnato il progetto della lezione'
      when p_event_type='lesson_completed' then 'ha completato la lezione '||v_material.title
      else 'ha richiesto un ripasso a Eve' end;
    insert into public.activity_events(room_id,actor_id,event_type,entity_type,entity_id,summary,payload,client_event_id)
    values(p_room_id,v_user,p_event_type,'material',p_material_id,pg_catalog.left(v_summary,500),
      pg_catalog.jsonb_build_object('materialId',p_material_id,'courseId',v_material.course_id,'viewer','lesson','completionPercentage',v_completion)||coalesce(p_event_payload,'{}'::jsonb),p_client_event_id)
    on conflict(room_id,client_event_id) do nothing;
    get diagnostics v_inserted=row_count;
  end if;
  return pg_catalog.jsonb_build_object('saved',true,'eventRecorded',v_inserted>0,'serverTimestamp',clock_timestamp());
exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'INVALID_STATE' using errcode='22023';
end;
$$;
revoke all on function public.record_native_lesson_progress(uuid,uuid,jsonb,text,uuid,jsonb) from public,anon;
grant execute on function public.record_native_lesson_progress(uuid,uuid,jsonb,text,uuid,jsonb) to authenticated;

-- Replace only previous package-generated content; manually created room data is preserved.
create or replace function public.add_learning_path_to_room(p_path_id uuid,p_room_id uuid)
returns table(course_id uuid,materials_added integer,tasks_added integer)
language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid(); v_path public.learning_paths%rowtype; v_course uuid; v_module record; v_item record;
  v_material_count integer:=0; v_task_count integer:=0; v_task_type text; v_existing_material uuid; v_existing_archived timestamptz;
  v_is_programming_zero boolean:=false;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED'; end if;
  select * into v_path from public.learning_paths where id=p_path_id and owner_user_id=v_user;
  if not found then raise exception 'LEARNING_PATH_NOT_FOUND'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_path_id::text||':'||p_room_id::text,91313));
  select imports.course_id into v_course from public.learning_path_room_imports imports where imports.path_id=p_path_id and imports.room_id=p_room_id;
  if found then return query select v_course,0,0; return; end if;
  select exists(select 1 from public.learning_path_modules m where m.learning_path_id=p_path_id and m.stage_id='programming-module-0') into v_is_programming_zero;
  if v_is_programming_zero and v_path.title='Programmazione da zero' then
    select imports.course_id into v_course from public.learning_path_room_imports imports
      join public.learning_paths paths on paths.id=imports.path_id
      where imports.room_id=p_room_id and imports.imported_by=v_user and paths.title='Programmazione da zero'
      order by imports.imported_at desc limit 1;
    if v_course is not null then
      update public.materials set archived_at=clock_timestamp(),archived_by=v_user
        where room_id=p_room_id and course_id=v_course and archived_at is null and metadata ? 'catalog_material_id';
      delete from public.tasks where room_id=p_room_id and learning_path_id in (
        select imports.path_id from public.learning_path_room_imports imports where imports.room_id=p_room_id and imports.course_id=v_course
      );
      delete from public.learning_path_room_imports where room_id=p_room_id and course_id=v_course;
      update public.courses set title=v_path.title,description=v_path.objective where id=v_course and room_id=p_room_id;
    end if;
  end if;
  if v_course is null then insert into public.courses(room_id,title,description,created_by) values(p_room_id,v_path.title,v_path.objective,v_user) returning id into v_course; end if;
  for v_module in select * from public.learning_path_modules where learning_path_id=p_path_id order by order_index loop
    for v_item in select items.*,catalog.title material_title,catalog.description material_description,catalog.source_url,catalog.provider,catalog.verification_status,catalog.source_origin
      from public.learning_path_items items left join public.catalog_materials catalog on catalog.id=items.catalog_material_id
      where items.module_id=v_module.id order by items.order_index loop
      if v_item.item_type='material' and v_item.catalog_material_id is not null and v_item.source_url is not null then
        v_existing_material:=null;v_existing_archived:=null;
        select material.id,material.archived_at into v_existing_material,v_existing_archived from public.materials material
          where material.room_id=p_room_id and material.metadata->>'catalog_material_id'=v_item.catalog_material_id::text limit 1;
        if v_existing_material is null then
          insert into public.materials(room_id,course_id,type,title,description,url,storage_path,metadata,created_by)
          values(p_room_id,v_course,'link',v_item.material_title,v_item.material_description,v_item.source_url,null,
            pg_catalog.jsonb_build_object('catalog_material_id',v_item.catalog_material_id,'provider',v_item.provider,'verification_status',v_item.verification_status,'source_origin',v_item.source_origin,'path_id',p_path_id,'stage_id',v_module.stage_id,'lesson_id',case when v_item.source_url='https://aula-studio-virtuale.vercel.app/internal/programming-0-1' then 'programming-0-1' else null end),v_user);
          v_material_count:=v_material_count+1;
        elsif v_existing_archived is not null then
          update public.materials set course_id=v_course,archived_at=null,archived_by=null,metadata=metadata||pg_catalog.jsonb_build_object('path_id',p_path_id,'stage_id',v_module.stage_id,'lesson_id',case when v_item.source_url='https://aula-studio-virtuale.vercel.app/internal/programming-0-1' then 'programming-0-1' else metadata->>'lesson_id' end) where id=v_existing_material;
          v_material_count:=v_material_count+1;
        end if;
      else
        v_task_type:=case when v_item.item_type='project' then 'project' when v_item.item_type='checkpoint' then 'assessment' when v_item.title like 'Lezione %' then 'lesson' else 'exercise' end;
        insert into public.tasks(room_id,created_by,assigned_to,assignment_mode,title,description,completed,priority,learning_path_id,stage_id,task_type,order_index,completion_criteria,estimated_minutes)
        values(p_room_id,v_user,null,'everyone',pg_catalog.left(v_item.title,300),v_item.description,false,case when v_task_type in ('project','assessment') then 'high'::public.task_priority else 'medium'::public.task_priority end,p_path_id,v_module.stage_id,v_task_type,(v_module.order_index*100)+v_item.order_index,v_module.completion_criteria,v_item.estimated_duration_minutes);
        v_task_count:=v_task_count+1;
      end if;
    end loop;
  end loop;
  insert into public.learning_path_room_imports(path_id,room_id,imported_by,course_id) values(p_path_id,p_room_id,v_user,v_course);
  insert into public.activity_events(room_id,actor_id,event_type,entity_type,entity_id,summary,payload)
  values(p_room_id,v_user,case when v_is_programming_zero then 'learning_path_replaced' else 'learning_path_added' end,'course',v_course,case when v_is_programming_zero then 'ha aggiornato Programmazione da zero' else 'ha aggiunto un percorso dal Catalogo' end,pg_catalog.jsonb_build_object('path_id',p_path_id,'title',v_path.title));
  return query select v_course,v_material_count,v_task_count;
end;
$$;
revoke all on function public.add_learning_path_to_room(uuid,uuid) from public,anon;
grant execute on function public.add_learning_path_to_room(uuid,uuid) to authenticated;

commit;

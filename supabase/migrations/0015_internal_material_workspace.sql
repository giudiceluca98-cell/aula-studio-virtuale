begin;

alter table public.catalog_materials
  add column if not exists access_mode text not null default 'import-required'
    check (access_mode in ('internal','embedded','import-required','external-unmonitored','unsupported')),
  add column if not exists monitoring_level text not null default 'none'
    check (monitoring_level in ('full','partial','opened-only','none')),
  add column if not exists internal_viewer text
    check (internal_viewer is null or internal_viewer in ('pdf','text','document','presentation','video','web-article','exercise')),
  add column if not exists import_status text not null default 'pending'
    check (import_status in ('ready','pending','failed','not-required')),
  add column if not exists internal_resource_id uuid,
  add column if not exists access_notes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(access_notes) = 'object' and octet_length(access_notes::text) <= 8192);

alter table public.materials
  add column if not exists access_mode text not null default 'import-required'
    check (access_mode in ('internal','embedded','import-required','external-unmonitored','unsupported')),
  add column if not exists monitoring_level text not null default 'none'
    check (monitoring_level in ('full','partial','opened-only','none')),
  add column if not exists internal_viewer text
    check (internal_viewer is null or internal_viewer in ('pdf','text','document','presentation','video','web-article','exercise')),
  add column if not exists import_status text not null default 'pending'
    check (import_status in ('ready','pending','failed','not-required')),
  add column if not exists internal_resource_id uuid;

alter table public.material_reader_progress
  add column if not exists viewer text
    check (viewer is null or viewer in ('pdf','text','document','presentation','video','web-article','exercise')),
  add column if not exists page_number integer check (page_number is null or page_number >= 1),
  add column if not exists page_count integer check (page_count is null or page_count >= 1),
  add column if not exists video_time_seconds numeric(12,3) not null default 0 check (video_time_seconds >= 0),
  add column if not exists video_duration_seconds numeric(12,3) not null default 0 check (video_duration_seconds >= 0),
  add column if not exists watched_ranges jsonb not null default '[]'::jsonb
    check (jsonb_typeof(watched_ranges) = 'array' and octet_length(watched_ranges::text) <= 32768),
  add column if not exists watched_unique_seconds integer not null default 0 check (watched_unique_seconds >= 0),
  add column if not exists completion_percentage numeric(5,2) not null default 0 check (completion_percentage between 0 and 100),
  add column if not exists active_seconds integer not null default 0 check (active_seconds >= 0),
  add column if not exists learning_state text not null default 'opened'
    check (learning_state in ('opened','active','paused','completed')),
  add column if not exists exercise_state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(exercise_state) = 'object' and octet_length(exercise_state::text) <= 16384),
  add column if not exists last_interaction_at timestamptz not null default clock_timestamp();

update public.catalog_materials set
  access_mode = case
    when source_url ~* '^https://(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)/' or source_url ~* '\.(?:mp4|webm|ogg)(?:[?#]|$)' then 'embedded'
    when source_url ~* '\.pdf(?:[?#]|$)' then 'import-required'
    when material_type in ('exercise','quiz') then 'import-required'
    else 'import-required'
  end,
  monitoring_level = case
    when source_url ~* '^https://(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)/' or source_url ~* '\.(?:mp4|webm|ogg)(?:[?#]|$)' then 'full'
    when source_url ~* '\.pdf(?:[?#]|$)' then 'none'
    else 'none'
  end,
  internal_viewer = case
    when source_url ~* '^https://(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)/' or source_url ~* '\.(?:mp4|webm|ogg)(?:[?#]|$)' then 'video'
    when source_url ~* '\.pdf(?:[?#]|$)' then 'pdf'
    when material_type in ('exercise','quiz') then 'exercise'
    else 'web-article'
  end,
  import_status = case
    when source_url ~* '^https://(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)/' or source_url ~* '\.(?:mp4|webm|ogg)(?:[?#]|$)' then 'not-required'
    else 'pending'
  end,
  viewer_compatibility = case
    when source_url ~* '^https://(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)/' or source_url ~* '\.(?:mp4|webm|ogg)(?:[?#]|$)' then 'internal'
    when source_url ~* '\.pdf(?:[?#]|$)' then 'external'
    else 'external'
  end;

create or replace function public.classify_room_material_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catalog public.catalog_materials%rowtype;
  v_path text := pg_catalog.lower(coalesce(new.storage_path, new.url, new.title));
  v_catalog_id uuid;
begin
  begin
    v_catalog_id := nullif(new.metadata ->> 'catalog_material_id','')::uuid;
  exception when others then
    v_catalog_id := null;
  end;
  if v_catalog_id is not null then
    select * into v_catalog from public.catalog_materials where id = v_catalog_id;
    if found then
      new.access_mode := v_catalog.access_mode;
      new.monitoring_level := v_catalog.monitoring_level;
      new.internal_viewer := v_catalog.internal_viewer;
      new.import_status := v_catalog.import_status;
      new.internal_resource_id := v_catalog.internal_resource_id;
      return new;
    end if;
  end if;
  if new.storage_path is not null and v_path ~ '\.txt(?:[?#]|$)' then
    new.access_mode := 'internal'; new.monitoring_level := 'full'; new.internal_viewer := 'text'; new.import_status := 'ready';
  elsif new.storage_path is not null and (new.type = 'pdf' or v_path ~ '\.pdf(?:[?#]|$)') then
    new.access_mode := 'internal'; new.monitoring_level := 'partial'; new.internal_viewer := 'pdf'; new.import_status := 'ready';
  elsif new.url is not null and (new.type = 'pdf' or v_path ~ '\.pdf(?:[?#]|$)') then
    new.access_mode := 'import-required'; new.monitoring_level := 'none'; new.internal_viewer := 'pdf'; new.import_status := 'pending';
  elsif new.storage_path is not null and v_path ~ '\.(?:doc|docx)(?:[?#]|$)' then
    new.access_mode := 'internal'; new.monitoring_level := 'full'; new.internal_viewer := 'document'; new.import_status := 'ready';
  elsif new.storage_path is not null and v_path ~ '\.(?:ppt|pptx)(?:[?#]|$)' then
    new.access_mode := 'internal'; new.monitoring_level := 'full'; new.internal_viewer := 'presentation'; new.import_status := 'ready';
  elsif new.url ~* '^https://(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)/' then
    new.access_mode := 'embedded'; new.monitoring_level := 'full'; new.internal_viewer := 'video'; new.import_status := 'not-required';
  elsif new.url ~* '\.(?:mp4|webm|ogg)(?:[?#]|$)' then
    new.access_mode := 'embedded'; new.monitoring_level := 'full'; new.internal_viewer := 'video'; new.import_status := 'not-required';
  elsif new.url is not null then
    new.access_mode := 'import-required'; new.monitoring_level := 'none'; new.internal_viewer := 'web-article'; new.import_status := 'pending';
  else
    new.access_mode := 'unsupported'; new.monitoring_level := 'none'; new.internal_viewer := null; new.import_status := 'failed';
  end if;
  return new;
end;
$$;

drop trigger if exists materials_classify_access on public.materials;
create trigger materials_classify_access
before insert or update of type,url,storage_path,metadata on public.materials
for each row execute function public.classify_room_material_access();

update public.materials set metadata = metadata;

create or replace function public.record_material_learning_progress(
  p_room_id uuid,
  p_material_id uuid,
  p_state jsonb,
  p_event_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_material record;
  v_viewer text;
  v_learning_state text;
  v_summary text;
  v_page integer;
  v_page_count integer;
  v_video_time numeric;
  v_video_duration numeric;
  v_unique integer;
  v_completion numeric;
  v_active integer;
  v_ranges jsonb;
  v_exercise jsonb;
begin
  if v_user is null or not public.is_room_member(p_room_id) then raise exception 'ACCESS_DENIED' using errcode = '42501'; end if;
  if jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 32768 then raise exception 'INVALID_STATE' using errcode = '22023'; end if;
  select id,course_id,title,internal_viewer into v_material from public.materials
    where id = p_material_id and room_id = p_room_id and archived_at is null;
  if not found then raise exception 'MATERIAL_NOT_FOUND' using errcode = 'P0002'; end if;
  v_viewer := coalesce(nullif(p_state ->> 'viewer',''),v_material.internal_viewer);
  if v_viewer is not null and v_viewer not in ('pdf','text','document','presentation','video','web-article','exercise') then raise exception 'INVALID_VIEWER' using errcode = '22023'; end if;
  v_learning_state := coalesce(nullif(p_state ->> 'state',''),'active');
  if v_learning_state not in ('opened','active','paused','completed') then raise exception 'INVALID_LEARNING_STATE' using errcode = '22023'; end if;
  v_page := case when p_state ->> 'pageNumber' ~ '^[0-9]+$' then greatest((p_state ->> 'pageNumber')::integer,1) end;
  v_page_count := case when p_state ->> 'pageCount' ~ '^[0-9]+$' then greatest((p_state ->> 'pageCount')::integer,1) end;
  v_video_time := case when p_state ->> 'videoTimeSeconds' ~ '^[0-9]+(?:\.[0-9]+)?$' then least((p_state ->> 'videoTimeSeconds')::numeric,100000000) else 0 end;
  v_video_duration := case when p_state ->> 'videoDurationSeconds' ~ '^[0-9]+(?:\.[0-9]+)?$' then least((p_state ->> 'videoDurationSeconds')::numeric,100000000) else 0 end;
  v_unique := case when p_state ->> 'watchedUniqueSeconds' ~ '^[0-9]+$' then least((p_state ->> 'watchedUniqueSeconds')::integer,100000000) else 0 end;
  v_completion := case when p_state ->> 'completionPercentage' ~ '^[0-9]+(?:\.[0-9]+)?$' then least((p_state ->> 'completionPercentage')::numeric,100) else 0 end;
  v_active := case when p_state ->> 'activeSeconds' ~ '^[0-9]+$' then least((p_state ->> 'activeSeconds')::integer,100000000) else 0 end;
  v_ranges := case when jsonb_typeof(p_state -> 'watchedRanges') = 'array' and octet_length((p_state -> 'watchedRanges')::text) <= 32768 then p_state -> 'watchedRanges' else '[]'::jsonb end;
  v_exercise := case when jsonb_typeof(p_state -> 'exerciseState') = 'object' and octet_length((p_state -> 'exerciseState')::text) <= 16384 then p_state -> 'exerciseState' else '{}'::jsonb end;

  insert into public.material_reader_progress(
    user_id,material_id,room_id,paragraph_index,token_index,scroll_ratio,document_position,last_opened_at,
    viewer,page_number,page_count,video_time_seconds,video_duration_seconds,watched_ranges,watched_unique_seconds,
    completion_percentage,active_seconds,learning_state,exercise_state,last_interaction_at
  ) values (
    v_user,p_material_id,p_room_id,coalesce((p_state ->> 'paragraphIndex')::integer,0),coalesce((p_state ->> 'tokenIndex')::integer,0),
    least(greatest(coalesce((p_state ->> 'scrollRatio')::numeric,0),0),1),coalesce(p_state -> 'documentPosition','{}'::jsonb),clock_timestamp(),
    v_viewer,v_page,v_page_count,v_video_time,v_video_duration,v_ranges,v_unique,v_completion,v_active,v_learning_state,v_exercise,clock_timestamp()
  ) on conflict (user_id,material_id) do update set
    room_id=excluded.room_id, paragraph_index=excluded.paragraph_index, token_index=excluded.token_index,
    scroll_ratio=excluded.scroll_ratio, document_position=excluded.document_position, last_opened_at=clock_timestamp(),
    viewer=excluded.viewer, page_number=excluded.page_number, page_count=excluded.page_count,
    video_time_seconds=excluded.video_time_seconds, video_duration_seconds=excluded.video_duration_seconds,
    watched_ranges=excluded.watched_ranges, watched_unique_seconds=excluded.watched_unique_seconds,
    completion_percentage=excluded.completion_percentage, active_seconds=greatest(public.material_reader_progress.active_seconds,excluded.active_seconds),
    learning_state=excluded.learning_state, exercise_state=excluded.exercise_state, last_interaction_at=clock_timestamp();

  if p_event_type is not null then
    if p_event_type not in ('material_opened','material_closed','material_resumed','reading_started','reading_paused','reading_completed','video_started','video_paused','video_seeked','video_completed','exercise_started','exercise_paused','exercise_completed') then
      raise exception 'INVALID_EVENT' using errcode = '22023';
    end if;
    v_summary := case
      when p_event_type = 'material_opened' then 'ha aperto ' || v_material.title
      when p_event_type = 'material_resumed' then 'ha ripreso ' || v_material.title
      when p_event_type = 'material_closed' then 'ha interrotto ' || v_material.title
      when p_event_type = 'reading_started' then 'ha iniziato a leggere ' || v_material.title
      when p_event_type = 'reading_paused' then 'ha messo in pausa ' || v_material.title
      when p_event_type = 'video_started' then 'ha iniziato a guardare ' || v_material.title
      when p_event_type = 'video_paused' then 'ha messo in pausa ' || v_material.title
      when p_event_type = 'video_seeked' then 'si è spostato nel video ' || v_material.title
      when p_event_type = 'exercise_started' then 'ha iniziato ' || v_material.title
      when p_event_type = 'exercise_paused' then 'ha lasciato in sospeso ' || v_material.title
      when p_event_type in ('reading_completed','video_completed','exercise_completed') then 'ha completato ' || v_material.title
      else 'sta studiando ' || v_material.title
    end;
    insert into public.activity_events(room_id,actor_id,event_type,entity_type,entity_id,summary,payload)
    values (p_room_id,v_user,p_event_type,'material',p_material_id,pg_catalog.left(v_summary,500),
      pg_catalog.jsonb_build_object('materialId',p_material_id,'courseId',v_material.course_id,'viewer',v_viewer,
        'completionPercentage',v_completion,'activeSeconds',v_active));
  end if;
  return pg_catalog.jsonb_build_object('saved',true,'serverTimestamp',clock_timestamp());
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception 'INVALID_STATE' using errcode = '22023';
end;
$$;

revoke all on function public.record_material_learning_progress(uuid,uuid,jsonb,text) from public,anon;
grant execute on function public.record_material_learning_progress(uuid,uuid,jsonb,text) to authenticated;

grant select on public.catalog_materials to authenticated;
grant insert (
  user_id,material_id,room_id,paragraph_index,token_index,scroll_ratio,document_position,last_opened_at,
  viewer,page_number,page_count,video_time_seconds,video_duration_seconds,watched_ranges,watched_unique_seconds,
  completion_percentage,active_seconds,learning_state,exercise_state,last_interaction_at
) on public.material_reader_progress to authenticated;
grant update (
  paragraph_index,token_index,scroll_ratio,document_position,last_opened_at,viewer,page_number,page_count,
  video_time_seconds,video_duration_seconds,watched_ranges,watched_unique_seconds,completion_percentage,
  active_seconds,learning_state,exercise_state,last_interaction_at
) on public.material_reader_progress to authenticated;

commit;

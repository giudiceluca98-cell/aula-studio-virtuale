-- Aula Studio Virtuale - RLS, grants, Storage and Realtime

begin;

alter table public.profiles enable row level security;
alter table public.study_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.user_room_preferences enable row level security;
alter table public.room_invites enable row level security;
alter table public.presence enable row level security;
alter table public.courses enable row level security;
alter table public.materials enable row level security;
alter table public.progress_entries enable row level security;
alter table public.study_sessions enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.shared_notes enable row level security;
alter table public.activity_events enable row level security;
alter table public.session_summaries enable row level security;
alter table public.webhook_events enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_signals enable row level security;

-- Profiles are visible only to oneself and to current room peers.
create policy profiles_select_self_or_peer
on public.profiles for select
to authenticated
using (id = auth.uid() or public.shares_room_with(id));

create policy profiles_insert_self
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_self
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Room creation, joining and leaving should normally use the atomic RPCs from
-- 0001. Direct room reads/renames remain protected by active membership.
create policy study_rooms_select_member
on public.study_rooms for select
to authenticated
using (public.is_room_member(id));

create policy study_rooms_insert_creator
on public.study_rooms for insert
to authenticated
with check (created_by = auth.uid());

create policy study_rooms_update_admin
on public.study_rooms for update
to authenticated
using (public.is_room_admin(id))
with check (public.is_room_admin(id));

create policy room_members_select_member
on public.room_members for select
to authenticated
using (public.is_room_member(room_id));

-- Direct membership mutations are intentionally not granted. These policies
-- support future administrator tooling without creating recursive lookups.
create policy room_members_insert_admin
on public.room_members for insert
to authenticated
with check (public.is_room_admin(room_id));

create policy room_members_update_admin
on public.room_members for update
to authenticated
using (public.is_room_admin(room_id))
with check (public.is_room_admin(room_id));

create policy room_members_delete_admin
on public.room_members for delete
to authenticated
using (public.is_room_admin(room_id));

create policy preferences_select_own
on public.user_room_preferences for select
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy preferences_insert_own
on public.user_room_preferences for insert
to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy preferences_update_own
on public.user_room_preferences for update
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id))
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy preferences_delete_own
on public.user_room_preferences for delete
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy room_invites_select_admin
on public.room_invites for select
to authenticated
using (public.is_room_admin(room_id));

create policy room_invites_insert_admin
on public.room_invites for insert
to authenticated
with check (created_by = auth.uid() and public.is_room_admin(room_id));

create policy room_invites_update_admin
on public.room_invites for update
to authenticated
using (public.is_room_admin(room_id))
with check (public.is_room_admin(room_id));

create policy room_invites_delete_admin
on public.room_invites for delete
to authenticated
using (public.is_room_admin(room_id));

create policy presence_select_member_and_shared
on public.presence for select
to authenticated
using (
  public.is_room_member(room_id)
  and (user_id = auth.uid() or sharing_enabled)
);

create policy presence_insert_self
on public.presence for insert
to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy presence_update_self
on public.presence for update
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id))
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy presence_delete_self
on public.presence for delete
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy courses_select_member
on public.courses for select
to authenticated
using (public.is_room_member(room_id));

create policy courses_insert_member
on public.courses for insert
to authenticated
with check (created_by = auth.uid() and public.is_room_member(room_id));

create policy courses_update_creator_or_admin
on public.courses for update
to authenticated
using (created_by = auth.uid() or public.is_room_admin(room_id))
with check (public.is_room_member(room_id));

create policy courses_delete_creator_or_admin
on public.courses for delete
to authenticated
using (created_by = auth.uid() or public.is_room_admin(room_id));

create policy materials_select_member
on public.materials for select
to authenticated
using (public.is_room_member(room_id));

create policy materials_insert_member
on public.materials for insert
to authenticated
with check (created_by = auth.uid() and public.is_room_member(room_id));

create policy materials_update_creator_or_admin
on public.materials for update
to authenticated
using (created_by = auth.uid() or public.is_room_admin(room_id))
with check (public.is_room_member(room_id));

create policy materials_delete_creator_or_admin
on public.materials for delete
to authenticated
using (created_by = auth.uid() or public.is_room_admin(room_id));

create policy progress_entries_select_member
on public.progress_entries for select
to authenticated
using (public.is_room_member(room_id));

create policy progress_entries_insert_self
on public.progress_entries for insert
to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy progress_entries_update_self
on public.progress_entries for update
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id))
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy progress_entries_delete_self
on public.progress_entries for delete
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy study_sessions_select_member
on public.study_sessions for select
to authenticated
using (public.is_room_member(room_id));

create policy study_sessions_insert_self
on public.study_sessions for insert
to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy study_sessions_update_self
on public.study_sessions for update
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id))
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy study_sessions_delete_self
on public.study_sessions for delete
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy tasks_select_member
on public.tasks for select
to authenticated
using (public.is_room_member(room_id));

create policy tasks_insert_member
on public.tasks for insert
to authenticated
with check (created_by = auth.uid() and public.is_room_member(room_id));

create policy tasks_update_member
on public.tasks for update
to authenticated
using (public.is_room_member(room_id))
with check (public.is_room_member(room_id));

create policy tasks_delete_creator_or_admin
on public.tasks for delete
to authenticated
using (created_by = auth.uid() or public.is_room_admin(room_id));

create policy task_assignees_select_member
on public.task_assignees for select
to authenticated
using (public.is_room_member(room_id));

create policy task_assignees_insert_manager
on public.task_assignees for insert
to authenticated
with check (public.is_task_manager(task_id) and public.is_room_member(room_id));

create policy task_assignees_update_self_or_manager
on public.task_assignees for update
to authenticated
using (user_id = auth.uid() or public.is_task_manager(task_id))
with check (
  public.is_room_member(room_id)
  and (user_id = auth.uid() or public.is_task_manager(task_id))
);

create policy task_assignees_delete_manager
on public.task_assignees for delete
to authenticated
using (public.is_task_manager(task_id));

create policy messages_select_member
on public.messages for select
to authenticated
using (public.is_room_member(room_id));

create policy messages_insert_self
on public.messages for insert
to authenticated
with check (sender_id = auth.uid() and public.is_room_member(room_id));

create policy messages_update_self
on public.messages for update
to authenticated
using (sender_id = auth.uid() and public.is_room_member(room_id))
with check (sender_id = auth.uid() and public.is_room_member(room_id));

create policy messages_delete_self_or_admin
on public.messages for delete
to authenticated
using (sender_id = auth.uid() or public.is_room_admin(room_id));

create policy message_reads_select_member
on public.message_reads for select
to authenticated
using (public.is_room_member(room_id));

create policy message_reads_insert_self
on public.message_reads for insert
to authenticated
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy message_reads_update_self
on public.message_reads for update
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id))
with check (user_id = auth.uid() and public.is_room_member(room_id));

create policy message_reads_delete_self
on public.message_reads for delete
to authenticated
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy shared_notes_select_visible
on public.shared_notes for select
to authenticated
using (
  public.is_room_member(room_id)
  and (visibility = 'shared' or author_id = auth.uid())
);

create policy shared_notes_insert_self
on public.shared_notes for insert
to authenticated
with check (author_id = auth.uid() and public.is_room_member(room_id));

create policy shared_notes_update_self
on public.shared_notes for update
to authenticated
using (author_id = auth.uid() and public.is_room_member(room_id))
with check (author_id = auth.uid() and public.is_room_member(room_id));

create policy shared_notes_delete_self
on public.shared_notes for delete
to authenticated
using (author_id = auth.uid() and public.is_room_member(room_id));

create policy activity_events_select_member_and_shared
on public.activity_events for select
to authenticated
using (
  public.is_room_member(room_id)
  and public.activity_is_shared(room_id, actor_id)
);

create policy activity_events_insert_self
on public.activity_events for insert
to authenticated
with check (actor_id = auth.uid() and public.is_room_member(room_id));

create policy session_summaries_select_member
on public.session_summaries for select
to authenticated
using (public.is_room_member(room_id));

-- webhook_events intentionally has no authenticated policies. The webhook route
-- must use a server-only service-role client after HMAC verification.

create policy call_sessions_select_member
on public.call_sessions for select
to authenticated
using (public.is_room_member(room_id));

create policy call_sessions_insert_member
on public.call_sessions for insert
to authenticated
with check (started_by = auth.uid() and public.is_room_member(room_id));

create policy call_sessions_update_member
on public.call_sessions for update
to authenticated
using (public.is_room_member(room_id))
with check (public.is_room_member(room_id));

create policy call_sessions_delete_starter_or_admin
on public.call_sessions for delete
to authenticated
using (started_by = auth.uid() or public.is_room_admin(room_id));

create policy call_signals_select_participant
on public.call_signals for select
to authenticated
using (
  public.is_room_member(room_id)
  and (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or recipient_id is null
  )
);

create policy call_signals_insert_sender
on public.call_signals for insert
to authenticated
with check (sender_id = auth.uid() and public.is_room_member(room_id));

create policy call_signals_delete_sender_or_admin
on public.call_signals for delete
to authenticated
using (sender_id = auth.uid() or public.is_room_admin(room_id));

-- Reset broad Supabase defaults and grant only the operations used by the app.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;

grant usage on schema public to authenticated;

grant select on public.profiles to authenticated;
grant insert (id, display_name, avatar_url) on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

grant select on public.study_rooms to authenticated;
grant update (name) on public.study_rooms to authenticated;
grant select on public.room_members to authenticated;
grant select, delete on public.user_room_preferences to authenticated;
grant insert (
  room_id, user_id, share_presence, share_activity, default_private_notes
) on public.user_room_preferences to authenticated;
grant update (share_presence, share_activity, default_private_notes)
  on public.user_room_preferences to authenticated;
grant select on public.room_invites to authenticated;
grant select on public.presence to authenticated;

grant select, delete on public.courses to authenticated;
grant insert (id, room_id, title, description, created_by)
  on public.courses to authenticated;
grant update (title, description) on public.courses to authenticated;
grant select, delete on public.materials to authenticated;
grant insert (
  id, room_id, course_id, type, title, description, url, storage_path,
  current_chapter, current_lesson, metadata, created_by, created_at
) on public.materials to authenticated;
grant update (
  course_id, type, title, description, url, storage_path,
  current_chapter, current_lesson, metadata
) on public.materials to authenticated;
grant select, delete on public.progress_entries to authenticated;
grant insert (
  id, room_id, user_id, course_id, chapter, lesson, progress_percentage,
  exercises_completed, score, study_minutes, notes, next_goal
) on public.progress_entries to authenticated;
grant update (
  chapter, lesson, progress_percentage, exercises_completed,
  score, study_minutes, notes, next_goal
) on public.progress_entries to authenticated;
grant select on public.study_sessions to authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (
  id, room_id, created_by, assigned_to, assignment_mode, title, description,
  completed, priority, due_at
) on public.tasks to authenticated;
grant update (
  assigned_to, assignment_mode, title, description, completed, priority, due_at
) on public.tasks to authenticated;
grant select, delete on public.task_assignees to authenticated;
grant insert (task_id, room_id, user_id) on public.task_assignees to authenticated;
grant update (completed_at) on public.task_assignees to authenticated;
grant select, delete on public.messages to authenticated;
grant insert (id, room_id, sender_id, content, client_id, reply_to_id)
  on public.messages to authenticated;
grant update (deleted_at) on public.messages to authenticated;
grant select, delete on public.message_reads to authenticated;
grant insert (message_id, room_id, user_id) on public.message_reads to authenticated;
grant update (read_at) on public.message_reads to authenticated;
grant select, delete on public.shared_notes to authenticated;
grant insert (
  id, room_id, author_id, course_id, material_id, title, content, visibility
) on public.shared_notes to authenticated;
grant update (course_id, material_id, title, content, visibility)
  on public.shared_notes to authenticated;
grant select on public.activity_events to authenticated;
grant insert (
  id, room_id, actor_id, event_type, entity_type, entity_id,
  summary, payload, client_event_id
) on public.activity_events to authenticated;
grant select on public.session_summaries to authenticated;
grant select on public.call_sessions to authenticated;
grant insert (id, room_id, started_by, status) on public.call_sessions to authenticated;
grant update (status, started_at, ended_at) on public.call_sessions to authenticated;
grant delete on public.call_sessions to authenticated;
grant select, delete on public.call_signals to authenticated;
grant insert (
  room_id, call_id, sender_id, recipient_id, signal_type, payload
) on public.call_signals to authenticated;
grant usage, select on sequence public.call_signals_id_seq to authenticated;

-- Private Storage bucket. Object names must be:
--   <room_uuid>/<uploader_uuid>/<random-safe-filename>
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'study-materials',
  'study-materials',
  false,
  10485760,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists study_materials_select_member on storage.objects;
create policy study_materials_select_member
on storage.objects for select
to authenticated
using (
  bucket_id = 'study-materials'
  and public.is_room_member(public.storage_room_id(name))
);

drop policy if exists study_materials_insert_member_own_folder on storage.objects;
create policy study_materials_insert_member_own_folder
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'study-materials'
  and public.is_room_member(public.storage_room_id(name))
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists study_materials_update_owner_or_admin on storage.objects;
create policy study_materials_update_owner_or_admin
on storage.objects for update
to authenticated
using (
  bucket_id = 'study-materials'
  and public.is_room_member(public.storage_room_id(name))
  and (
    owner_id = auth.uid()::text
    or public.is_room_admin(public.storage_room_id(name))
  )
)
with check (
  bucket_id = 'study-materials'
  and public.is_room_member(public.storage_room_id(name))
  and (
    (
      owner_id = auth.uid()::text
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or public.is_room_admin(public.storage_room_id(name))
  )
);

drop policy if exists study_materials_delete_owner_or_admin on storage.objects;
create policy study_materials_delete_owner_or_admin
on storage.objects for delete
to authenticated
using (
  bucket_id = 'study-materials'
  and public.is_room_member(public.storage_room_id(name))
  and (
    owner_id = auth.uid()::text
    or public.is_room_admin(public.storage_room_id(name))
  )
);

-- Full old-row data lets clients reconcile UPDATE/DELETE events and deduplicate
-- reconnects. RLS still governs which rows each subscriber can receive.
alter table public.room_members replica identity full;
alter table public.user_room_preferences replica identity full;
alter table public.presence replica identity full;
alter table public.courses replica identity full;
alter table public.materials replica identity full;
alter table public.progress_entries replica identity full;
alter table public.study_sessions replica identity full;
alter table public.tasks replica identity full;
alter table public.task_assignees replica identity full;
alter table public.messages replica identity full;
alter table public.message_reads replica identity full;
alter table public.shared_notes replica identity full;
alter table public.activity_events replica identity full;
alter table public.session_summaries replica identity full;
alter table public.call_sessions replica identity full;
alter table public.call_signals replica identity full;

do $publication$
declare
  v_table text;
  v_tables text[] := array[
    'room_members',
    'user_room_preferences',
    'presence',
    'courses',
    'materials',
    'progress_entries',
    'study_sessions',
    'tasks',
    'task_assignees',
    'messages',
    'message_reads',
    'shared_notes',
    'activity_events',
    'session_summaries',
    'call_sessions',
    'call_signals'
  ];
begin
  if exists (
    select 1 from pg_catalog.pg_publication p
    where p.pubname = 'supabase_realtime'
  ) then
    foreach v_table in array v_tables loop
      if not exists (
        select 1
        from pg_catalog.pg_publication_tables pt
        where pt.pubname = 'supabase_realtime'
          and pt.schemaname = 'public'
          and pt.tablename = v_table
      ) then
        execute pg_catalog.format(
          'alter publication supabase_realtime add table public.%I',
          v_table
        );
      end if;
    end loop;
  end if;
end;
$publication$;

-- Supabase private-channel authorization for Presence and the room-scoped
-- database channel. New hosted projects can keep realtime.messages owned by
-- supabase_realtime_admin without allowing postgres to assume that role. In
-- that case the app uses standard Realtime channels while Postgres Changes are
-- still filtered by the public-table RLS policies above.
do $realtime_authorization$
begin
  if pg_catalog.to_regclass('realtime.messages') is not null
     and pg_catalog.to_regprocedure('realtime.topic()') is not null
     and exists (
       select 1
       from pg_catalog.pg_class c
       join pg_catalog.pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'realtime'
         and c.relname = 'messages'
         and pg_catalog.pg_get_userbyid(c.relowner) = current_user
     ) then
    execute 'alter table realtime.messages enable row level security';
    execute 'drop policy if exists room_channels_receive_for_members on realtime.messages';
    execute 'drop policy if exists room_channels_send_for_members on realtime.messages';

    execute $policy$
      create policy room_channels_receive_for_members
      on realtime.messages for select
      to authenticated
      using (
        public.is_room_member(
          public.realtime_room_id((select realtime.topic()))
        )
      )
    $policy$;

    execute $policy$
      create policy room_channels_send_for_members
      on realtime.messages for insert
      to authenticated
      with check (
        public.is_room_member(
          public.realtime_room_id((select realtime.topic()))
        )
      )
    $policy$;
  end if;
end;
$realtime_authorization$;

commit;

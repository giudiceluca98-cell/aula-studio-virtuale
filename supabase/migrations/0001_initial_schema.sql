-- Aula Studio Virtuale - initial PostgreSQL/Supabase schema
-- This migration is intended for a fresh Supabase project.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('owner', 'admin', 'member');
create type public.presence_status as enum (
  'online',
  'studying',
  'break',
  'away',
  'in_call',
  'offline'
);
create type public.material_type as enum ('link', 'pdf', 'file');
create type public.study_session_status as enum (
  'running',
  'paused',
  'completed',
  'cancelled'
);
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_assignment_mode as enum ('everyone', 'single', 'selected');
create type public.note_visibility as enum ('shared', 'private');
create type public.webhook_event_type as enum (
  'session_started',
  'session_paused',
  'session_completed',
  'progress_updated',
  'exercise_completed',
  'material_opened',
  'note_created',
  'user_left_room'
);
create type public.webhook_processing_status as enum (
  'received',
  'processing',
  'processed',
  'failed',
  'ignored'
);
create type public.call_status as enum ('waiting', 'active', 'ended', 'cancelled');
create type public.call_signal_type as enum (
  'offer',
  'answer',
  'ice_candidate',
  'renegotiate',
  'hangup'
);

create or replace function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select pg_catalog.upper(pg_catalog.encode(extensions.gen_random_bytes(9), 'hex'));
$$;

create or replace function public.invite_code_hash(p_code text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(pg_catalog.upper(pg_catalog.btrim(p_code)), 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  invite_code text not null default public.generate_invite_code()
    check (char_length(invite_code) between 8 and 64),
  invite_revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint study_rooms_invite_code_key unique (invite_code)
);

create table public.room_members (
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default clock_timestamp(),
  left_at timestamptz,
  primary key (room_id, user_id)
);

create table public.user_room_preferences (
  room_id uuid not null,
  user_id uuid not null,
  share_presence boolean not null default true,
  share_activity boolean not null default true,
  default_private_notes boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (room_id, user_id),
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  code_hash text not null unique check (char_length(code_hash) = 64),
  code_prefix text not null check (char_length(code_prefix) between 4 and 12),
  created_by uuid references public.profiles(id) on delete set null,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);

create table public.presence (
  room_id uuid not null,
  user_id uuid not null,
  status public.presence_status not null default 'offline',
  current_activity text check (
    current_activity is null or char_length(current_activity) <= 240
  ),
  device_label text check (device_label is null or char_length(device_label) <= 80),
  sharing_enabled boolean not null default true,
  last_seen_at timestamptz not null default clock_timestamp(),
  last_activity_at timestamptz not null default clock_timestamp(),
  disconnected_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (room_id, user_id),
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 4000),
  created_by uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  foreign key (room_id, created_by)
    references public.room_members(room_id, user_id) on delete set null (created_by)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  course_id uuid,
  type public.material_type not null,
  title text not null check (char_length(title) between 1 and 240),
  description text check (description is null or char_length(description) <= 4000),
  url text check (
    url is null
    or (char_length(url) <= 4096 and url ~* '^https?://')
  ),
  storage_path text check (storage_path is null or char_length(storage_path) <= 1024),
  current_chapter text check (
    current_chapter is null or char_length(current_chapter) <= 160
  ),
  current_lesson text check (
    current_lesson is null or char_length(current_lesson) <= 240
  ),
  metadata jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(metadata) = 'object'
      and octet_length(metadata::text) <= 32768
    ),
  created_by uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  foreign key (course_id, room_id)
    references public.courses(id, room_id) on delete cascade,
  foreign key (room_id, created_by)
    references public.room_members(room_id, user_id) on delete set null (created_by),
  constraint materials_source_required check (
    (type = 'link' and url is not null)
    or (type in ('pdf', 'file') and (storage_path is not null or url is not null))
  )
);

create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null,
  course_id uuid not null,
  chapter text check (chapter is null or char_length(chapter) <= 160),
  lesson text check (lesson is null or char_length(lesson) <= 240),
  progress_percentage numeric(5,2) not null default 0
    check (progress_percentage between 0 and 100),
  exercises_completed integer not null default 0 check (exercises_completed >= 0),
  score numeric(10,2) check (score is null or score >= 0),
  study_minutes integer not null default 0 check (study_minutes >= 0),
  notes text check (notes is null or char_length(notes) <= 8000),
  next_goal text check (next_goal is null or char_length(next_goal) <= 1000),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (room_id, user_id, course_id),
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade,
  foreign key (course_id, room_id)
    references public.courses(id, room_id) on delete cascade
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null,
  mode text not null default 'free'
    check (mode in ('free', 'pomodoro_focus', 'pomodoro_break')),
  started_at timestamptz not null default clock_timestamp(),
  paused_at timestamptz,
  ended_at timestamptz,
  last_resumed_at timestamptz,
  last_autosaved_at timestamptz,
  client_revision bigint not null default 0 check (client_revision >= 0),
  summary_data jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(summary_data) = 'object'
      and octet_length(summary_data::text) <= 32768
    ),
  total_seconds integer not null default 0 check (total_seconds >= 0),
  status public.study_session_status not null default 'running',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id, user_id),
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create unique index study_sessions_one_open_per_user_room
  on public.study_sessions(room_id, user_id)
  where status in ('running', 'paused');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  created_by uuid,
  assigned_to uuid,
  assignment_mode public.task_assignment_mode not null default 'everyone',
  title text not null check (char_length(title) between 1 and 300),
  description text check (description is null or char_length(description) <= 4000),
  completed boolean not null default false,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  priority public.task_priority not null default 'medium',
  due_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  foreign key (room_id, created_by)
    references public.room_members(room_id, user_id) on delete set null (created_by),
  foreign key (room_id, assigned_to)
    references public.room_members(room_id, user_id) on delete set null (assigned_to),
  constraint tasks_assignment_shape check (
    (assignment_mode = 'everyone' and assigned_to is null)
    or (assignment_mode = 'single' and assigned_to is not null)
    or (assignment_mode = 'selected' and assigned_to is null)
  ),
  constraint tasks_completion_shape check (
    (completed = false and completed_at is null)
    or (completed = true and completed_at is not null)
  )
);

create table public.task_assignees (
  task_id uuid not null,
  room_id uuid not null,
  user_id uuid not null,
  assigned_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  primary key (task_id, user_id),
  foreign key (task_id, room_id)
    references public.tasks(id, room_id) on delete cascade,
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  sender_id uuid not null,
  content text not null check (char_length(content) between 1 and 2000),
  client_id uuid not null default gen_random_uuid(),
  reply_to_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  unique (id, room_id),
  unique (room_id, sender_id, client_id),
  foreign key (reply_to_id, room_id)
    references public.messages(id, room_id) on delete set null (reply_to_id),
  foreign key (room_id, sender_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.message_reads (
  message_id uuid not null,
  room_id uuid not null,
  user_id uuid not null,
  read_at timestamptz not null default clock_timestamp(),
  primary key (message_id, user_id),
  foreign key (message_id, room_id)
    references public.messages(id, room_id) on delete cascade,
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.shared_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  author_id uuid not null,
  course_id uuid,
  material_id uuid,
  title text check (title is null or char_length(title) <= 240),
  content text not null check (char_length(content) between 1 and 20000),
  visibility public.note_visibility not null default 'shared',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  foreign key (room_id, author_id)
    references public.room_members(room_id, user_id) on delete cascade,
  foreign key (course_id, room_id)
    references public.courses(id, room_id) on delete cascade,
  foreign key (material_id, room_id)
    references public.materials(id, room_id) on delete cascade
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  entity_type text check (entity_type is null or char_length(entity_type) <= 80),
  entity_id uuid,
  summary text check (summary is null or char_length(summary) <= 500),
  payload jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(payload) = 'object'
      and octet_length(payload::text) <= 32768
    ),
  client_event_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  unique (room_id, client_event_id)
);

create table public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null,
  session_id uuid,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  exercises_completed integer not null default 0 check (exercises_completed >= 0),
  last_material_id uuid references public.materials(id) on delete set null,
  notes_added integer not null default 0 check (notes_added >= 0),
  final_timer_status public.study_session_status,
  difficulties text check (difficulties is null or char_length(difficulties) <= 4000),
  next_goals text check (next_goals is null or char_length(next_goals) <= 4000),
  created_at timestamptz not null default clock_timestamp(),
  unique (session_id),
  foreign key (session_id, room_id, user_id)
    references public.study_sessions(id, room_id, user_id) on delete cascade,
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.webhook_events (
  event_id uuid primary key,
  event_type public.webhook_event_type not null,
  room_id uuid references public.study_rooms(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and octet_length(payload::text) <= 262144
  ),
  status public.webhook_processing_status not null default 'received',
  error_code text check (error_code is null or char_length(error_code) <= 100),
  received_at timestamptz not null default clock_timestamp(),
  processed_at timestamptz
);

create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  started_by uuid not null,
  status public.call_status not null default 'waiting',
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  foreign key (room_id, started_by)
    references public.room_members(room_id, user_id) on delete cascade
);

create table public.call_signals (
  id bigint generated by default as identity primary key,
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  call_id uuid not null,
  sender_id uuid not null,
  recipient_id uuid,
  signal_type public.call_signal_type not null,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and octet_length(payload::text) <= 65536
  ),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '10 minutes'),
  foreign key (call_id, room_id)
    references public.call_sessions(id, room_id) on delete cascade,
  foreign key (room_id, sender_id)
    references public.room_members(room_id, user_id) on delete cascade,
  foreign key (room_id, recipient_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create index room_members_active_room_idx
  on public.room_members(room_id, joined_at) where left_at is null;
create index room_members_active_user_idx
  on public.room_members(user_id, room_id) where left_at is null;
create index user_room_preferences_user_idx
  on public.user_room_preferences(user_id, room_id);
create index room_invites_room_active_idx
  on public.room_invites(room_id, created_at desc) where revoked_at is null;
create index presence_room_seen_idx on public.presence(room_id, last_seen_at desc);
create index courses_room_created_idx on public.courses(room_id, created_at desc);
create index materials_room_created_idx on public.materials(room_id, created_at desc);
create index materials_course_idx on public.materials(course_id, created_at desc);
create index progress_room_updated_idx on public.progress_entries(room_id, updated_at desc);
create index progress_user_updated_idx on public.progress_entries(user_id, updated_at desc);
create index sessions_room_created_idx on public.study_sessions(room_id, started_at desc);
create index tasks_room_open_idx on public.tasks(room_id, completed, due_at);
create index tasks_assigned_to_idx on public.tasks(assigned_to, completed)
  where assigned_to is not null;
create index task_assignees_user_idx on public.task_assignees(user_id, room_id);
create index messages_room_created_idx on public.messages(room_id, created_at desc);
create index message_reads_user_idx on public.message_reads(user_id, room_id, read_at desc);
create index notes_room_updated_idx on public.shared_notes(room_id, updated_at desc);
create index activity_room_created_idx on public.activity_events(room_id, created_at desc);
create index summaries_room_created_idx on public.session_summaries(room_id, created_at desc);
create index webhook_events_status_received_idx
  on public.webhook_events(status, received_at) where status in ('received', 'failed');
create index call_sessions_room_status_idx on public.call_sessions(room_id, status);
create index call_signals_recipient_idx
  on public.call_signals(room_id, recipient_id, created_at) where recipient_id is not null;
create index call_signals_expiry_idx on public.call_signals(expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function public.force_created_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := clock_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger study_rooms_set_updated_at
before update on public.study_rooms
for each row execute function public.set_updated_at();
create trigger presence_set_updated_at
before update on public.presence
for each row execute function public.set_updated_at();
create trigger user_room_preferences_set_updated_at
before update on public.user_room_preferences
for each row execute function public.set_updated_at();
create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();
create trigger materials_set_updated_at
before update on public.materials
for each row execute function public.set_updated_at();
create trigger materials_force_created_at
before insert on public.materials
for each row execute function public.force_created_at();
create trigger progress_entries_set_updated_at
before update on public.progress_entries
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();
create trigger shared_notes_set_updated_at
before update on public.shared_notes
for each row execute function public.set_updated_at();
create trigger call_sessions_set_updated_at
before update on public.call_sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(pg_catalog.split_part(new.email, '@', 1), ''),
    'Studente'
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    pg_catalog.left(v_name, 80),
    nullif(pg_catalog.left(new.raw_user_meta_data ->> 'avatar_url', 2048), '')
  )
  on conflict (id) do update
  set display_name = excluded.display_name,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.initialize_room_member_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_room_preferences (room_id, user_id)
  values (new.room_id, new.user_id)
  on conflict (room_id, user_id) do nothing;
  return new;
end;
$$;

create trigger room_members_initialize_preferences
after insert on public.room_members
for each row execute function public.initialize_room_member_preferences();

create or replace function public.maintain_room_owner_on_member_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next_owner uuid;
begin
  if old.role <> 'owner' or old.left_at is not null then
    return old;
  end if;

  -- If the parent room itself is being deleted, the cascading delete needs no
  -- owner transfer. A room still visible here is surviving an account/member
  -- deletion and must retain a valid owner or be archived.
  if not exists (
    select 1 from public.study_rooms r
    where r.id = old.room_id and r.deleted_at is null
  ) then
    return old;
  end if;

  select rm.user_id
  into v_next_owner
  from public.room_members rm
  where rm.room_id = old.room_id
    and rm.user_id <> old.user_id
    and rm.left_at is null
  order by case when rm.role = 'admin' then 0 else 1 end, rm.joined_at
  limit 1;

  if v_next_owner is null then
    update public.study_rooms
    set deleted_at = clock_timestamp(),
        invite_revoked_at = clock_timestamp()
    where id = old.room_id;

    update public.room_invites
    set revoked_at = coalesce(revoked_at, clock_timestamp())
    where room_id = old.room_id and revoked_at is null;
  else
    update public.room_members
    set role = 'owner'
    where room_id = old.room_id and user_id = v_next_owner;
  end if;

  return old;
end;
$$;

create trigger room_members_preserve_owner
before delete on public.room_members
for each row execute function public.maintain_room_owner_on_member_delete();

create or replace function public.sync_presence_sharing_preference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.presence p
  set sharing_enabled = new.share_presence
  where p.room_id = new.room_id and p.user_id = new.user_id;
  return new;
end;
$$;

create trigger user_room_preferences_sync_presence
after insert or update of share_presence on public.user_room_preferences
for each row execute function public.sync_presence_sharing_preference();

create or replace function public.bootstrap_study_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  insert into public.room_invites (
    room_id,
    code_hash,
    code_prefix,
    created_by
  )
  values (
    new.id,
    public.invite_code_hash(new.invite_code),
    pg_catalog.left(new.invite_code, 8),
    new.created_by
  );

  return new;
end;
$$;

create trigger study_rooms_bootstrap_owner_and_invite
after insert on public.study_rooms
for each row execute function public.bootstrap_study_room();

create or replace function public.protect_study_session_clock()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'running' then
      raise exception using
        errcode = '22023',
        message = 'A new study session must start in running state';
    end if;

    new.started_at := v_now;
    new.last_resumed_at := v_now;
    new.paused_at := null;
    new.ended_at := null;
    new.total_seconds := 0;
    new.created_at := v_now;
    new.updated_at := v_now;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.room_id is distinct from old.room_id
     or new.user_id is distinct from old.user_id
     or new.started_at is distinct from old.started_at
     or new.created_at is distinct from old.created_at then
    raise exception using
      errcode = '22023',
      message = 'Immutable study session fields cannot be changed';
  end if;

  new.updated_at := v_now;
  new.total_seconds := old.total_seconds;
  new.last_resumed_at := old.last_resumed_at;
  new.paused_at := old.paused_at;
  new.ended_at := old.ended_at;

  if old.status = 'running' and new.status = 'paused' then
    v_delta := greatest(
      0,
      pg_catalog.floor(
        extract(epoch from (v_now - old.last_resumed_at))
      )::integer
    );
    new.total_seconds := old.total_seconds + v_delta;
    new.paused_at := v_now;
    new.last_resumed_at := null;
  elsif old.status = 'paused' and new.status = 'running' then
    new.paused_at := null;
    new.last_resumed_at := v_now;
  elsif old.status = 'running' and new.status in ('completed', 'cancelled') then
    v_delta := greatest(
      0,
      pg_catalog.floor(
        extract(epoch from (v_now - old.last_resumed_at))
      )::integer
    );
    new.total_seconds := old.total_seconds + v_delta;
    new.last_resumed_at := null;
    new.ended_at := v_now;
  elsif old.status = 'paused' and new.status in ('completed', 'cancelled') then
    new.last_resumed_at := null;
    new.ended_at := v_now;
  elsif old.status = new.status and old.status in ('running', 'paused') then
    null;
  else
    raise exception using
      errcode = '22023',
      message = pg_catalog.format(
        'Invalid study session transition: %s -> %s',
        old.status,
        new.status
      );
  end if;

  return new;
end;
$$;

create trigger study_sessions_server_clock
before insert or update on public.study_sessions
for each row execute function public.protect_study_session_clock();

create or replace function public.normalize_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.completed then
      new.completed_at := clock_timestamp();
      new.completed_by := coalesce(auth.uid(), new.created_by);
    else
      new.completed_at := null;
      new.completed_by := null;
    end if;
    return new;
  end if;

  if new.completed and not old.completed then
    new.completed_at := clock_timestamp();
    new.completed_by := coalesce(auth.uid(), new.completed_by, new.created_by);
  elsif not new.completed and old.completed then
    new.completed_at := null;
    new.completed_by := null;
  elsif new.completed = old.completed then
    new.completed_at := old.completed_at;
    new.completed_by := old.completed_by;
  end if;
  return new;
end;
$$;

create trigger tasks_normalize_completion
before insert or update on public.tasks
for each row execute function public.normalize_task_completion();

create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_recent integer;
  v_minute integer;
begin
  select pg_catalog.count(*)
  into v_recent
  from public.messages m
  where m.room_id = new.room_id
    and m.sender_id = new.sender_id
    and m.created_at >= v_now - interval '10 seconds';

  if v_recent >= 8 then
    raise exception using
      errcode = 'P0001',
      message = 'Message rate limit exceeded';
  end if;

  select pg_catalog.count(*)
  into v_minute
  from public.messages m
  where m.room_id = new.room_id
    and m.sender_id = new.sender_id
    and m.created_at >= v_now - interval '1 minute';

  if v_minute >= 30 then
    raise exception using
      errcode = 'P0001',
      message = 'Message rate limit exceeded';
  end if;

  new.created_at := v_now;
  return new;
end;
$$;

create trigger messages_basic_rate_limit
before insert on public.messages
for each row execute function public.enforce_message_rate_limit();

-- SECURITY DEFINER membership helpers intentionally avoid querying tables through
-- RLS policies. They use auth.uid() internally so callers cannot impersonate users.
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    join public.study_rooms r on r.id = rm.room_id
    where rm.room_id = p_room_id
      and rm.user_id = auth.uid()
      and rm.left_at is null
      and r.deleted_at is null
  );
$$;

create or replace function public.is_room_admin(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    join public.study_rooms r on r.id = rm.room_id
    where rm.room_id = p_room_id
      and rm.user_id = auth.uid()
      and rm.role in ('owner', 'admin')
      and rm.left_at is null
      and r.deleted_at is null
  );
$$;

create or replace function public.is_room_owner(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members rm
    join public.study_rooms r on r.id = rm.room_id
    where rm.room_id = p_room_id
      and rm.user_id = auth.uid()
      and rm.role = 'owner'
      and rm.left_at is null
      and r.deleted_at is null
  );
$$;

create or replace function public.shares_room_with(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members mine
    join public.room_members theirs on theirs.room_id = mine.room_id
    join public.study_rooms r on r.id = mine.room_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_other_user_id
      and mine.left_at is null
      and theirs.left_at is null
      and r.deleted_at is null
  );
$$;

create or replace function public.activity_is_shared(
  p_room_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_actor_id is null
    or p_actor_id = auth.uid()
    or coalesce(
      (
        select pref.share_activity
        from public.user_room_preferences pref
        where pref.room_id = p_room_id and pref.user_id = p_actor_id
      ),
      true
    );
$$;

create or replace function public.is_task_manager(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and (
        t.created_by = auth.uid()
        or public.is_room_admin(t.room_id)
      )
  );
$$;

create or replace function public.storage_room_id(p_object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_segment text;
begin
  v_segment := pg_catalog.split_part(p_object_name, '/', 1);
  return v_segment::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function public.realtime_room_id(p_topic text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_topic is null or p_topic !~* (
    '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-'
    || '[0-9a-f]{4}-[0-9a-f]{12}:(presence|database)$'
  ) then
    return null;
  end if;
  return pg_catalog.split_part(p_topic, ':', 2)::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function public.create_study_room(room_name text)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.study_rooms;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if pg_catalog.char_length(pg_catalog.btrim(room_name)) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'Invalid room name';
  end if;

  insert into public.study_rooms (name, created_by)
  values (pg_catalog.btrim(room_name), v_user_id)
  returning * into v_room;

  insert into public.activity_events (
    room_id, actor_id, event_type, entity_type, entity_id, summary
  ) values (
    v_room.id, v_user_id, 'room_created', 'study_room', v_room.id, 'Stanza creata'
  );

  return query select v_room.id, v_room.name, v_room.invite_code;
end;
$$;

create or replace function public.join_study_room(invite_code text)
returns table (room_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.room_invites;
  v_was_active boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if $1 is null
     or pg_catalog.char_length(pg_catalog.btrim($1)) not between 8 and 64 then
    raise exception using errcode = '22023', message = 'Invalid invite code';
  end if;

  select ri.*
  into v_invite
  from public.room_invites ri
  join public.study_rooms r on r.id = ri.room_id
  where ri.code_hash = public.invite_code_hash($1)
    and ri.revoked_at is null
    and (ri.expires_at is null or ri.expires_at > clock_timestamp())
    and (ri.max_uses is null or ri.use_count < ri.max_uses)
    and r.invite_revoked_at is null
    and r.deleted_at is null
  for update of ri;

  if not found then
    raise exception using errcode = '22023', message = 'Invite is invalid, expired, or revoked';
  end if;

  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = v_invite.room_id
      and rm.user_id = v_user_id
      and rm.left_at is null
  ) into v_was_active;

  insert into public.room_members (room_id, user_id, role, joined_at, left_at)
  values (v_invite.room_id, v_user_id, 'member', clock_timestamp(), null)
  on conflict (room_id, user_id) do update
  set joined_at = excluded.joined_at,
      left_at = null;

  if not v_was_active then
    update public.room_invites
    set use_count = use_count + 1
    where id = v_invite.id;

    insert into public.activity_events (
      room_id, actor_id, event_type, entity_type, entity_id, summary
    ) values (
      v_invite.room_id,
      v_user_id,
      'member_joined',
      'profile',
      v_user_id,
      'Un partecipante è entrato nella stanza'
    );
  end if;

  return query select v_invite.room_id;
end;
$$;

create or replace function public.leave_study_room(room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role public.member_role;
  v_next_owner uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select rm.role
  into v_role
  from public.room_members rm
  where rm.room_id = $1
    and rm.user_id = v_user_id
    and rm.left_at is null
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Active membership required';
  end if;

  if v_role = 'owner' then
    select rm.user_id
    into v_next_owner
    from public.room_members rm
    where rm.room_id = $1
      and rm.user_id <> v_user_id
      and rm.left_at is null
    order by case when rm.role = 'admin' then 0 else 1 end, rm.joined_at
    limit 1
    for update;

    if v_next_owner is null then
      update public.study_rooms r
      set deleted_at = clock_timestamp(),
          invite_revoked_at = clock_timestamp()
      where r.id = $1;

      update public.room_invites ri
      set revoked_at = coalesce(ri.revoked_at, clock_timestamp())
      where ri.room_id = $1;
    else
      update public.room_members rm
      set role = 'owner'
      where rm.room_id = $1
        and rm.user_id = v_next_owner;
    end if;
  end if;

  insert into public.activity_events (
    room_id, actor_id, event_type, entity_type, entity_id, summary
  ) values (
    $1,
    v_user_id,
    'member_left',
    'profile',
    v_user_id,
    'Un partecipante ha lasciato la stanza'
  );

  update public.presence p
  set status = 'offline',
      current_activity = null,
      disconnected_at = clock_timestamp(),
      last_seen_at = clock_timestamp()
  where p.room_id = $1
    and p.user_id = v_user_id;

  update public.room_members rm
  set left_at = clock_timestamp(),
      role = 'member'
  where rm.room_id = $1
    and rm.user_id = v_user_id;
end;
$$;

create or replace function public.rotate_study_room_invite(
  p_room_id uuid,
  p_expires_at timestamptz default null,
  p_max_uses integer default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
begin
  if v_user_id is null or not public.is_room_admin(p_room_id) then
    raise exception using errcode = '42501', message = 'Room administrator required';
  end if;

  if p_expires_at is not null and p_expires_at <= clock_timestamp() then
    raise exception using errcode = '22023', message = 'Invite expiry must be in the future';
  end if;
  if p_max_uses is not null and p_max_uses <= 0 then
    raise exception using errcode = '22023', message = 'max_uses must be positive';
  end if;

  update public.room_invites
  set revoked_at = coalesce(revoked_at, clock_timestamp())
  where room_id = p_room_id and revoked_at is null;

  loop
    v_code := public.generate_invite_code();
    exit when not exists (
      select 1 from public.room_invites ri
      where ri.code_hash = public.invite_code_hash(v_code)
    );
  end loop;

  update public.study_rooms
  set invite_code = v_code,
      invite_revoked_at = null
  where id = p_room_id and deleted_at is null;

  if not found then
    raise exception using errcode = '22023', message = 'Room not found';
  end if;

  insert into public.room_invites (
    room_id, code_hash, code_prefix, created_by, expires_at, max_uses
  ) values (
    p_room_id,
    public.invite_code_hash(v_code),
    pg_catalog.left(v_code, 8),
    v_user_id,
    p_expires_at,
    p_max_uses
  );

  return v_code;
end;
$$;

create or replace function public.prepare_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_user_id) then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;

  -- Deliberately read-only. All formerly restrictive authorship/reply foreign
  -- keys use targeted SET NULL, while room_members_preserve_owner transfers the
  -- owner (or archives a sole-member room) inside the same database transaction
  -- started by Admin Auth deleteUser. This preflight therefore cannot leave a
  -- half-deleted account if the subsequent Auth API call fails.
end;
$$;

create or replace function public.prepare_study_room_deletion(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if not exists (
    select 1
    from public.study_rooms r
    join public.room_members rm on rm.room_id = r.id
    where r.id = p_room_id
      and rm.user_id = v_user_id
      and rm.role = 'owner'
      and rm.left_at is null
  ) then
    raise exception using errcode = '42501', message = 'Room owner required';
  end if;

  -- Tombstone first: every membership/Storage policy becomes fail-closed while
  -- the server inventories and removes objects. Calling this RPC again is safe.
  update public.study_rooms
  set deleted_at = coalesce(deleted_at, clock_timestamp()),
      invite_revoked_at = coalesce(invite_revoked_at, clock_timestamp())
  where id = p_room_id;

  update public.room_invites
  set revoked_at = coalesce(revoked_at, clock_timestamp())
  where room_id = p_room_id and revoked_at is null;
end;
$$;

create or replace function public.delete_study_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  -- A retry after a successful deletion is a no-op.
  if not exists (select 1 from public.study_rooms r where r.id = p_room_id) then
    return;
  end if;
  -- This must also authorize a room tombstoned by prepare_study_room_deletion(),
  -- for which is_room_owner() deliberately returns false.
  if not exists (
    select 1
    from public.room_members rm
    where rm.room_id = p_room_id
      and rm.user_id = auth.uid()
      and rm.role = 'owner'
      and rm.left_at is null
  ) then
    raise exception using errcode = '42501', message = 'Room owner required';
  end if;

  update public.room_invites
  set revoked_at = coalesce(revoked_at, clock_timestamp())
  where room_id = p_room_id and revoked_at is null;

  delete from public.study_rooms where id = p_room_id;
end;
$$;

create or replace function public.revoke_study_room_invite(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_room_admin(p_room_id) then
    raise exception using errcode = '42501', message = 'Room administrator required';
  end if;

  update public.study_rooms
  set invite_revoked_at = clock_timestamp()
  where id = p_room_id and deleted_at is null;

  update public.room_invites
  set revoked_at = coalesce(revoked_at, clock_timestamp())
  where room_id = p_room_id and revoked_at is null;
end;
$$;

create or replace function public.rotate_room_invite(p_room_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_room_owner(p_room_id) then
    raise exception using errcode = '42501', message = 'Room owner required';
  end if;
  return public.rotate_study_room_invite(p_room_id, null, null);
end;
$$;

create or replace function public.touch_presence(
  p_room_id uuid,
  p_status text,
  p_current_activity text default null,
  p_device_label text default null
)
returns public.presence
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_presence public.presence;
  v_now timestamptz := clock_timestamp();
  v_share_presence boolean;
begin
  if v_user_id is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'Active membership required';
  end if;
  if p_status is null or p_status not in (
    'online', 'studying', 'break', 'away', 'in_call', 'offline'
  ) then
    raise exception using errcode = '22023', message = 'Invalid presence status';
  end if;
  if p_current_activity is not null and char_length(p_current_activity) > 240 then
    raise exception using errcode = '22023', message = 'Current activity is too long';
  end if;
  if p_device_label is not null and char_length(p_device_label) > 80 then
    raise exception using errcode = '22023', message = 'Device label is too long';
  end if;

  select coalesce(
    (
      select pref.share_presence
      from public.user_room_preferences pref
      where pref.room_id = p_room_id and pref.user_id = v_user_id
    ),
    true
  ) into v_share_presence;

  insert into public.presence (
    room_id,
    user_id,
    status,
    current_activity,
    device_label,
    sharing_enabled,
    last_seen_at,
    last_activity_at,
    disconnected_at
  ) values (
    p_room_id,
    v_user_id,
    p_status::public.presence_status,
    nullif(pg_catalog.btrim(p_current_activity), ''),
    nullif(pg_catalog.btrim(p_device_label), ''),
    v_share_presence,
    v_now,
    v_now,
    case when p_status = 'offline' then v_now else null end
  )
  on conflict (room_id, user_id) do update
  set status = excluded.status,
      current_activity = excluded.current_activity,
      device_label = excluded.device_label,
      last_seen_at = v_now,
      last_activity_at = case
        when public.presence.current_activity is distinct from excluded.current_activity
          or public.presence.status is distinct from excluded.status
        then v_now
        else public.presence.last_activity_at
      end,
      disconnected_at = excluded.disconnected_at
  returning * into v_presence;

  return v_presence;
end;
$$;

create or replace function public.mark_presence_left(p_room_id uuid)
returns public.presence
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_presence public.presence;
  v_now timestamptz := clock_timestamp();
  v_share_presence boolean;
begin
  if v_user_id is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'Active membership required';
  end if;

  select coalesce(
    (
      select pref.share_presence
      from public.user_room_preferences pref
      where pref.room_id = p_room_id and pref.user_id = v_user_id
    ),
    true
  ) into v_share_presence;

  insert into public.presence (
    room_id, user_id, status, sharing_enabled,
    last_seen_at, last_activity_at, disconnected_at
  ) values (
    p_room_id, v_user_id, 'offline', v_share_presence, v_now, v_now, v_now
  )
  on conflict (room_id, user_id) do update
  set status = 'offline',
      current_activity = null,
      last_seen_at = v_now,
      disconnected_at = v_now
  returning * into v_presence;

  return v_presence;
end;
$$;

create or replace function public.set_presence_sharing(
  p_room_id uuid,
  p_enabled boolean
)
returns public.presence
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_presence public.presence;
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'Active membership required';
  end if;
  if p_enabled is null then
    raise exception using errcode = '22023', message = 'Sharing preference is required';
  end if;

  update public.user_room_preferences
  set share_presence = p_enabled
  where room_id = p_room_id and user_id = v_user_id;

  insert into public.presence (
    room_id, user_id, status, sharing_enabled,
    last_seen_at, last_activity_at, disconnected_at
  ) values (
    p_room_id, v_user_id, 'offline', p_enabled, v_now, v_now, v_now
  )
  on conflict (room_id, user_id) do update
  set sharing_enabled = p_enabled
  returning * into v_presence;
  return v_presence;
end;
$$;

create or replace function public.start_study_session(
  p_room_id uuid,
  p_mode text default 'free'
)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions;
begin
  if v_user_id is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'Active membership required';
  end if;
  if p_mode is null or p_mode not in ('free', 'pomodoro_focus') then
    raise exception using errcode = '22023', message = 'Invalid study session mode';
  end if;

  insert into public.study_sessions (room_id, user_id, mode, status)
  values (p_room_id, v_user_id, p_mode, 'running')
  returning * into v_session;

  insert into public.activity_events (
    room_id, actor_id, event_type, entity_type, entity_id, summary
  ) values (
    p_room_id, v_user_id, 'session_started', 'study_session', v_session.id,
    'Sessione di studio avviata'
  );

  return v_session;
exception when unique_violation then
  raise exception using errcode = '23505', message = 'An open study session already exists';
end;
$$;

create or replace function public.pause_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions;
begin
  select * into v_session
  from public.study_sessions s
  where s.id = p_session_id and s.user_id = v_user_id
  for update;

  if not found or not public.is_room_member(v_session.room_id) then
    raise exception using errcode = '42501', message = 'Session owner and membership required';
  end if;
  if v_session.status <> 'running' then
    raise exception using errcode = '22023', message = 'Only a running session can be paused';
  end if;

  update public.study_sessions set status = 'paused'
  where id = p_session_id
  returning * into v_session;

  insert into public.activity_events (
    room_id, actor_id, event_type, entity_type, entity_id, summary
  ) values (
    v_session.room_id, v_user_id, 'session_paused', 'study_session', v_session.id,
    'Sessione di studio in pausa'
  );
  return v_session;
end;
$$;

create or replace function public.resume_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions;
begin
  select * into v_session
  from public.study_sessions s
  where s.id = p_session_id and s.user_id = v_user_id
  for update;

  if not found or not public.is_room_member(v_session.room_id) then
    raise exception using errcode = '42501', message = 'Session owner and membership required';
  end if;
  if v_session.status <> 'paused' then
    raise exception using errcode = '22023', message = 'Only a paused session can be resumed';
  end if;

  update public.study_sessions set status = 'running'
  where id = p_session_id
  returning * into v_session;

  insert into public.activity_events (
    room_id, actor_id, event_type, entity_type, entity_id, summary
  ) values (
    v_session.room_id, v_user_id, 'session_resumed', 'study_session', v_session.id,
    'Sessione di studio ripresa'
  );
  return v_session;
end;
$$;

create or replace function public.autosave_study_session(
  p_session_id uuid,
  p_revision bigint,
  p_summary jsonb
)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions;
  v_is_final boolean := false;
  v_lessons integer := 0;
  v_exercises integer := 0;
  v_notes integer := 0;
  v_last_material uuid;
begin
  if p_revision is null or p_revision < 0 then
    raise exception using errcode = '22023', message = 'Revision must be non-negative';
  end if;
  if p_summary is null or pg_catalog.jsonb_typeof(p_summary) <> 'object' then
    raise exception using errcode = '22023', message = 'Summary must be a JSON object';
  end if;
  if pg_catalog.octet_length(p_summary::text) > 32768 then
    raise exception using errcode = '22023', message = 'Summary is too large';
  end if;
  if pg_catalog.jsonb_typeof(p_summary -> 'final') = 'boolean' then
    v_is_final := (p_summary ->> 'final')::boolean;
  end if;

  select * into v_session
  from public.study_sessions s
  where s.id = p_session_id and s.user_id = v_user_id
  for update;

  if not found or not public.is_room_member(v_session.room_id) then
    raise exception using errcode = '42501', message = 'Session owner and membership required';
  end if;
  -- A replay of a final beacon after the first transaction committed is a
  -- successful no-op even if it carries a newly allocated client revision.
  if v_session.status = 'completed' and v_is_final then
    return v_session;
  end if;
  if v_session.status not in ('running', 'paused') then
    raise exception using errcode = '22023', message = 'A closed session cannot be autosaved';
  end if;

  -- Repeated and out-of-order beacons are idempotent: stale revisions return the
  -- current server row without overwriting newer state.
  if p_revision < v_session.client_revision
     or (p_revision = v_session.client_revision and not v_is_final) then
    return v_session;
  end if;

  update public.study_sessions
  set client_revision = p_revision,
      summary_data = p_summary,
      last_autosaved_at = clock_timestamp()
  where id = p_session_id
  returning * into v_session;

  if v_is_final then
    -- This status transition invokes protect_study_session_clock(), which adds
    -- the current running segment using the database clock.
    update public.study_sessions
    set status = 'completed'
    where id = p_session_id
    returning * into v_session;

    if pg_catalog.jsonb_typeof(p_summary -> 'lessons_completed') = 'array' then
      v_lessons := pg_catalog.jsonb_array_length(p_summary -> 'lessons_completed');
    elsif pg_catalog.jsonb_typeof(p_summary -> 'lessons_completed') = 'number'
          and (p_summary ->> 'lessons_completed') ~ '^[0-9]+$' then
      v_lessons := least(
        (p_summary ->> 'lessons_completed')::numeric,
        2147483647
      )::integer;
    end if;

    if pg_catalog.jsonb_typeof(p_summary -> 'exercises_completed') = 'number'
       and (p_summary ->> 'exercises_completed') ~ '^[0-9]+$' then
      v_exercises := least(
        (p_summary ->> 'exercises_completed')::numeric,
        2147483647
      )::integer;
    end if;

    if pg_catalog.jsonb_typeof(p_summary -> 'notes_added') = 'number'
       and (p_summary ->> 'notes_added') ~ '^[0-9]+$' then
      v_notes := least(
        (p_summary ->> 'notes_added')::numeric,
        2147483647
      )::integer;
    end if;

    if pg_catalog.jsonb_typeof(p_summary -> 'last_material_id') = 'string' then
      begin
        v_last_material := (p_summary ->> 'last_material_id')::uuid;
      exception when invalid_text_representation then
        v_last_material := null;
      end;
    end if;

    if v_last_material is not null and not exists (
      select 1
      from public.materials m
      where m.id = v_last_material and m.room_id = v_session.room_id
    ) then
      v_last_material := null;
    end if;

    insert into public.session_summaries (
      room_id,
      user_id,
      session_id,
      duration_seconds,
      lessons_completed,
      exercises_completed,
      last_material_id,
      notes_added,
      final_timer_status,
      difficulties,
      next_goals
    ) values (
      v_session.room_id,
      v_user_id,
      v_session.id,
      v_session.total_seconds,
      v_lessons,
      v_exercises,
      v_last_material,
      v_notes,
      v_session.status,
      case
        when pg_catalog.jsonb_typeof(p_summary -> 'difficulties') = 'string'
        then pg_catalog.left(p_summary ->> 'difficulties', 4000)
        else null
      end,
      case
        when pg_catalog.jsonb_typeof(p_summary -> 'next_goals') = 'string'
        then pg_catalog.left(p_summary ->> 'next_goals', 4000)
        else null
      end
    )
    on conflict (session_id) do update
    set duration_seconds = excluded.duration_seconds,
        lessons_completed = excluded.lessons_completed,
        exercises_completed = excluded.exercises_completed,
        last_material_id = excluded.last_material_id,
        notes_added = excluded.notes_added,
        final_timer_status = excluded.final_timer_status,
        difficulties = excluded.difficulties,
        next_goals = excluded.next_goals;

    insert into public.activity_events (
      room_id, actor_id, event_type, entity_type, entity_id, summary, payload
    ) values (
      v_session.room_id,
      v_user_id,
      'session_completed',
      'study_session',
      v_session.id,
      'Sessione di studio completata',
      pg_catalog.jsonb_build_object('totalSeconds', v_session.total_seconds)
    );
  end if;

  return v_session;
end;
$$;

create or replace function public.complete_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions;
begin
  select * into v_session
  from public.study_sessions s
  where s.id = p_session_id and s.user_id = v_user_id
  for update;

  if not found or not public.is_room_member(v_session.room_id) then
    raise exception using errcode = '42501', message = 'Session owner and membership required';
  end if;
  if v_session.status = 'completed' then
    return v_session;
  end if;
  if v_session.status not in ('running', 'paused') then
    raise exception using errcode = '22023', message = 'Session is already closed';
  end if;
  if v_session.client_revision = 9223372036854775807 then
    raise exception using errcode = '22003', message = 'Session revision exhausted';
  end if;

  -- Reuse the final autosave path so a normal Stop and a page-leave beacon both
  -- materialize server time, write one summary and emit one activity event.
  v_session := public.autosave_study_session(
    p_session_id,
    v_session.client_revision + 1,
    v_session.summary_data || pg_catalog.jsonb_build_object('final', true)
  );
  return v_session;
end;
$$;

revoke all on function public.generate_invite_code() from public;
revoke all on function public.invite_code_hash(text) from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.force_created_at() from public;
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.initialize_room_member_preferences() from public;
revoke all on function public.maintain_room_owner_on_member_delete() from public;
revoke all on function public.sync_presence_sharing_preference() from public;
revoke all on function public.bootstrap_study_room() from public;
revoke all on function public.protect_study_session_clock() from public;
revoke all on function public.normalize_task_completion() from public;
revoke all on function public.enforce_message_rate_limit() from public;
revoke all on function public.is_room_member(uuid) from public;
revoke all on function public.is_room_admin(uuid) from public;
revoke all on function public.is_room_owner(uuid) from public;
revoke all on function public.shares_room_with(uuid) from public;
revoke all on function public.activity_is_shared(uuid, uuid) from public;
revoke all on function public.is_task_manager(uuid) from public;
revoke all on function public.storage_room_id(text) from public;
revoke all on function public.realtime_room_id(text) from public;
revoke all on function public.create_study_room(text) from public;
revoke all on function public.join_study_room(text) from public;
revoke all on function public.leave_study_room(uuid) from public;
revoke all on function public.rotate_study_room_invite(uuid, timestamptz, integer) from public;
revoke all on function public.prepare_account_deletion() from public;
revoke all on function public.prepare_study_room_deletion(uuid) from public;
revoke all on function public.delete_study_room(uuid) from public;
revoke all on function public.revoke_study_room_invite(uuid) from public;
revoke all on function public.rotate_room_invite(uuid) from public;
revoke all on function public.touch_presence(uuid, text, text, text) from public;
revoke all on function public.mark_presence_left(uuid) from public;
revoke all on function public.set_presence_sharing(uuid, boolean) from public;
revoke all on function public.start_study_session(uuid, text) from public;
revoke all on function public.pause_study_session(uuid) from public;
revoke all on function public.resume_study_session(uuid) from public;
revoke all on function public.autosave_study_session(uuid, bigint, jsonb) from public;
revoke all on function public.complete_study_session(uuid) from public;

grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.is_room_admin(uuid) to authenticated;
grant execute on function public.is_room_owner(uuid) to authenticated;
grant execute on function public.shares_room_with(uuid) to authenticated;
grant execute on function public.activity_is_shared(uuid, uuid) to authenticated;
grant execute on function public.is_task_manager(uuid) to authenticated;
grant execute on function public.storage_room_id(text) to authenticated;
grant execute on function public.realtime_room_id(text) to authenticated;
grant execute on function public.create_study_room(text) to authenticated;
grant execute on function public.join_study_room(text) to authenticated;
grant execute on function public.leave_study_room(uuid) to authenticated;
grant execute on function public.rotate_study_room_invite(uuid, timestamptz, integer)
  to authenticated;
grant execute on function public.prepare_account_deletion() to authenticated;
grant execute on function public.prepare_study_room_deletion(uuid) to authenticated;
grant execute on function public.delete_study_room(uuid) to authenticated;
grant execute on function public.revoke_study_room_invite(uuid) to authenticated;
grant execute on function public.rotate_room_invite(uuid) to authenticated;
grant execute on function public.touch_presence(uuid, text, text, text) to authenticated;
grant execute on function public.mark_presence_left(uuid) to authenticated;
grant execute on function public.set_presence_sharing(uuid, boolean) to authenticated;
grant execute on function public.start_study_session(uuid, text) to authenticated;
grant execute on function public.pause_study_session(uuid) to authenticated;
grant execute on function public.resume_study_session(uuid) to authenticated;
grant execute on function public.autosave_study_session(uuid, bigint, jsonb)
  to authenticated;
grant execute on function public.complete_study_session(uuid) to authenticated;

comment on column public.study_rooms.invite_code is
  'Current plaintext invite code. Visible only to active room members through RLS; historical invites store hashes.';
comment on column public.tasks.assigned_to is
  'Single assignee when assignment_mode=single. Everyone uses NULL; selected users are in task_assignees.';
comment on column public.progress_entries.notes is
  'Progress note shared with room members. Use shared_notes visibility=private for a private note.';
comment on column public.presence.device_label is
  'User-supplied generic label such as Computer or Telefono; never a fingerprint or raw user-agent.';

commit;

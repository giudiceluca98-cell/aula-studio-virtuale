-- Conversation-aware message center. Existing room messages are preserved in
-- one permanent lobby per room. Private and group conversations are visible
-- only to their active members.

create table public.message_conversations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  kind text not null check (kind in ('lobby', 'private', 'group')),
  title text check (title is null or char_length(title) between 1 and 120),
  created_by uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  archived_at timestamptz,
  unique (id, room_id),
  foreign key (room_id, created_by)
    references public.room_members(room_id, user_id) on delete set null (created_by)
);

create unique index message_conversations_one_lobby_per_room
  on public.message_conversations(room_id)
  where kind = 'lobby';
create index message_conversations_room_updated_idx
  on public.message_conversations(room_id, updated_at desc);

create table public.message_conversation_members (
  conversation_id uuid not null,
  room_id uuid not null,
  user_id uuid not null,
  joined_at timestamptz not null default clock_timestamp(),
  last_read_at timestamptz,
  left_at timestamptz,
  primary key (conversation_id, user_id),
  foreign key (conversation_id, room_id)
    references public.message_conversations(id, room_id) on delete cascade,
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade
);

create index message_conversation_members_user_idx
  on public.message_conversation_members(room_id, user_id, left_at);

insert into public.message_conversations (room_id, kind, title, created_by)
select r.id, 'lobby', 'Lobby generale', r.created_by
from public.study_rooms r
where r.deleted_at is null
on conflict (room_id) where kind = 'lobby' do nothing;

alter table public.messages
  add column conversation_id uuid,
  add column message_type text not null default 'text'
    check (message_type in ('text', 'system')),
  add column attachments jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5);

update public.messages m
set conversation_id = c.id
from public.message_conversations c
where c.room_id = m.room_id
  and c.kind = 'lobby'
  and m.conversation_id is null;

alter table public.messages
  add constraint messages_conversation_room_fkey
  foreign key (conversation_id, room_id)
  references public.message_conversations(id, room_id) on delete cascade;

create index messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc)
  where deleted_at is null;

create or replace function public.is_message_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.message_conversations c
    where c.id = p_conversation_id
      and c.archived_at is null
      and (
        (c.kind = 'lobby' and public.is_room_member(c.room_id))
        or exists (
          select 1
          from public.message_conversation_members cm
          where cm.conversation_id = c.id
            and cm.user_id = auth.uid()
            and cm.left_at is null
        )
      )
  );
$$;

create or replace function public.assign_message_lobby()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.conversation_id is null then
    select c.id into new.conversation_id
    from public.message_conversations c
    where c.room_id = new.room_id and c.kind = 'lobby';
  end if;
  return new;
end;
$$;

create trigger messages_assign_lobby
before insert on public.messages
for each row execute function public.assign_message_lobby();

create or replace function public.create_room_message_lobby()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.message_conversations(room_id, kind, title, created_by)
  -- The creator is added to room_members immediately after the room row in
  -- the existing creation flow, so the permanent Lobby is created without a
  -- creator to avoid a transient composite-FK violation.
  values (new.id, 'lobby', 'Lobby generale', null)
  on conflict (room_id) where kind = 'lobby' do nothing;
  return new;
end;
$$;

create trigger study_rooms_create_message_lobby
after insert on public.study_rooms
for each row execute function public.create_room_message_lobby();

create or replace function public.touch_message_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.message_conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_message_conversation();

create or replace function public.create_message_conversation(
  p_room_id uuid,
  p_kind text,
  p_title text,
  p_participant_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_participants uuid[];
  v_other_user uuid;
begin
  if auth.uid() is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'Room membership required';
  end if;
  if p_kind not in ('private', 'group') then
    raise exception using errcode = '22023', message = 'Invalid conversation kind';
  end if;

  select array_agg(distinct participant_id order by participant_id)
  into v_participants
  from unnest(coalesce(p_participant_ids, '{}'::uuid[]) || auth.uid()) participant_id
  where participant_id is not null;

  if exists (
    select 1 from unnest(v_participants) participant_id
    where not exists (
      select 1 from public.room_members rm
      where rm.room_id = p_room_id
        and rm.user_id = participant_id
        and rm.left_at is null
    )
  ) then
    raise exception using errcode = '42501', message = 'All participants must belong to the room';
  end if;

  if p_kind = 'private' then
    if cardinality(v_participants) <> 2 then
      raise exception using errcode = '22023', message = 'A private conversation requires two participants';
    end if;
    select participant_id into v_other_user
    from unnest(v_participants) participant_id
    where participant_id <> auth.uid();

    select c.id into v_conversation_id
    from public.message_conversations c
    where c.room_id = p_room_id
      and c.kind = 'private'
      and c.archived_at is null
      and exists (
        select 1 from public.message_conversation_members cm
        where cm.conversation_id = c.id and cm.user_id = auth.uid() and cm.left_at is null
      )
      and exists (
        select 1 from public.message_conversation_members cm
        where cm.conversation_id = c.id and cm.user_id = v_other_user and cm.left_at is null
      )
      and 2 = (
        select count(*) from public.message_conversation_members cm
        where cm.conversation_id = c.id and cm.left_at is null
      )
    limit 1;
    if v_conversation_id is not null then return v_conversation_id; end if;
  elsif cardinality(v_participants) < 3 then
    raise exception using errcode = '22023', message = 'A group requires at least three participants';
  end if;

  insert into public.message_conversations(room_id, kind, title, created_by)
  values (
    p_room_id,
    p_kind,
    case when p_kind = 'group' then left(nullif(btrim(p_title), ''), 120) else null end,
    auth.uid()
  )
  returning id into v_conversation_id;

  if p_kind = 'group' and nullif(btrim(p_title), '') is null then
    raise exception using errcode = '22023', message = 'A group title is required';
  end if;

  insert into public.message_conversation_members(conversation_id, room_id, user_id)
  select v_conversation_id, p_room_id, participant_id
  from unnest(v_participants) participant_id;

  return v_conversation_id;
end;
$$;

create or replace function public.mark_message_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_room_id uuid;
begin
  select c.kind, c.room_id into v_kind, v_room_id
  from public.message_conversations c
  where c.id = p_conversation_id;
  if not public.is_message_conversation_member(p_conversation_id) then
    raise exception using errcode = '42501', message = 'Conversation membership required';
  end if;
  if v_kind = 'lobby' then return; end if;
  update public.message_conversation_members
  set last_read_at = clock_timestamp()
  where conversation_id = p_conversation_id and user_id = auth.uid() and room_id = v_room_id;
end;
$$;

alter table public.message_conversations enable row level security;
alter table public.message_conversation_members enable row level security;

create policy message_conversations_select_member
on public.message_conversations for select to authenticated
using (public.is_message_conversation_member(id));

create policy message_conversation_members_select_conversation
on public.message_conversation_members for select to authenticated
using (public.is_message_conversation_member(conversation_id));

drop policy if exists messages_select_member on public.messages;
create policy messages_select_conversation_member
on public.messages for select to authenticated
using (public.is_message_conversation_member(conversation_id));

drop policy if exists messages_insert_self on public.messages;
create policy messages_insert_conversation_self
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.is_room_member(room_id)
  and public.is_message_conversation_member(conversation_id)
);

drop policy if exists messages_update_self on public.messages;
create policy messages_update_conversation_self
on public.messages for update to authenticated
using (sender_id = auth.uid() and public.is_message_conversation_member(conversation_id))
with check (sender_id = auth.uid() and public.is_message_conversation_member(conversation_id));

drop policy if exists messages_delete_self_or_admin on public.messages;
create policy messages_delete_conversation_self_or_admin
on public.messages for delete to authenticated
using (
  public.is_message_conversation_member(conversation_id)
  and (sender_id = auth.uid() or public.is_room_admin(room_id))
);

grant select on public.message_conversations to authenticated;
grant select on public.message_conversation_members to authenticated;
revoke all on function public.is_message_conversation_member(uuid) from public, anon;
grant execute on function public.is_message_conversation_member(uuid) to authenticated;
revoke all on function public.create_message_conversation(uuid, text, text, uuid[]) from public, anon;
grant execute on function public.create_message_conversation(uuid, text, text, uuid[]) to authenticated;
revoke all on function public.mark_message_conversation_read(uuid) from public, anon;
grant execute on function public.mark_message_conversation_read(uuid) to authenticated;
revoke all on function public.assign_message_lobby() from public, anon, authenticated;
revoke all on function public.create_room_message_lobby() from public, anon, authenticated;
revoke all on function public.touch_message_conversation() from public, anon, authenticated;
grant insert (id, room_id, sender_id, content, client_id, reply_to_id, conversation_id, attachments)
  on public.messages to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  10485760,
  array[
    'application/pdf', 'text/plain', 'text/markdown',
    'image/png', 'image/jpeg', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy message_attachments_select_conversation_member
on storage.objects for select to authenticated
using (
  bucket_id = 'message-attachments'
  and public.is_message_conversation_member(((storage.foldername(name))[1])::uuid)
);

create policy message_attachments_insert_conversation_member
on storage.objects for insert to authenticated
with check (
  bucket_id = 'message-attachments'
  and public.is_message_conversation_member(((storage.foldername(name))[1])::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy message_attachments_delete_owner
on storage.objects for delete to authenticated
using (
  bucket_id = 'message-attachments'
  and owner_id = auth.uid()::text
  and public.is_message_conversation_member(((storage.foldername(name))[1])::uuid)
);

alter table public.message_conversations replica identity full;
alter table public.message_conversation_members replica identity full;

do $publication$
declare
  v_table text;
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['message_conversations', 'message_conversation_members'] loop
      if not exists (
        select 1 from pg_catalog.pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$publication$;

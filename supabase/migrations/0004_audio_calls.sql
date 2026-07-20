-- Real audio calls: targeted invitations, group participation and WebRTC signals.

alter table public.call_sessions
  add column if not exists call_kind text not null default 'direct';

do $constraints$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'call_sessions_kind_check'
      and conrelid = 'public.call_sessions'::regclass
  ) then
    alter table public.call_sessions
      add constraint call_sessions_kind_check
      check (call_kind in ('direct', 'group'));
  end if;
end;
$constraints$;

-- Discard the old UI-only call placeholders before enabling real invitations.
update public.call_sessions
set status = 'cancelled',
    ended_at = coalesce(ended_at, clock_timestamp()),
    updated_at = clock_timestamp()
where status in ('waiting', 'active');

create table if not exists public.call_participants (
  call_id uuid not null,
  room_id uuid not null,
  user_id uuid not null,
  state text not null default 'invited'
    check (state in ('invited', 'joined', 'declined', 'left')),
  invited_by uuid not null,
  invited_at timestamptz not null default clock_timestamp(),
  joined_at timestamptz,
  left_at timestamptz,
  primary key (call_id, user_id),
  foreign key (call_id, room_id)
    references public.call_sessions(id, room_id) on delete cascade,
  foreign key (room_id, user_id)
    references public.room_members(room_id, user_id) on delete cascade,
  foreign key (room_id, invited_by)
    references public.room_members(room_id, user_id) on delete cascade
);

create index if not exists call_participants_call_state_idx
  on public.call_participants(call_id, state);

create unique index if not exists call_participants_user_open_idx
  on public.call_participants(room_id, user_id)
  where state in ('invited', 'joined');

create or replace function public.is_call_participant(p_call_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.call_participants cp
    join public.room_members rm
      on rm.room_id = cp.room_id
     and rm.user_id = cp.user_id
    where cp.call_id = p_call_id
      and cp.user_id = auth.uid()
      and cp.state in ('invited', 'joined')
      and rm.left_at is null
  );
$$;

create or replace function public.create_study_call(
  p_room_id uuid,
  p_invitee_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitees uuid[];
  v_valid_count integer;
  v_call_id uuid;
begin
  if v_user_id is null or not public.is_room_member(p_room_id) then
    raise exception using errcode = '42501', message = 'Active room membership required';
  end if;

  select pg_catalog.array_agg(candidate order by candidate)
  into v_invitees
  from (
    select distinct candidate
    from pg_catalog.unnest(coalesce(p_invitee_ids, '{}'::uuid[])) candidate
    where candidate is not null and candidate <> v_user_id
  ) selected;

  if coalesce(pg_catalog.cardinality(v_invitees), 0) not between 1 and 6 then
    raise exception using errcode = '22023', message = 'Choose between one and six participants';
  end if;

  select pg_catalog.count(*)::integer
  into v_valid_count
  from public.room_members rm
  where rm.room_id = p_room_id
    and rm.user_id = any(v_invitees)
    and rm.left_at is null;

  if v_valid_count <> pg_catalog.cardinality(v_invitees) then
    raise exception using errcode = '22023', message = 'One or more selected users are not active room members';
  end if;

  insert into public.call_sessions (room_id, started_by, call_kind, status)
  values (
    p_room_id,
    v_user_id,
    case when pg_catalog.cardinality(v_invitees) = 1 then 'direct' else 'group' end,
    'waiting'
  )
  returning id into v_call_id;

  insert into public.call_participants (
    call_id, room_id, user_id, state, invited_by, joined_at
  ) values (
    v_call_id, p_room_id, v_user_id, 'joined', v_user_id, clock_timestamp()
  );

  insert into public.call_participants (
    call_id, room_id, user_id, state, invited_by
  )
  select v_call_id, p_room_id, invitee_id, 'invited', v_user_id
  from pg_catalog.unnest(v_invitees) invitee_id;

  return v_call_id;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'A selected participant already has another call open';
end;
$$;

create or replace function public.respond_to_study_call(
  p_call_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_call public.call_sessions;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select cs.* into v_call
  from public.call_sessions cs
  where cs.id = p_call_id
    and cs.status in ('waiting', 'active')
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Call is no longer available';
  end if;

  update public.call_participants cp
  set state = case when p_accept then 'joined' else 'declined' end,
      joined_at = case when p_accept then clock_timestamp() else cp.joined_at end,
      left_at = case when p_accept then null else clock_timestamp() end
  where cp.call_id = p_call_id
    and cp.user_id = v_user_id
    and cp.state = 'invited';

  if not found then
    raise exception using errcode = '42501', message = 'A pending invitation is required';
  end if;

  if p_accept then
    update public.call_sessions cs
    set status = 'active',
        started_at = coalesce(cs.started_at, clock_timestamp()),
        updated_at = clock_timestamp()
    where cs.id = p_call_id;
    return;
  end if;

  if not exists (
    select 1 from public.call_participants cp
    where cp.call_id = p_call_id and cp.state = 'invited'
  ) and not exists (
    select 1 from public.call_participants cp
    where cp.call_id = p_call_id
      and cp.state = 'joined'
      and cp.user_id <> v_call.started_by
  ) then
    update public.call_participants cp
    set state = 'left', left_at = clock_timestamp()
    where cp.call_id = p_call_id and cp.state = 'joined';

    update public.call_sessions cs
    set status = 'cancelled', ended_at = clock_timestamp(), updated_at = clock_timestamp()
    where cs.id = p_call_id;
  end if;
end;
$$;

create or replace function public.leave_study_call(p_call_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_call public.call_sessions;
  v_end_everyone boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select cs.* into v_call
  from public.call_sessions cs
  where cs.id = p_call_id and cs.status in ('waiting', 'active')
  for update;

  if not found then return; end if;

  update public.call_participants cp
  set state = 'left', left_at = clock_timestamp()
  where cp.call_id = p_call_id
    and cp.user_id = v_user_id
    and cp.state in ('invited', 'joined');

  if not found then
    raise exception using errcode = '42501', message = 'Call participation required';
  end if;

  v_end_everyone := v_call.call_kind = 'direct'
    or (v_call.started_by = v_user_id and v_call.status = 'waiting');

  if v_end_everyone or not exists (
    select 1 from public.call_participants cp
    where cp.call_id = p_call_id and cp.state = 'joined'
  ) then
    update public.call_participants cp
    set state = 'left', left_at = coalesce(cp.left_at, clock_timestamp())
    where cp.call_id = p_call_id and cp.state in ('invited', 'joined');

    update public.call_sessions cs
    set status = case when cs.started_at is null then 'cancelled'::public.call_status else 'ended'::public.call_status end,
        ended_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where cs.id = p_call_id;
  end if;
end;
$$;

alter table public.call_participants enable row level security;

drop policy if exists call_sessions_select_member on public.call_sessions;
drop policy if exists call_sessions_insert_member on public.call_sessions;
drop policy if exists call_sessions_update_member on public.call_sessions;
drop policy if exists call_sessions_delete_starter_or_admin on public.call_sessions;

create policy call_sessions_select_participant
on public.call_sessions for select
to authenticated
using (public.is_call_participant(id));

create policy call_participants_select_same_call
on public.call_participants for select
to authenticated
using (public.is_call_participant(call_id));

drop policy if exists call_signals_select_participant on public.call_signals;
drop policy if exists call_signals_insert_sender on public.call_signals;

create policy call_signals_select_participant
on public.call_signals for select
to authenticated
using (
  public.is_call_participant(call_id)
  and (sender_id = auth.uid() or recipient_id = auth.uid())
);

create policy call_signals_insert_joined_sender
on public.call_signals for insert
to authenticated
with check (
  sender_id = auth.uid()
  and recipient_id is not null
  and exists (
    select 1 from public.call_participants sender
    where sender.call_id = call_signals.call_id
      and sender.room_id = call_signals.room_id
      and sender.user_id = auth.uid()
      and sender.state = 'joined'
  )
  and exists (
    select 1 from public.call_participants recipient
    where recipient.call_id = call_signals.call_id
      and recipient.room_id = call_signals.room_id
      and recipient.user_id = call_signals.recipient_id
      and recipient.state = 'joined'
  )
);

revoke insert, update, delete on public.call_sessions from authenticated;
grant select on public.call_sessions to authenticated;
grant select on public.call_participants to authenticated;
grant select, delete on public.call_signals to authenticated;
grant insert (
  room_id, call_id, sender_id, recipient_id, signal_type, payload
) on public.call_signals to authenticated;
grant usage, select on sequence public.call_signals_id_seq to authenticated;

revoke all on function public.is_call_participant(uuid) from public;
revoke all on function public.create_study_call(uuid, uuid[]) from public;
revoke all on function public.respond_to_study_call(uuid, boolean) from public;
revoke all on function public.leave_study_call(uuid) from public;
grant execute on function public.is_call_participant(uuid) to authenticated;
grant execute on function public.create_study_call(uuid, uuid[]) to authenticated;
grant execute on function public.respond_to_study_call(uuid, boolean) to authenticated;
grant execute on function public.leave_study_call(uuid) to authenticated;

alter table public.call_participants replica identity full;

do $publication$
begin
  if exists (
    select 1 from pg_catalog.pg_publication p
    where p.pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_catalog.pg_publication_tables pt
    where pt.pubname = 'supabase_realtime'
      and pt.schemaname = 'public'
      and pt.tablename = 'call_participants'
  ) then
    alter publication supabase_realtime add table public.call_participants;
  end if;
end;
$publication$;

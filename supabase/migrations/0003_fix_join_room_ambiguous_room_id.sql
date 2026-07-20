-- Avoid a PL/pgSQL name collision between the join_study_room output column
-- (`room_id`) and the room_members conflict target column with the same name.

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
  on conflict on constraint room_members_pkey do update
  set joined_at = excluded.joined_at,
      left_at = null;

  if not v_was_active then
    update public.room_invites ri
    set use_count = ri.use_count + 1
    where ri.id = v_invite.id;

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

revoke all on function public.join_study_room(text) from public;
grant execute on function public.join_study_room(text) to authenticated;

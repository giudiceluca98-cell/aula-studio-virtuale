-- Keep the final cancelled/ended update visible to every invited participant.
-- Open-call eligibility is still enforced by call_participants.state in the UI,
-- RPCs and the partial unique index.

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
      and rm.left_at is null
  );
$$;

revoke all on function public.is_call_participant(uuid) from public;
grant execute on function public.is_call_participant(uuid) to authenticated;

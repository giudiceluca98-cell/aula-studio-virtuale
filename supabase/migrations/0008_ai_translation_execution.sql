begin;

create table public.ai_model_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  material_id uuid not null,
  request_hash text not null check (char_length(request_hash) = 64),
  selected_text_hash text not null check (char_length(selected_text_hash) = 64),
  operation_type text not null check (char_length(operation_type) between 1 and 80),
  source_language text not null check (char_length(source_language) between 2 and 35),
  target_language text not null check (char_length(target_language) between 2 and 35),
  approved_model text not null check (approved_model = 'gpt-5.6-sol'),
  fallback_model text check (fallback_model is null or char_length(fallback_model) <= 160),
  reason_code text not null check (char_length(reason_code) between 1 and 100),
  estimated_input_tokens integer not null check (estimated_input_tokens >= 0),
  estimated_output_tokens integer not null check (estimated_output_tokens >= 0),
  estimated_cost_usd numeric(12,8) not null check (estimated_cost_usd >= 0),
  max_authorized_cost_usd numeric(12,8) not null check (max_authorized_cost_usd >= estimated_cost_usd),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'used', 'expired', 'revoked', 'failed_after_dispatch')),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  foreign key (material_id, room_id)
    references public.materials(id, room_id) on delete cascade,
  check (expires_at > created_at)
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  material_id uuid not null,
  operation_type text not null check (char_length(operation_type) between 1 and 80),
  model_id text not null check (char_length(model_id) between 1 and 160),
  routing_mode text check (routing_mode is null or char_length(routing_mode) <= 40),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  cached_input_tokens integer check (cached_input_tokens is null or cached_input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_usd numeric(12,8) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  actual_cost_usd numeric(12,8) check (actual_cost_usd is null or actual_cost_usd >= 0),
  cache_hit boolean not null default false,
  escalation_from text check (escalation_from is null or char_length(escalation_from) <= 160),
  consent_id uuid references public.ai_model_consents(id) on delete set null,
  request_hash text not null check (char_length(request_hash) = 64),
  status text not null default 'reserved'
    check (status in ('reserved', 'completed', 'failed_before_dispatch', 'failed_after_dispatch', 'blocked')),
  error_code text check (error_code is null or char_length(error_code) <= 100),
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  foreign key (material_id, room_id)
    references public.materials(id, room_id) on delete cascade
);

create unique index ai_usage_one_inflight_request_idx
  on public.ai_usage_events(user_id, request_hash, operation_type)
  where status = 'reserved';
create index ai_usage_user_created_idx
  on public.ai_usage_events(user_id, created_at desc);
create index ai_usage_monthly_cost_idx
  on public.ai_usage_events(created_at, user_id)
  where status in ('completed', 'failed_after_dispatch') and cache_hit = false;
create index ai_model_consents_user_status_idx
  on public.ai_model_consents(user_id, status, expires_at);

alter table public.ai_usage_events enable row level security;
alter table public.ai_model_consents enable row level security;

create policy ai_usage_events_select_own
on public.ai_usage_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy ai_model_consents_select_own
on public.ai_model_consents for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.ai_usage_events from public, anon, authenticated;
revoke all on public.ai_model_consents from public, anon, authenticated;
grant select on public.ai_usage_events to authenticated;
grant select on public.ai_model_consents to authenticated;

create or replace function public.reserve_ai_usage(
  p_user_id uuid,
  p_room_id uuid,
  p_material_id uuid,
  p_operation_type text,
  p_model_id text,
  p_routing_mode text,
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
  if p_daily_limit < 1 or p_daily_limit > 10000 then
    return query select false, null::uuid, 'INVALID_LIMIT'::text;
    return;
  end if;

  if not exists (
    select 1
    from public.room_members rm
    join public.materials m
      on m.room_id = rm.room_id and m.id = p_material_id
    join public.study_rooms r on r.id = rm.room_id
    where rm.room_id = p_room_id
      and rm.user_id = p_user_id
      and rm.left_at is null
      and r.deleted_at is null
  ) then
    return query select false, null::uuid, 'ACCESS_DENIED'::text;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 47811)
  );

  select count(*)::integer
  into v_count
  from public.ai_usage_events e
  where e.user_id = p_user_id
    and e.cache_hit = false
    and e.created_at >= pg_catalog.date_trunc('day', clock_timestamp())
    and e.status in ('reserved', 'completed', 'failed_after_dispatch');

  if v_count >= p_daily_limit then
    return query select false, null::uuid, 'DAILY_LIMIT_REACHED'::text;
    return;
  end if;

  begin
    insert into public.ai_usage_events (
      user_id, room_id, material_id, operation_type, model_id,
      routing_mode, request_hash, estimated_cost_usd, cache_hit, status
    ) values (
      p_user_id, p_room_id, p_material_id, pg_catalog.left(p_operation_type, 80),
      pg_catalog.left(p_model_id, 160), pg_catalog.left(p_routing_mode, 40),
      p_request_hash, p_estimated_cost_usd, false, 'reserved'
    ) returning id into v_usage_id;
  exception when unique_violation then
    return query select false, null::uuid, 'REQUEST_IN_PROGRESS'::text;
    return;
  end;

  return query select true, v_usage_id, 'RESERVED'::text;
end;
$$;

revoke all on function public.reserve_ai_usage(
  uuid, uuid, uuid, text, text, text, text, numeric, integer
) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(
  uuid, uuid, uuid, text, text, text, text, numeric, integer
) to service_role;

commit;

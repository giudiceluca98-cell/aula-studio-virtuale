-- CORE-2.0 — chat contestuale grounded privata e tracciabile.
-- Nessuna memoria permanente, streaming o conversazione condivisa viene introdotta.
begin;

do $$ begin create type public.eve_grounded_chat_status as enum ('running','completed','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.eve_chat_depth as enum ('brief','normal','deep'); exception when duplicate_object then null; end $$;

create table if not exists public.eve_grounded_chat_turns (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  actor_id uuid not null,
  conversation_id uuid not null,
  user_message_id uuid not null,
  assistant_message_id uuid,
  context_digest text not null check (context_digest ~ '^[0-9a-f]{64}$'),
  message_sha256 text not null check (message_sha256 ~ '^[0-9a-f]{64}$'),
  depth public.eve_chat_depth not null,
  allow_general_knowledge boolean not null default false,
  knowledge_scope text check (knowledge_scope is null or knowledge_scope in ('materials_only','materials_plus_general_labeled')),
  status public.eve_grounded_chat_status not null default 'running',
  provider text check (provider is null or char_length(provider) between 1 and 160),
  model text check (model is null or char_length(model) between 1 and 240),
  grounded boolean,
  not_found boolean,
  general_knowledge_used boolean,
  uncertainty text check (uncertainty is null or uncertainty in ('low','medium','high')),
  facts_count integer not null default 0 check (facts_count between 0 and 100),
  hypotheses_count integer not null default 0 check (hypotheses_count between 0 and 100),
  suggestions_count integer not null default 0 check (suggestions_count between 0 and 100),
  source_count integer not null default 0 check (source_count between 0 and 20),
  fallback_used boolean not null default false,
  fallback_reason text check (fallback_reason is null or char_length(fallback_reason) <= 160),
  error_code text check (error_code is null or char_length(error_code) <= 160),
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  unique (id, room_id),
  unique (user_message_id),
  foreign key (room_id, actor_id) references public.room_members(room_id, user_id) on delete cascade,
  foreign key (conversation_id, room_id) references public.eve_conversations(id, room_id) on delete cascade,
  foreign key (user_message_id, conversation_id, room_id)
    references public.eve_messages(id, conversation_id, room_id) on delete cascade,
  foreign key (assistant_message_id, conversation_id, room_id)
    references public.eve_messages(id, conversation_id, room_id) on delete set null (assistant_message_id),
  check (allow_general_knowledge or coalesce(general_knowledge_used, false) = false),
  check (
    (status = 'running' and completed_at is null and assistant_message_id is null)
    or (status = 'completed' and completed_at is not null and assistant_message_id is not null and error_code is null)
    or (status = 'failed' and completed_at is not null and error_code is not null)
  )
);

create index if not exists eve_grounded_chat_actor_created on public.eve_grounded_chat_turns(actor_id, created_at desc);
create index if not exists eve_grounded_chat_room_created on public.eve_grounded_chat_turns(room_id, created_at desc);
create index if not exists eve_grounded_chat_conversation on public.eve_grounded_chat_turns(conversation_id, created_at);

alter table public.eve_grounded_chat_turns enable row level security;
create policy eve_grounded_chat_select_owner on public.eve_grounded_chat_turns for select to authenticated
  using (actor_id = auth.uid() and public.is_room_member(room_id));
create policy eve_grounded_chat_insert_owner on public.eve_grounded_chat_turns for insert to authenticated
  with check (
    actor_id = auth.uid()
    and public.is_room_member(room_id)
    and status = 'running'
    and assistant_message_id is null
    and provider is null
    and model is null
    and grounded is null
    and not_found is null
    and general_knowledge_used is null
    and knowledge_scope is null
    and uncertainty is null
    and facts_count = 0
    and hypotheses_count = 0
    and suggestions_count = 0
    and source_count = 0
    and fallback_used = false
    and fallback_reason is null
    and error_code is null
    and completed_at is null
    and exists (
      select 1 from public.eve_conversations c
      where c.id = conversation_id and c.room_id = room_id
        and c.owner_id = auth.uid() and c.status = 'active'
    )
  );

revoke delete on public.eve_grounded_chat_turns from anon, authenticated;
grant select, insert on public.eve_grounded_chat_turns to authenticated;
grant select, insert, update on public.eve_grounded_chat_turns to service_role;

insert into public.eve_schema_metadata(key, value) values
  ('schema_version', '"2.0.0"'::jsonb),
  ('checkpoint', '"CORE-2.0"'::jsonb),
  ('grounded_chat_enabled_by_default', 'false'::jsonb),
  ('grounded_chat_private_only', 'true'::jsonb),
  ('grounded_chat_memory_writes', 'false'::jsonb),
  ('grounded_chat_actions_executed', 'false'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

commit;

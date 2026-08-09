-- CORE-1.7 — Gate MVP end-to-end, tracce di esecuzione e feedback.
-- Nessuna memoria permanente o azione applicativa viene creata da questa migrazione.

begin;

do $$ begin
  create type public.eve_mvp_run_status as enum ('running','completed','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_feedback_rating as enum ('helpful','not_helpful','incorrect','unsafe');
exception when duplicate_object then null; end $$;

-- Consente FK composite che provano appartenenza del messaggio alla stessa
-- conversazione e aula, senza modificare la migrazione 0018 già applicata.
create unique index if not exists eve_messages_id_conversation_room_unique
  on public.eve_messages(id, conversation_id, room_id);

create table if not exists public.eve_mvp_runs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  actor_id uuid not null,
  conversation_id uuid not null,
  user_message_id uuid not null,
  assistant_message_id uuid,
  context_digest text not null check (context_digest ~ '^[0-9a-f]{64}$'),
  question_sha256 text not null check (question_sha256 ~ '^[0-9a-f]{64}$'),
  status public.eve_mvp_run_status not null default 'running',
  provider text check (provider is null or char_length(provider) between 1 and 160),
  model text check (model is null or char_length(model) between 1 and 240),
  grounded boolean,
  uncertainty text check (uncertainty is null or uncertainty in ('low','medium','high')),
  source_count integer not null default 0 check (source_count between 0 and 20),
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
  check (
    (status = 'running' and completed_at is null and assistant_message_id is null)
    or (status = 'completed' and completed_at is not null and assistant_message_id is not null and error_code is null)
    or (status = 'failed' and completed_at is not null and error_code is not null)
  )
);

create table if not exists public.eve_response_feedback (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  conversation_id uuid not null,
  response_message_id uuid not null,
  user_id uuid not null,
  rating public.eve_feedback_rating not null,
  note text check (note is null or char_length(note) between 4 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (response_message_id, user_id),
  foreign key (room_id, user_id) references public.room_members(room_id, user_id) on delete cascade,
  foreign key (conversation_id, room_id) references public.eve_conversations(id, room_id) on delete cascade,
  foreign key (response_message_id, conversation_id, room_id)
    references public.eve_messages(id, conversation_id, room_id) on delete cascade
);

create index if not exists eve_mvp_runs_actor_created
  on public.eve_mvp_runs(actor_id, created_at desc);
create index if not exists eve_mvp_runs_room_status
  on public.eve_mvp_runs(room_id, status, created_at desc);
create index if not exists eve_response_feedback_user_created
  on public.eve_response_feedback(user_id, created_at desc);

create trigger eve_response_feedback_touch
  before update on public.eve_response_feedback
  for each row execute function public.eve_touch_updated_at();

alter table public.eve_mvp_runs enable row level security;
alter table public.eve_response_feedback enable row level security;

create policy eve_mvp_runs_select_owner
  on public.eve_mvp_runs for select to authenticated
  using (actor_id = auth.uid() and public.is_room_member(room_id));
create policy eve_mvp_runs_insert_owner
  on public.eve_mvp_runs for insert to authenticated
  with check (
    actor_id = auth.uid()
    and public.is_room_member(room_id)
    and status = 'running'
    and assistant_message_id is null
    and provider is null
    and model is null
    and grounded is null
    and uncertainty is null
    and source_count = 0
    and error_code is null
    and completed_at is null
  );

create policy eve_response_feedback_select_owner
  on public.eve_response_feedback for select to authenticated
  using (user_id = auth.uid() and public.is_room_member(room_id));
create policy eve_response_feedback_insert_owner
  on public.eve_response_feedback for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_room_member(room_id)
    and exists (
      select 1 from public.eve_conversations c
      where c.id = conversation_id and c.room_id = room_id and c.owner_id = auth.uid()
    )
  );
create policy eve_response_feedback_update_owner
  on public.eve_response_feedback for update to authenticated
  using (user_id = auth.uid() and public.is_room_member(room_id))
  with check (user_id = auth.uid() and public.is_room_member(room_id));

revoke delete on public.eve_mvp_runs, public.eve_response_feedback from anon, authenticated;
grant select, insert on public.eve_mvp_runs to authenticated;
grant select, insert, update on public.eve_response_feedback to authenticated;
grant select, insert, update on public.eve_mvp_runs, public.eve_response_feedback to service_role;

insert into public.eve_schema_metadata(key, value)
values
  ('schema_version', '"1.7.0"'::jsonb),
  ('checkpoint', '"CORE-1.7"'::jsonb),
  ('mvp_gate_enabled_by_default', 'false'::jsonb),
  ('mvp_memory_writes', 'false'::jsonb),
  ('mvp_actions_executed', 'false'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

commit;

-- CORE-1.4 — identità, ruoli didattici e audit minimizzato del Context Builder.
-- Nessun testo selezionato viene persistito: soltanto lunghezza e SHA-256.

begin;

do $$ begin
  create type public.eve_learning_role as enum ('student','teacher','author','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_context_scope as enum ('private','room_shared');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_context_outcome as enum ('success','rejected','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.eve_room_roles (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  role public.eve_learning_role not null,
  granted_by uuid not null,
  reason text check (reason is null or char_length(reason) between 8 and 1000),
  created_at timestamptz not null default clock_timestamp(),
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text check (revoke_reason is null or char_length(revoke_reason) between 8 and 1000),
  unique (id, room_id),
  foreign key (room_id, user_id) references public.room_members(room_id, user_id) on delete cascade,
  foreign key (room_id, granted_by) references public.room_members(room_id, user_id) on delete restrict,
  foreign key (room_id, revoked_by) references public.room_members(room_id, user_id) on delete set null (revoked_by),
  check (
    (revoked_at is null and revoked_by is null and revoke_reason is null)
    or (revoked_at is not null and revoked_by is not null and revoke_reason is not null)
  )
);

create unique index if not exists eve_room_roles_active_unique
  on public.eve_room_roles(room_id, user_id, role)
  where revoked_at is null;
create index if not exists eve_room_roles_user_room
  on public.eve_room_roles(user_id, room_id, role)
  where revoked_at is null;

create table if not exists public.eve_context_audit_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  conversation_id uuid,
  scope public.eve_context_scope not null,
  context_digest text not null check (context_digest ~ '^[0-9a-f]{64}$'),
  selected_text_sha256 text check (selected_text_sha256 is null or selected_text_sha256 ~ '^[0-9a-f]{64}$'),
  selected_chars integer not null default 0 check (selected_chars between 0 and 20000),
  authorized_material_count integer not null default 0 check (authorized_material_count between 0 and 100),
  resource_ids jsonb not null default '{}'::jsonb check (jsonb_typeof(resource_ids) = 'object'),
  roles public.eve_learning_role[] not null default '{}'::public.eve_learning_role[],
  outcome public.eve_context_outcome not null,
  rejection_code text check (rejection_code is null or char_length(rejection_code) <= 160),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (room_id, user_id) references public.room_members(room_id, user_id) on delete cascade,
  foreign key (conversation_id, room_id) references public.eve_conversations(id, room_id) on delete set null (conversation_id)
);

create index if not exists eve_context_audit_user_created
  on public.eve_context_audit_events(user_id, created_at desc);
create index if not exists eve_context_audit_room_created
  on public.eve_context_audit_events(room_id, created_at desc);

create trigger eve_context_audit_append_only
  before update or delete on public.eve_context_audit_events
  for each row execute function public.eve_reject_audit_mutation();

alter table public.eve_room_roles enable row level security;
alter table public.eve_context_audit_events enable row level security;

create policy eve_room_roles_select_self_or_admin
  on public.eve_room_roles for select to authenticated
  using (user_id = auth.uid() or public.eve_require_room_admin(room_id));
create policy eve_room_roles_insert_admin
  on public.eve_room_roles for insert to authenticated
  with check (public.eve_require_room_admin(room_id) and granted_by = auth.uid());
create policy eve_room_roles_update_admin
  on public.eve_room_roles for update to authenticated
  using (public.eve_require_room_admin(room_id))
  with check (public.eve_require_room_admin(room_id));

create policy eve_context_audit_select_self_or_admin
  on public.eve_context_audit_events for select to authenticated
  using (user_id = auth.uid() or public.eve_require_room_admin(room_id));
create policy eve_context_audit_insert_self
  on public.eve_context_audit_events for insert to authenticated
  with check (user_id = auth.uid() and public.is_room_member(room_id));

revoke update, delete on public.eve_context_audit_events from anon, authenticated;
grant select, insert, update on public.eve_room_roles to authenticated;
grant select, insert on public.eve_context_audit_events to authenticated;

insert into public.eve_schema_metadata(key, value)
values
  ('schema_version', '"1.4.0"'::jsonb),
  ('checkpoint', '"CORE-1.4"'::jsonb),
  ('context_builder_enabled_by_default', 'false'::jsonb),
  ('context_persists_selected_text', 'false'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

commit;

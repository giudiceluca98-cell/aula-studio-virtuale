-- CORE-1.3 — database di produzione Eve, migrazione versionata e RLS.
-- Questa migrazione prepara lo schema; non abilita import o funzionalità applicative.

begin;

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.eve_record_status as enum ('draft','active','archived','revoked','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_prompt_status as enum ('draft','approved','retired');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_review_status as enum ('quarantined','under_review','approved','rejected','expired','superseded');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_message_role as enum ('user','assistant','system','tool');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.eve_import_status as enum ('running','completed','failed','rolled_back');
exception when duplicate_object then null; end $$;

create table if not exists public.eve_schema_metadata (
  key text primary key check (char_length(key) between 1 and 120),
  value jsonb not null default '{}'::jsonb check (jsonb_typeof(value) in ('object','string','number','boolean')),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.eve_prompt_families (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  course_id uuid,
  prompt_key text not null check (char_length(prompt_key) between 2 and 160),
  title text not null check (char_length(title) between 1 and 240),
  active_version_id uuid,
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  unique (room_id, prompt_key),
  unique (room_id, legacy_source_key),
  foreign key (course_id, room_id) references public.courses(id, room_id) on delete set null (course_id)
);

create table if not exists public.eve_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_family_id uuid not null,
  room_id uuid not null,
  version_number integer not null check (version_number > 0),
  body text not null check (char_length(body) between 1 and 200000),
  status public.eve_prompt_status not null default 'draft',
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  approved_at timestamptz,
  unique (id, room_id),
  unique (prompt_family_id, version_number),
  unique (room_id, legacy_source_key),
  foreign key (prompt_family_id, room_id) references public.eve_prompt_families(id, room_id) on delete cascade,
  check (status <> 'approved' or (approved_at is not null and approved_by is not null))
);

alter table public.eve_prompt_families
  drop constraint if exists eve_prompt_families_active_version_fk;
alter table public.eve_prompt_families
  add constraint eve_prompt_families_active_version_fk
  foreign key (active_version_id, room_id) references public.eve_prompt_versions(id, room_id) on delete set null (active_version_id);

create table if not exists public.eve_material_assets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  course_id uuid,
  title text not null check (char_length(title) between 1 and 240),
  source_type text not null check (source_type in ('upload','pasted_text','generated','approved_web')),
  source_label text check (source_label is null or char_length(source_label) <= 500),
  current_version_id uuid,
  status public.eve_record_status not null default 'draft',
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  archived_at timestamptz,
  unique (id, room_id),
  unique (room_id, legacy_source_key),
  foreign key (course_id, room_id) references public.courses(id, room_id) on delete set null (course_id)
);

create table if not exists public.eve_material_versions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null,
  room_id uuid not null,
  version_number integer not null check (version_number > 0),
  filename text not null check (char_length(filename) between 1 and 255),
  media_type text not null check (char_length(media_type) between 1 and 160),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint not null check (size_bytes between 0 and 200000000),
  extracted_text text,
  extracted_chars integer not null default 0 check (extracted_chars >= 0),
  chunk_count integer not null default 0 check (chunk_count >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  status public.eve_record_status not null default 'draft',
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  unique (id, room_id),
  unique (material_id, version_number),
  unique (room_id, checksum_sha256),
  unique (room_id, legacy_source_key),
  foreign key (material_id, room_id) references public.eve_material_assets(id, room_id) on delete cascade,
  check (extracted_text is null or char_length(extracted_text) = extracted_chars)
);

alter table public.eve_material_assets
  drop constraint if exists eve_material_assets_current_version_fk;
alter table public.eve_material_assets
  add constraint eve_material_assets_current_version_fk
  foreign key (current_version_id, room_id) references public.eve_material_versions(id, room_id) on delete set null (current_version_id);

create table if not exists public.eve_material_chunks (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null,
  room_id uuid not null,
  chunk_index integer not null check (chunk_index >= 0),
  start_char integer not null check (start_char >= 0),
  end_char integer not null check (end_char >= start_char),
  text_content text not null check (char_length(text_content) > 0),
  text_sha256 text not null check (text_sha256 ~ '^[0-9a-f]{64}$'),
  embedding_status text not null default 'not_requested' check (embedding_status in ('not_requested','pending','ready','failed')),
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_at timestamptz not null default clock_timestamp(),
  unique (version_id, chunk_index),
  unique (room_id, legacy_source_key),
  foreign key (version_id, room_id) references public.eve_material_versions(id, room_id) on delete cascade
);

create table if not exists public.eve_research_projects (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  objective text not null check (char_length(objective) between 1 and 4000),
  domain text not null check (char_length(domain) between 1 and 160),
  language text not null check (char_length(language) between 2 and 16),
  status public.eve_record_status not null default 'draft',
  human_review_required boolean not null default true,
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  unique (room_id, legacy_source_key)
);

create table if not exists public.eve_research_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  room_id uuid not null,
  url text not null check (char_length(url) between 8 and 4096 and url ~* '^https?://'),
  title text check (title is null or char_length(title) <= 500),
  publisher text check (publisher is null or char_length(publisher) <= 300),
  published_at timestamptz,
  language text check (language is null or char_length(language) <= 16),
  license text check (license is null or char_length(license) <= 240),
  trust_level text not null default 'unreviewed',
  review_status public.eve_review_status not null default 'quarantined',
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  unique (project_id, url),
  unique (room_id, legacy_source_key),
  foreign key (project_id, room_id) references public.eve_research_projects(id, room_id) on delete cascade
);

create table if not exists public.eve_source_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  room_id uuid not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  status public.eve_review_status not null,
  decision_reason text not null check (char_length(decision_reason) between 8 and 4000),
  quality smallint not null check (quality between 0 and 100),
  authority smallint not null check (authority between 0 and 100),
  freshness smallint not null check (freshness between 0 and 100),
  relevance smallint not null check (relevance between 0 and 100),
  completeness smallint not null check (completeness between 0 and 100),
  suspicious_content boolean not null default false,
  prompt_injection_detected boolean not null default false,
  risk_acknowledged boolean not null default false,
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, room_id),
  unique (room_id, legacy_source_key),
  foreign key (source_id, room_id) references public.eve_research_sources(id, room_id) on delete cascade,
  check (not prompt_injection_detected or risk_acknowledged or status <> 'approved')
);

create table if not exists public.eve_source_promotions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  review_id uuid not null,
  material_id uuid not null,
  room_id uuid not null,
  promoted_by uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 16 and 160),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoke_reason text check (revoke_reason is null or char_length(revoke_reason) between 8 and 4000),
  created_at timestamptz not null default clock_timestamp(),
  unique (source_id, idempotency_key),
  unique (id, room_id),
  foreign key (source_id, room_id) references public.eve_research_sources(id, room_id) on delete restrict,
  foreign key (review_id, room_id) references public.eve_source_reviews(id, room_id) on delete restrict,
  foreign key (material_id, room_id) references public.eve_material_assets(id, room_id) on delete restrict,
  check ((revoked_at is null and revoked_by is null and revoke_reason is null) or (revoked_at is not null and revoked_by is not null and revoke_reason is not null))
);

create table if not exists public.eve_conversations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  course_id uuid,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  status public.eve_record_status not null default 'active',
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  archived_at timestamptz,
  unique (id, room_id),
  unique (room_id, legacy_source_key),
  foreign key (course_id, room_id) references public.courses(id, room_id) on delete set null (course_id),
  foreign key (room_id, owner_id) references public.room_members(room_id, user_id) on delete cascade
);

create table if not exists public.eve_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  room_id uuid not null,
  author_id uuid references public.profiles(id) on delete set null,
  role public.eve_message_role not null,
  content text not null check (char_length(content) between 1 and 100000),
  citations jsonb not null default '[]'::jsonb check (jsonb_typeof(citations) = 'array'),
  model_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(model_metadata) = 'object'),
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_at timestamptz not null default clock_timestamp(),
  unique (conversation_id, legacy_source_key),
  foreign key (conversation_id, room_id) references public.eve_conversations(id, room_id) on delete cascade,
  check ((role = 'user' and author_id is not null) or role <> 'user')
);

create table if not exists public.eve_audit_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 160),
  entity_type text not null check (char_length(entity_type) between 2 and 120),
  entity_id text check (entity_id is null or char_length(entity_id) <= 240),
  outcome text not null check (outcome in ('success','rejected','failed','revoked','duplicate')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  legacy_source_key text check (legacy_source_key is null or char_length(legacy_source_key) <= 240),
  created_at timestamptz not null default clock_timestamp(),
  unique (room_id, legacy_source_key)
);

create table if not exists public.eve_import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique check (char_length(batch_key) between 32 and 160),
  source_fingerprint text not null check (source_fingerprint ~ '^[0-9a-f]{64}$'),
  format_version text not null check (char_length(format_version) between 1 and 40),
  status public.eve_import_status not null default 'running',
  record_count integer not null default 0 check (record_count >= 0),
  imported_count integer not null default 0 check (imported_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  started_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  error_code text check (error_code is null or char_length(error_code) <= 160),
  check (imported_count + duplicate_count + error_count <= record_count)
);

create table if not exists public.eve_import_items (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.eve_import_batches(id) on delete cascade,
  entity_kind text not null check (char_length(entity_kind) between 2 and 80),
  legacy_id text not null check (char_length(legacy_id) between 1 and 240),
  target_table text not null check (char_length(target_table) between 2 and 120),
  target_id uuid,
  outcome text not null check (outcome in ('imported','duplicate','failed')),
  error_code text check (error_code is null or char_length(error_code) <= 160),
  created_at timestamptz not null default clock_timestamp(),
  unique (batch_id, entity_kind, legacy_id)
);

create or replace function public.eve_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end; $$;

create or replace function public.eve_reject_audit_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'eve_audit_events is append-only' using errcode = '55000'; end; $$;

create or replace function public.eve_require_room_admin(p_room_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_room_admin(p_room_id);
$$;
revoke all on function public.eve_require_room_admin(uuid) from public;
grant execute on function public.eve_require_room_admin(uuid) to authenticated;

create index if not exists idx_eve_prompt_families_room on public.eve_prompt_families(room_id, updated_at desc);
create index if not exists idx_eve_prompt_versions_family on public.eve_prompt_versions(prompt_family_id, version_number desc);
create index if not exists idx_eve_material_assets_room on public.eve_material_assets(room_id, updated_at desc);
create index if not exists idx_eve_material_versions_material on public.eve_material_versions(material_id, version_number desc);
create index if not exists idx_eve_material_chunks_version on public.eve_material_chunks(version_id, chunk_index);
create index if not exists idx_eve_research_projects_room on public.eve_research_projects(room_id, updated_at desc);
create index if not exists idx_eve_research_sources_project on public.eve_research_sources(project_id, review_status, updated_at desc);
create index if not exists idx_eve_reviews_source on public.eve_source_reviews(source_id, created_at desc);
create index if not exists idx_eve_conversations_owner on public.eve_conversations(room_id, owner_id, updated_at desc);
create index if not exists idx_eve_messages_conversation on public.eve_messages(conversation_id, created_at, id);
create index if not exists idx_eve_audit_room_created on public.eve_audit_events(room_id, created_at desc);
create index if not exists idx_eve_import_items_batch on public.eve_import_items(batch_id, id);

create trigger eve_prompt_families_touch before update on public.eve_prompt_families for each row execute function public.eve_touch_updated_at();
create trigger eve_material_assets_touch before update on public.eve_material_assets for each row execute function public.eve_touch_updated_at();
create trigger eve_research_projects_touch before update on public.eve_research_projects for each row execute function public.eve_touch_updated_at();
create trigger eve_research_sources_touch before update on public.eve_research_sources for each row execute function public.eve_touch_updated_at();
create trigger eve_conversations_touch before update on public.eve_conversations for each row execute function public.eve_touch_updated_at();
create trigger eve_audit_append_only before update or delete on public.eve_audit_events for each row execute function public.eve_reject_audit_mutation();

alter table public.eve_schema_metadata enable row level security;
alter table public.eve_prompt_families enable row level security;
alter table public.eve_prompt_versions enable row level security;
alter table public.eve_material_assets enable row level security;
alter table public.eve_material_versions enable row level security;
alter table public.eve_material_chunks enable row level security;
alter table public.eve_research_projects enable row level security;
alter table public.eve_research_sources enable row level security;
alter table public.eve_source_reviews enable row level security;
alter table public.eve_source_promotions enable row level security;
alter table public.eve_conversations enable row level security;
alter table public.eve_messages enable row level security;
alter table public.eve_audit_events enable row level security;
alter table public.eve_import_batches enable row level security;
alter table public.eve_import_items enable row level security;

create policy eve_prompt_families_select_member on public.eve_prompt_families for select to authenticated using (public.is_room_member(room_id));
create policy eve_prompt_families_write_admin on public.eve_prompt_families for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_prompt_versions_select_member on public.eve_prompt_versions for select to authenticated using (public.is_room_member(room_id));
create policy eve_prompt_versions_write_admin on public.eve_prompt_versions for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_material_assets_select_member on public.eve_material_assets for select to authenticated using (public.is_room_member(room_id) and status <> 'revoked');
create policy eve_material_assets_write_admin on public.eve_material_assets for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_material_versions_select_member on public.eve_material_versions for select to authenticated using (public.is_room_member(room_id) and status <> 'revoked');
create policy eve_material_versions_write_admin on public.eve_material_versions for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_material_chunks_select_member on public.eve_material_chunks for select to authenticated using (public.is_room_member(room_id));
create policy eve_material_chunks_write_admin on public.eve_material_chunks for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_research_projects_select_member on public.eve_research_projects for select to authenticated using (public.is_room_member(room_id));
create policy eve_research_projects_write_admin on public.eve_research_projects for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_research_sources_select_member on public.eve_research_sources for select to authenticated using (public.is_room_member(room_id));
create policy eve_research_sources_write_admin on public.eve_research_sources for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id));
create policy eve_source_reviews_select_member on public.eve_source_reviews for select to authenticated using (public.is_room_member(room_id));
create policy eve_source_reviews_write_admin on public.eve_source_reviews for all to authenticated using (public.eve_require_room_admin(room_id) and reviewer_id = auth.uid()) with check (public.eve_require_room_admin(room_id) and reviewer_id = auth.uid());
create policy eve_source_promotions_select_member on public.eve_source_promotions for select to authenticated using (public.is_room_member(room_id));
create policy eve_source_promotions_write_admin on public.eve_source_promotions for all to authenticated using (public.eve_require_room_admin(room_id)) with check (public.eve_require_room_admin(room_id) and promoted_by = auth.uid());
create policy eve_conversations_select_owner on public.eve_conversations for select to authenticated using (owner_id = auth.uid() and public.is_room_member(room_id));
create policy eve_conversations_insert_owner on public.eve_conversations for insert to authenticated with check (owner_id = auth.uid() and public.is_room_member(room_id));
create policy eve_conversations_update_owner on public.eve_conversations for update to authenticated using (owner_id = auth.uid() and public.is_room_member(room_id)) with check (owner_id = auth.uid() and public.is_room_member(room_id));
create policy eve_conversations_delete_owner on public.eve_conversations for delete to authenticated using (owner_id = auth.uid() and public.is_room_member(room_id));
create policy eve_messages_select_owner on public.eve_messages for select to authenticated using (exists (select 1 from public.eve_conversations c where c.id = conversation_id and c.room_id = room_id and c.owner_id = auth.uid() and public.is_room_member(c.room_id)));
create policy eve_messages_insert_owner on public.eve_messages for insert to authenticated with check (exists (select 1 from public.eve_conversations c where c.id = conversation_id and c.room_id = room_id and c.owner_id = auth.uid() and public.is_room_member(c.room_id)) and role = 'user' and author_id = auth.uid());
create policy eve_audit_select_admin on public.eve_audit_events for select to authenticated using (public.eve_require_room_admin(room_id));

revoke all on public.eve_import_batches, public.eve_import_items from anon, authenticated;
revoke insert, update, delete on public.eve_audit_events from anon, authenticated;
grant select on public.eve_schema_metadata to authenticated;
grant select, insert, update, delete on public.eve_prompt_families, public.eve_prompt_versions, public.eve_material_assets, public.eve_material_versions, public.eve_material_chunks, public.eve_research_projects, public.eve_research_sources, public.eve_source_reviews, public.eve_source_promotions, public.eve_conversations, public.eve_messages to authenticated;
grant select on public.eve_audit_events to authenticated;
grant select, insert, update, delete on public.eve_schema_metadata, public.eve_prompt_families, public.eve_prompt_versions, public.eve_material_assets, public.eve_material_versions, public.eve_material_chunks, public.eve_research_projects, public.eve_research_sources, public.eve_source_reviews, public.eve_source_promotions, public.eve_conversations, public.eve_messages, public.eve_import_batches, public.eve_import_items to service_role;
grant select, insert on public.eve_audit_events to service_role;

insert into public.eve_schema_metadata(key, value)
values
  ('schema_version', '"1.3.0"'::jsonb),
  ('checkpoint', '"CORE-1.3"'::jsonb),
  ('migration', '"0018_eve_core_production_data"'::jsonb),
  ('sqlite_import_enabled_by_default', 'false'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

commit;

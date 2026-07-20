-- Adaptive translation foundation: private vocabulary, language preferences,
-- deterministic learning evidence and a server-only translation cache.

begin;

create table public.user_language_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  native_language text not null default 'it'
    check (char_length(native_language) between 2 and 35),
  learning_languages jsonb not null default '["en"]'::jsonb
    check (
      jsonb_typeof(learning_languages) = 'array'
      and jsonb_array_length(learning_languages) between 1 and 20
      and octet_length(learning_languages::text) <= 1024
    ),
  default_target_language text not null default 'it'
    check (char_length(default_target_language) between 2 and 35),
  show_annotations boolean not null default true,
  annotation_mode text not null default 'adaptive'
    check (annotation_mode in ('adaptive', 'always', 'click', 'hidden')),
  ai_enabled boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table public.user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_language text not null check (char_length(source_language) between 2 and 35),
  target_language text not null check (char_length(target_language) between 2 and 35),
  entry_type text not null default 'word' check (entry_type in ('word', 'phrase')),
  surface_form text not null check (char_length(surface_form) between 1 and 240),
  normalized_form text not null check (
    char_length(normalized_form) between 1 and 240
    and normalized_form = lower(btrim(normalized_form))
  ),
  lemma text check (lemma is null or char_length(lemma) <= 240),
  part_of_speech text check (part_of_speech is null or char_length(part_of_speech) <= 80),
  grammatical_features jsonb not null default '{}'::jsonb
    check (jsonb_typeof(grammatical_features) = 'object' and octet_length(grammatical_features::text) <= 8192),
  sense_key text not null default 'default' check (char_length(sense_key) between 1 and 160),
  contextual_translation text not null check (char_length(contextual_translation) between 1 and 1000),
  alternative_translations jsonb not null default '[]'::jsonb
    check (jsonb_typeof(alternative_translations) = 'array' and octet_length(alternative_translations::text) <= 8192),
  explanation text check (explanation is null or char_length(explanation) <= 4000),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  mastery_score integer not null default 5 check (mastery_score between 0 and 100),
  learning_state text not null default 'NEW'
    check (learning_state in ('NEW', 'LEARNING', 'CONSOLIDATING', 'PROBABLY_KNOWN', 'MASTERED', 'NEEDS_REVIEW')),
  stability numeric(10,3) not null default 0 check (stability >= 0),
  difficulty numeric(6,3) not null default 0 check (difficulty >= 0),
  first_seen_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  next_review_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  times_seen integer not null default 1 check (times_seen >= 0),
  times_revealed integer not null default 0 check (times_revealed >= 0),
  times_ignored integer not null default 0 check (times_ignored >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  wrong_answers integer not null default 0 check (wrong_answers >= 0),
  explicit_known_count integer not null default 0 check (explicit_known_count >= 0),
  explicit_unknown_count integer not null default 0 check (explicit_unknown_count >= 0),
  distinct_exposure_days integer not null default 1 check (distinct_exposure_days >= 0),
  distinct_contexts integer not null default 1 check (distinct_contexts >= 0),
  production_successes integer not null default 0 check (production_successes >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, user_id),
  unique (user_id, source_language, target_language, entry_type, normalized_form, sense_key)
);

create table public.vocabulary_occurrences (
  id uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null,
  user_id uuid not null,
  material_id uuid references public.materials(id) on delete set null,
  sentence text not null check (char_length(sentence) between 1 and 4000),
  paragraph_index integer not null default 0 check (paragraph_index >= 0),
  token_start integer not null check (token_start >= 0),
  token_end integer not null check (token_end > token_start),
  context_hash text not null check (char_length(context_hash) = 64),
  document_position jsonb not null default '{}'::jsonb
    check (jsonb_typeof(document_position) = 'object' and octet_length(document_position::text) <= 8192),
  seen_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  translation_revealed boolean not null default false,
  ignored boolean not null default false,
  response_time_ms integer check (response_time_ms is null or response_time_ms between 0 and 3600000),
  times_seen integer not null default 1 check (times_seen >= 1),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (vocabulary_id, user_id)
    references public.user_vocabulary(id, user_id) on delete cascade,
  unique (vocabulary_id, material_id, context_hash, paragraph_index, token_start, token_end)
);

create table public.vocabulary_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vocabulary_id uuid not null,
  review_type text not null
    check (review_type in ('recognition', 'multiple_choice', 'written_translation', 'reverse_translation', 'sentence_production')),
  prompt text not null check (char_length(prompt) between 1 and 4000),
  answer text check (answer is null or char_length(answer) <= 4000),
  expected_answer text check (expected_answer is null or char_length(expected_answer) <= 4000),
  is_correct boolean,
  self_rating integer check (self_rating is null or self_rating between 0 and 5),
  score_delta integer not null check (score_delta between -100 and 100),
  previous_mastery integer not null check (previous_mastery between 0 and 100),
  new_mastery integer not null check (new_mastery between 0 and 100),
  reviewed_at timestamptz not null default clock_timestamp(),
  next_review_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  foreign key (vocabulary_id, user_id)
    references public.user_vocabulary(id, user_id) on delete cascade
);

create table public.vocabulary_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vocabulary_id uuid not null,
  signal_type text not null check (signal_type in (
    'first_translation', 'translation_revealed', 'remembered', 'not_remembered',
    'ignored_new_day', 'sense_choice_correct', 'written_translation_correct',
    'sentence_production_correct', 'long_interval_success', 'already_known'
  )),
  source_key text check (source_key is null or char_length(source_key) <= 200),
  context_hash text check (context_hash is null or char_length(context_hash) = 64),
  score_delta integer not null check (score_delta between -100 and 100),
  previous_mastery integer not null check (previous_mastery between 0 and 100),
  new_mastery integer not null check (new_mastery between 0 and 100),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (vocabulary_id, user_id)
    references public.user_vocabulary(id, user_id) on delete cascade
);

create unique index vocabulary_learning_events_deduplicate_idx
  on public.vocabulary_learning_events(user_id, vocabulary_id, signal_type, source_key)
  where source_key is not null;

create table public.translation_cache (
  id uuid primary key default gen_random_uuid(),
  source_language text not null check (char_length(source_language) between 2 and 35),
  target_language text not null check (char_length(target_language) between 2 and 35),
  normalized_form text not null check (char_length(normalized_form) between 1 and 240),
  lemma text check (lemma is null or char_length(lemma) <= 240),
  sense_key text not null default 'default' check (char_length(sense_key) between 1 and 160),
  context_hash text not null check (char_length(context_hash) = 64),
  contextual_translation text not null check (char_length(contextual_translation) between 1 and 1000),
  alternative_translations jsonb not null default '[]'::jsonb
    check (jsonb_typeof(alternative_translations) = 'array' and octet_length(alternative_translations::text) <= 8192),
  explanation text check (explanation is null or char_length(explanation) <= 4000),
  part_of_speech text check (part_of_speech is null or char_length(part_of_speech) <= 80),
  grammatical_features jsonb not null default '{}'::jsonb
    check (jsonb_typeof(grammatical_features) = 'object' and octet_length(grammatical_features::text) <= 8192),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  provider text not null check (char_length(provider) between 1 and 80),
  model text not null check (char_length(model) between 1 and 160),
  prompt_version text not null check (char_length(prompt_version) between 1 and 80),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  unique (source_language, target_language, normalized_form, sense_key, context_hash, prompt_version)
);

create index user_vocabulary_due_idx
  on public.user_vocabulary(user_id, next_review_at)
  where is_archived = false;
create index user_vocabulary_lookup_idx
  on public.user_vocabulary(user_id, source_language, normalized_form, learning_state);
create index vocabulary_occurrences_material_idx
  on public.vocabulary_occurrences(user_id, material_id, last_seen_at desc);
create index vocabulary_reviews_due_idx
  on public.vocabulary_reviews(user_id, next_review_at desc);
create index vocabulary_learning_events_timeline_idx
  on public.vocabulary_learning_events(user_id, vocabulary_id, created_at desc);
create index translation_cache_lookup_idx
  on public.translation_cache(source_language, target_language, normalized_form, context_hash, expires_at);

create trigger user_language_preferences_set_updated_at
before update on public.user_language_preferences
for each row execute function public.set_updated_at();

create trigger user_vocabulary_set_updated_at
before update on public.user_vocabulary
for each row execute function public.set_updated_at();

alter table public.user_language_preferences enable row level security;
alter table public.user_vocabulary enable row level security;
alter table public.vocabulary_occurrences enable row level security;
alter table public.vocabulary_reviews enable row level security;
alter table public.vocabulary_learning_events enable row level security;
alter table public.translation_cache enable row level security;

create policy language_preferences_select_own
on public.user_language_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy language_preferences_insert_own
on public.user_language_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy language_preferences_update_own
on public.user_language_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy language_preferences_delete_own
on public.user_language_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

create policy user_vocabulary_select_own
on public.user_vocabulary for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_vocabulary_delete_own
on public.user_vocabulary for delete to authenticated
using ((select auth.uid()) = user_id);

create policy vocabulary_occurrences_select_own
on public.vocabulary_occurrences for select to authenticated
using ((select auth.uid()) = user_id);

create policy vocabulary_reviews_select_own
on public.vocabulary_reviews for select to authenticated
using ((select auth.uid()) = user_id);

create policy vocabulary_learning_events_select_own
on public.vocabulary_learning_events for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.user_language_preferences from public, anon, authenticated;
revoke all on public.user_vocabulary from public, anon, authenticated;
revoke all on public.vocabulary_occurrences from public, anon, authenticated;
revoke all on public.vocabulary_reviews from public, anon, authenticated;
revoke all on public.vocabulary_learning_events from public, anon, authenticated;
revoke all on public.translation_cache from public, anon, authenticated;

grant select, delete on public.user_language_preferences to authenticated;
grant insert (
  user_id, native_language, learning_languages, default_target_language,
  show_annotations, annotation_mode, ai_enabled
) on public.user_language_preferences to authenticated;
grant update (
  native_language, learning_languages, default_target_language,
  show_annotations, annotation_mode, ai_enabled
) on public.user_language_preferences to authenticated;

grant select, delete on public.user_vocabulary to authenticated;
grant select on public.vocabulary_occurrences to authenticated;
grant select on public.vocabulary_reviews to authenticated;
grant select on public.vocabulary_learning_events to authenticated;

alter table public.user_language_preferences replica identity full;
alter table public.user_vocabulary replica identity full;
alter table public.vocabulary_occurrences replica identity full;
alter table public.vocabulary_reviews replica identity full;

do $publication$
declare
  v_table text;
  v_tables text[] := array[
    'user_language_preferences',
    'user_vocabulary',
    'vocabulary_occurrences',
    'vocabulary_reviews'
  ];
begin
  if exists (
    select 1 from pg_catalog.pg_publication p
    where p.pubname = 'supabase_realtime'
  ) then
    foreach v_table in array v_tables loop
      if not exists (
        select 1
        from pg_catalog.pg_publication_tables pt
        where pt.pubname = 'supabase_realtime'
          and pt.schemaname = 'public'
          and pt.tablename = v_table
      ) then
        execute pg_catalog.format(
          'alter publication supabase_realtime add table public.%I',
          v_table
        );
      end if;
    end loop;
  end if;
end;
$publication$;

commit;

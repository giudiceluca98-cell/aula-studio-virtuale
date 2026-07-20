begin;

create table public.material_reader_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null,
  room_id uuid not null,
  paragraph_index integer not null default 0 check (paragraph_index >= 0),
  token_index integer not null default 0 check (token_index >= 0),
  scroll_ratio numeric(6,5) not null default 0 check (scroll_ratio between 0 and 1),
  document_position jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(document_position) = 'object'
      and octet_length(document_position::text) <= 8192
    ),
  last_opened_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, material_id),
  foreign key (material_id, room_id)
    references public.materials(id, room_id) on delete cascade
);

create index material_reader_progress_room_user_idx
  on public.material_reader_progress(room_id, user_id, last_opened_at desc);

create trigger material_reader_progress_set_updated_at
before update on public.material_reader_progress
for each row execute function public.set_updated_at();

alter table public.material_reader_progress enable row level security;

create policy material_reader_progress_select_own
on public.material_reader_progress for select to authenticated
using (
  (select auth.uid()) = user_id
  and public.is_room_member(room_id)
);

create policy material_reader_progress_insert_own
on public.material_reader_progress for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and public.is_room_member(room_id)
);

create policy material_reader_progress_update_own
on public.material_reader_progress for update to authenticated
using (
  (select auth.uid()) = user_id
  and public.is_room_member(room_id)
)
with check (
  (select auth.uid()) = user_id
  and public.is_room_member(room_id)
);

create policy material_reader_progress_delete_own
on public.material_reader_progress for delete to authenticated
using (
  (select auth.uid()) = user_id
  and public.is_room_member(room_id)
);

revoke all on public.material_reader_progress from public, anon, authenticated;
grant select, delete on public.material_reader_progress to authenticated;
grant insert (
  user_id, material_id, room_id, paragraph_index, token_index,
  scroll_ratio, document_position, last_opened_at
) on public.material_reader_progress to authenticated;
grant update (
  paragraph_index, token_index, scroll_ratio, document_position, last_opened_at
) on public.material_reader_progress to authenticated;

alter table public.material_reader_progress replica identity full;

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
      and pt.tablename = 'material_reader_progress'
  ) then
    alter publication supabase_realtime
      add table public.material_reader_progress;
  end if;
end;
$publication$;

commit;

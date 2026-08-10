-- Rollback distruttivo CORE-1.7. Richiede backup verificato e consenso esplicito.
begin;

do $$ begin
  if coalesce(current_setting('app.eve_allow_destructive_rollback', true), 'false') <> 'true' then
    raise exception 'Impostare app.eve_allow_destructive_rollback=true soltanto dopo backup verificato';
  end if;
end $$;

-- L'ordine e intenzionale: il trigger feedback dipende da eve_touch_updated_at(),
-- che appartiene a CORE-1.3 e viene rimosso soltanto dal rollback 0018.
drop table if exists public.eve_response_feedback;
drop table if exists public.eve_mvp_runs;
drop index if exists public.eve_messages_id_conversation_room_unique;
drop type if exists public.eve_feedback_rating;
drop type if exists public.eve_mvp_run_status;

insert into public.eve_schema_metadata(key, value)
values
  ('schema_version', '"1.4.0"'::jsonb),
  ('checkpoint', '"CORE-1.4"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

delete from public.eve_schema_metadata
where key in ('mvp_gate_enabled_by_default','mvp_memory_writes','mvp_actions_executed');

commit;

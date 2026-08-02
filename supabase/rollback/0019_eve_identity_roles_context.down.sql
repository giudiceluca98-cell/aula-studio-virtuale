-- Rollback distruttivo CORE-1.4. Richiede backup verificato e consenso esplicito.
begin;
do $$ begin
  if coalesce(current_setting('app.eve_allow_destructive_rollback', true), 'false') <> 'true' then
    raise exception 'Impostare app.eve_allow_destructive_rollback=true soltanto dopo backup verificato';
  end if;
end $$;

drop table if exists public.eve_context_audit_events;
drop table if exists public.eve_room_roles;
drop type if exists public.eve_context_outcome;
drop type if exists public.eve_context_scope;
drop type if exists public.eve_learning_role;

insert into public.eve_schema_metadata(key, value)
values
  ('schema_version', '"1.3.0"'::jsonb),
  ('checkpoint', '"CORE-1.3"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

delete from public.eve_schema_metadata
where key in ('context_builder_enabled_by_default','context_persists_selected_text');
commit;

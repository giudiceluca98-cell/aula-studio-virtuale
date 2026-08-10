-- Rollback protetto CORE-2.0. Deve essere eseguito solo dopo backup verificato.
do $$
begin
  if current_setting('app.eve_allow_destructive_rollback', true) is distinct from 'true' then
    raise exception 'Rollback CORE-2.0 bloccato: impostare app.eve_allow_destructive_rollback=true dopo il backup';
  end if;
end $$;

begin;

drop table if exists public.eve_grounded_chat_turns;
drop type if exists public.eve_chat_depth;
drop type if exists public.eve_grounded_chat_status;

delete from public.eve_schema_metadata
where key in (
  'grounded_chat_enabled_by_default',
  'grounded_chat_private_only',
  'grounded_chat_memory_writes',
  'grounded_chat_actions_executed'
);

insert into public.eve_schema_metadata(key, value)
values
  ('schema_version', '"1.7.0"'::jsonb),
  ('checkpoint', '"CORE-1.7"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = clock_timestamp();

commit;

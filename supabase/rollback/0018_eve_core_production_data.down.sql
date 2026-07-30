-- Rollback distruttivo CORE-1.3. Eseguire soltanto dopo backup verificato.
-- Prima dell'esecuzione: SET app.eve_allow_destructive_rollback = 'true';

do $$ begin
  if coalesce(current_setting('app.eve_allow_destructive_rollback', true), 'false') <> 'true' then
    raise exception 'Rollback bloccato: impostare app.eve_allow_destructive_rollback=true dopo backup verificato';
  end if;
end $$;

begin;
drop table if exists public.eve_import_items cascade;
drop table if exists public.eve_import_batches cascade;
drop table if exists public.eve_audit_events cascade;
drop table if exists public.eve_messages cascade;
drop table if exists public.eve_conversations cascade;
drop table if exists public.eve_source_promotions cascade;
drop table if exists public.eve_source_reviews cascade;
drop table if exists public.eve_research_sources cascade;
drop table if exists public.eve_research_projects cascade;
drop table if exists public.eve_material_chunks cascade;
drop table if exists public.eve_material_versions cascade;
drop table if exists public.eve_material_assets cascade;
drop table if exists public.eve_prompt_versions cascade;
drop table if exists public.eve_prompt_families cascade;
drop table if exists public.eve_schema_metadata cascade;
drop function if exists public.eve_require_room_admin(uuid);
drop function if exists public.eve_reject_audit_mutation();
drop function if exists public.eve_touch_updated_at();
drop type if exists public.eve_import_status;
drop type if exists public.eve_message_role;
drop type if exists public.eve_review_status;
drop type if exists public.eve_prompt_status;
drop type if exists public.eve_record_status;
commit;

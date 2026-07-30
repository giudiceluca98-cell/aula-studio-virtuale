\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'owner@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'admin@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'member@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'outsider@example.test');

insert into public.profiles (id, display_name)
values
  ('10000000-0000-0000-0000-000000000001', 'Owner'),
  ('10000000-0000-0000-0000-000000000002', 'Admin'),
  ('10000000-0000-0000-0000-000000000003', 'Member'),
  ('10000000-0000-0000-0000-000000000004', 'Outsider');

insert into public.study_rooms (id, name, invite_code, created_by)
values
  ('20000000-0000-0000-0000-000000000001', 'Room A', 'CORE13A1', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Room B', 'CORE13B1', '10000000-0000-0000-0000-000000000004');

insert into public.room_members (room_id, user_id, role)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'admin'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'member'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'owner');

insert into public.eve_prompt_families
  (id, room_id, prompt_key, title, created_by)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'core-1.3-room-a', 'Room A prompt', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'core-1.3-room-b', 'Room B prompt', '10000000-0000-0000-0000-000000000004');

set local role authenticated;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
do $$
begin
  if (select count(*) from public.eve_prompt_families) <> 1 then
    raise exception 'Il membro deve vedere soltanto la propria stanza';
  end if;
  begin
    insert into public.eve_prompt_families (room_id, prompt_key, title, created_by)
    values ('20000000-0000-0000-0000-000000000001', 'member-write', 'Denied', '10000000-0000-0000-0000-000000000003');
    raise exception 'La scrittura del membro doveva essere negata';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
insert into public.eve_prompt_families (room_id, prompt_key, title, created_by)
values ('20000000-0000-0000-0000-000000000001', 'admin-write', 'Allowed', '10000000-0000-0000-0000-000000000002');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
do $$
begin
  if (select count(*) from public.eve_prompt_families where room_id = '20000000-0000-0000-0000-000000000001') <> 0 then
    raise exception 'Isolamento cross-room non rispettato';
  end if;
end $$;

reset role;
set local role service_role;
insert into public.eve_import_batches
  (batch_key, source_fingerprint, format_version, record_count)
values
  (repeat('a', 32), repeat('b', 64), '1.0', 0);
reset role;

insert into public.eve_audit_events
  (id, room_id, actor_id, event_type, entity_type, outcome)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'core_test', 'prompt', 'success');

do $$
begin
  begin
    update public.eve_audit_events
    set outcome = 'failed'
    where id = '40000000-0000-0000-0000-000000000001';
    raise exception 'Audit append-only non rispettato';
  exception when sqlstate '55000' then null;
  end;
end $$;

rollback;

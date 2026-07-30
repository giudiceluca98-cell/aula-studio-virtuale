\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email)
values
  ('f1000000-0000-0000-0000-000000000001', 'owner-core13@example.test'),
  ('f1000000-0000-0000-0000-000000000002', 'admin-core13@example.test'),
  ('f1000000-0000-0000-0000-000000000003', 'member-core13@example.test'),
  ('f1000000-0000-0000-0000-000000000004', 'outsider-core13@example.test');

insert into public.profiles (id, display_name)
values
  ('f1000000-0000-0000-0000-000000000001', 'Owner CORE 1.3'),
  ('f1000000-0000-0000-0000-000000000002', 'Admin CORE 1.3'),
  ('f1000000-0000-0000-0000-000000000003', 'Member CORE 1.3'),
  ('f1000000-0000-0000-0000-000000000004', 'Outsider CORE 1.3');

insert into public.study_rooms (id, name, invite_code, created_by)
values
  ('f2000000-0000-0000-0000-000000000001', 'Room A CORE 1.3', 'CORE13A1', 'f1000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002', 'Room B CORE 1.3', 'CORE13B1', 'f1000000-0000-0000-0000-000000000004');

insert into public.room_members (room_id, user_id, role)
values
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'owner'),
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'admin'),
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000003', 'member'),
  ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000004', 'owner');

insert into public.eve_prompt_families
  (id, room_id, prompt_key, title, created_by)
values
  ('f3000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'core-1.3-room-a', 'Room A prompt', 'f1000000-0000-0000-0000-000000000001'),
  ('f3000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'core-1.3-room-b', 'Room B prompt', 'f1000000-0000-0000-0000-000000000004');

set local role authenticated;

select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
do $$
begin
  if (select count(*) from public.eve_prompt_families) <> 1 then
    raise exception 'Il membro deve vedere soltanto la propria stanza';
  end if;
  begin
    insert into public.eve_prompt_families (room_id, prompt_key, title, created_by)
    values ('f2000000-0000-0000-0000-000000000001', 'member-write', 'Denied', 'f1000000-0000-0000-0000-000000000003');
    raise exception 'La scrittura del membro doveva essere negata';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
insert into public.eve_prompt_families (room_id, prompt_key, title, created_by)
values ('f2000000-0000-0000-0000-000000000001', 'admin-write', 'Allowed', 'f1000000-0000-0000-0000-000000000002');

select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000004', true);
do $$
begin
  if (select count(*) from public.eve_prompt_families where room_id = 'f2000000-0000-0000-0000-000000000001') <> 0 then
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
  ('f4000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001',
   'f1000000-0000-0000-0000-000000000001', 'core_test', 'prompt', 'success');

do $$
begin
  begin
    update public.eve_audit_events
    set outcome = 'failed'
    where id = 'f4000000-0000-0000-0000-000000000001';
    raise exception 'Audit append-only non rispettato';
  exception when sqlstate '55000' then null;
  end;
end $$;

rollback;

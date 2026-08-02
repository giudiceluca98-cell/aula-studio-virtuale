\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email)
values
  ('f5000000-0000-0000-0000-000000000001', 'owner-core14@example.test'),
  ('f5000000-0000-0000-0000-000000000002', 'admin-core14@example.test'),
  ('f5000000-0000-0000-0000-000000000003', 'member-core14@example.test'),
  ('f5000000-0000-0000-0000-000000000004', 'outsider-core14@example.test');

insert into public.study_rooms (id, name, invite_code, created_by)
values
  ('f6000000-0000-0000-0000-000000000001', 'Room A CORE 1.4', 'CORE14A1', 'f5000000-0000-0000-0000-000000000001'),
  ('f6000000-0000-0000-0000-000000000002', 'Room B CORE 1.4', 'CORE14B1', 'f5000000-0000-0000-0000-000000000004');

insert into public.room_members (room_id, user_id, role)
values
  ('f6000000-0000-0000-0000-000000000001', 'f5000000-0000-0000-0000-000000000002', 'admin'),
  ('f6000000-0000-0000-0000-000000000001', 'f5000000-0000-0000-0000-000000000003', 'member');

set local role authenticated;

select set_config('request.jwt.claim.sub', 'f5000000-0000-0000-0000-000000000002', true);
insert into public.eve_room_roles (room_id, user_id, role, granted_by, reason)
values (
  'f6000000-0000-0000-0000-000000000001',
  'f5000000-0000-0000-0000-000000000003',
  'teacher',
  'f5000000-0000-0000-0000-000000000002',
  'Ruolo didattico concesso dal test CORE-1.4'
);

select set_config('request.jwt.claim.sub', 'f5000000-0000-0000-0000-000000000003', true);
do $$
begin
  if (select count(*) from public.eve_room_roles) <> 1 then
    raise exception 'Il membro deve vedere soltanto i propri ruoli';
  end if;
  begin
    insert into public.eve_room_roles (room_id, user_id, role, granted_by, reason)
    values (
      'f6000000-0000-0000-0000-000000000001',
      'f5000000-0000-0000-0000-000000000003',
      'author',
      'f5000000-0000-0000-0000-000000000003',
      'Tentativo non autorizzato dal membro'
    );
    raise exception 'La concessione del ruolo da parte del membro doveva fallire';
  exception when insufficient_privilege then null;
  end;
end $$;

insert into public.eve_context_audit_events (
  id, room_id, user_id, scope, context_digest, selected_text_sha256,
  selected_chars, authorized_material_count, resource_ids, roles, outcome
) values (
  'f7000000-0000-0000-0000-000000000001',
  'f6000000-0000-0000-0000-000000000001',
  'f5000000-0000-0000-0000-000000000003',
  'private', repeat('a', 64), repeat('b', 64), 18, 1,
  '{"material":"verified"}'::jsonb,
  array['teacher']::public.eve_learning_role[], 'success'
);

do $$
begin
  begin
    insert into public.eve_context_audit_events (
      room_id, user_id, scope, context_digest, outcome
    ) values (
      'f6000000-0000-0000-0000-000000000002',
      'f5000000-0000-0000-0000-000000000003',
      'private', repeat('c', 64), 'success'
    );
    raise exception 'La scrittura cross-room doveva fallire';
  exception when foreign_key_violation or insufficient_privilege then null;
  end;

  begin
    update public.eve_context_audit_events
    set outcome = 'failed'
    where id = 'f7000000-0000-0000-0000-000000000001';
    raise exception 'L’audit append-only non deve essere aggiornabile';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', 'f5000000-0000-0000-0000-000000000004', true);
do $$
begin
  if (select count(*) from public.eve_room_roles where room_id = 'f6000000-0000-0000-0000-000000000001') <> 0 then
    raise exception 'Isolamento cross-room dei ruoli non rispettato';
  end if;
  if (select count(*) from public.eve_context_audit_events where room_id = 'f6000000-0000-0000-0000-000000000001') <> 0 then
    raise exception 'Isolamento cross-room dell’audit non rispettato';
  end if;
end $$;

reset role;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'eve_context_audit_events'
      and column_name = 'selected_text'
  ) then
    raise exception 'Il testo selezionato non deve essere persistito';
  end if;
end $$;

rollback;

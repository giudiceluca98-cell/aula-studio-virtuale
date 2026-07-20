-- Local/demo seed for Aula Studio Virtuale.
-- Demo password for both users: StudioDemo123!
-- Never run this file against a production project.

begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'tatiana@example.test',
    extensions.crypt('StudioDemo123!', extensions.gen_salt('bf')),
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Tatiana"}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'studio@example.test',
    extensions.crypt('StudioDemo123!', extensions.gen_salt('bf')),
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Compagno di studio"}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  )
on conflict (id) do update
set encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = excluded.updated_at;

-- Current Supabase Auth uses one email identity per password user. Keeping this
-- in the seed makes the accounts usable through signInWithPassword locally.
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'tatiana@example.test',
    '{"sub":"10000000-0000-0000-0000-000000000001","email":"tatiana@example.test","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'studio@example.test',
    '{"sub":"10000000-0000-0000-0000-000000000002","email":"studio@example.test","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp()
  )
on conflict (provider_id, provider) do update
set identity_data = excluded.identity_data,
    updated_at = excluded.updated_at;

insert into public.profiles (id, display_name)
values
  ('10000000-0000-0000-0000-000000000001', 'Tatiana'),
  ('10000000-0000-0000-0000-000000000002', 'Compagno di studio')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.study_rooms (id, name, invite_code, created_by)
values (
  '20000000-0000-0000-0000-000000000001',
  'Aula Python',
  'STUDY-DEMO-2026',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set name = excluded.name;

insert into public.room_members (room_id, user_id, role, left_at)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'member',
  null
)
on conflict (room_id, user_id) do update
set role = excluded.role, left_at = null;

insert into public.presence (
  room_id,
  user_id,
  status,
  current_activity,
  device_label,
  last_seen_at,
  last_activity_at,
  disconnected_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'offline',
    null,
    'Computer',
    clock_timestamp() - interval '15 minutes',
    clock_timestamp() - interval '15 minutes',
    clock_timestamp() - interval '15 minutes'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'offline',
    null,
    'Computer',
    clock_timestamp() - interval '20 minutes',
    clock_timestamp() - interval '20 minutes',
    clock_timestamp() - interval '20 minutes'
  )
on conflict (room_id, user_id) do update
set status = excluded.status,
    current_activity = excluded.current_activity,
    device_label = excluded.device_label,
    last_seen_at = excluded.last_seen_at,
    last_activity_at = excluded.last_activity_at,
    disconnected_at = excluded.disconnected_at;

insert into public.courses (id, room_id, title, description, created_by)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Python for Everybody',
  'Corso demo condiviso per verificare progressi, materiali e checklist.',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update
set title = excluded.title, description = excluded.description;

insert into public.materials (
  id,
  room_id,
  course_id,
  type,
  title,
  description,
  url,
  current_chapter,
  current_lesson,
  created_by
)
values (
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'link',
  'Sito del corso',
  'Risorsa esterna da aprire in una nuova scheda.',
  'https://www.py4e.com/',
  '1',
  'Why Program?',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    url = excluded.url,
    current_chapter = excluded.current_chapter,
    current_lesson = excluded.current_lesson;

insert into public.progress_entries (
  id,
  room_id,
  user_id,
  course_id,
  chapter,
  lesson,
  progress_percentage,
  exercises_completed,
  score,
  study_minutes,
  notes,
  next_goal
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '1',
    'Why Program?',
    20,
    3,
    8.5,
    45,
    'Ripassare variabili e input.',
    'Completare gli esercizi del capitolo 2'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '1',
    'Variables, Expressions, and Statements',
    28,
    4,
    9,
    55,
    'Buona comprensione degli operatori.',
    'Provare il primo esercizio guidato'
  )
on conflict (room_id, user_id, course_id) do update
set chapter = excluded.chapter,
    lesson = excluded.lesson,
    progress_percentage = excluded.progress_percentage,
    exercises_completed = excluded.exercises_completed,
    score = excluded.score,
    study_minutes = excluded.study_minutes,
    notes = excluded.notes,
    next_goal = excluded.next_goal;

insert into public.tasks (
  id,
  room_id,
  created_by,
  assigned_to,
  assignment_mode,
  title,
  completed,
  completed_by,
  completed_at,
  priority,
  due_at
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    null,
    'everyone',
    'Confrontare gli appunti del capitolo 1',
    false,
    null,
    null,
    'medium',
    clock_timestamp() + interval '3 days'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'single',
    'Completare il quiz introduttivo',
    true,
    '10000000-0000-0000-0000-000000000002',
    clock_timestamp() - interval '1 hour',
    'high',
    clock_timestamp() + interval '1 day'
  )
on conflict (id) do update
set title = excluded.title,
    assigned_to = excluded.assigned_to,
    assignment_mode = excluded.assignment_mode,
    completed = excluded.completed,
    completed_by = excluded.completed_by,
    completed_at = excluded.completed_at,
    priority = excluded.priority,
    due_at = excluded.due_at;

insert into public.messages (id, room_id, sender_id, content, client_id, created_at)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Iniziamo con 25 minuti di concentrazione?',
    '71000000-0000-0000-0000-000000000001',
    clock_timestamp() - interval '12 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Sì, poi confrontiamo gli esercizi.',
    '71000000-0000-0000-0000-000000000002',
    clock_timestamp() - interval '11 minutes'
  )
on conflict (id) do update set content = excluded.content;

insert into public.message_reads (message_id, room_id, user_id, read_at)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    clock_timestamp() - interval '11 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    clock_timestamp() - interval '10 minutes'
  )
on conflict (message_id, user_id) do update set read_at = excluded.read_at;

insert into public.shared_notes (
  id,
  room_id,
  author_id,
  course_id,
  material_id,
  title,
  content,
  visibility
)
values
  (
    '80000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Concetti chiave',
    'Un programma è una sequenza di istruzioni: input, elaborazione e output.',
    'shared'
  ),
  (
    '80000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    null,
    'Promemoria personale',
    'Chiedere chiarimenti sulla conversione dei tipi.',
    'private'
  )
on conflict (id) do update
set title = excluded.title,
    content = excluded.content,
    visibility = excluded.visibility;

insert into public.activity_events (
  id,
  room_id,
  actor_id,
  event_type,
  entity_type,
  entity_id,
  summary,
  client_event_id,
  created_at
)
values
  (
    '90000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'progress_updated',
    'course',
    '30000000-0000-0000-0000-000000000001',
    'Tatiana ha aggiornato i suoi progressi',
    '91000000-0000-0000-0000-000000000001',
    clock_timestamp() - interval '30 minutes'
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'task_completed',
    'task',
    '60000000-0000-0000-0000-000000000002',
    'Quiz introduttivo completato',
    '91000000-0000-0000-0000-000000000002',
    clock_timestamp() - interval '1 hour'
  )
on conflict (id) do update set summary = excluded.summary;

commit;

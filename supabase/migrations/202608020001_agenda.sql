begin;

create extension if not exists pgcrypto;

create type public.calendar_event_status as enum ('confirmed','tentative','completed','cancelled');
create type public.reminder_status as enum ('pending','processing','sent','failed','cancelled');
create type public.quiet_hours_behavior as enum ('skip','delay');

create table public.calendar_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text check (icon is null or char_length(icon) <= 32),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 10000),
  category_id uuid references public.calendar_categories(id) on delete set null,
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  location text not null default '' check (char_length(location) <= 300),
  url text check (url is null or char_length(url) <= 2048),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 80),
  status public.calendar_event_status not null default 'confirmed',
  recurrence_rule text check (recurrence_rule is null or char_length(recurrence_rule) <= 1000),
  recurrence_parent_id uuid references public.calendar_events(id) on delete cascade,
  recurrence_exception_date date,
  series_split_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  offset_minutes integer not null check (offset_minutes between -525600 and 525600),
  scheduled_at timestamptz not null,
  occurrence_at timestamptz not null,
  status public.reminder_status not null default 'pending',
  sent_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  subscription_id uuid,
  processing_token uuid,
  processing_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, occurrence_at, offset_minutes)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) <= 4096),
  p256dh text not null check (char_length(p256dh) <= 512),
  auth text not null check (char_length(auth) <= 512),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  device_name text not null default 'Dispositivo' check (char_length(device_name) between 1 and 80),
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.event_reminders add constraint event_reminders_subscription_id_fkey
  foreign key (subscription_id) references public.push_subscriptions(id) on delete set null;

create table public.user_calendar_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 80),
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  default_view text not null default 'week' check (default_view in ('day','week','month','upcoming')),
  default_reminder_minutes integer check (default_reminder_minutes is null or default_reminder_minutes between 0 and 525600),
  hour_format smallint not null default 24 check (hour_format in (12,24)),
  notifications_enabled boolean not null default false,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '07:00',
  quiet_hours_behavior public.quiet_hours_behavior not null default 'delay',
  hide_notification_details boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_test_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index notification_test_attempts_rate_idx on public.notification_test_attempts(user_id, attempted_at desc);
alter table public.notification_test_attempts enable row level security;

create index calendar_events_user_range_idx on public.calendar_events(user_id, starts_at, ends_at);
create unique index calendar_categories_one_default_idx on public.calendar_categories(user_id) where is_default;
create index calendar_events_parent_idx on public.calendar_events(recurrence_parent_id) where recurrence_parent_id is not null;
create unique index calendar_events_exception_unique_idx on public.calendar_events(recurrence_parent_id, recurrence_exception_date) where recurrence_parent_id is not null and recurrence_exception_date is not null;
create index event_reminders_due_idx on public.event_reminders(status, scheduled_at) where status in ('pending','failed');
create index event_reminders_user_idx on public.event_reminders(user_id, scheduled_at);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id) where enabled;

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker as $$
begin new.updated_at = now(); return new; end $$;

create function public.validate_calendar_event_ownership() returns trigger language plpgsql security invoker as $$
begin
  if new.category_id is not null and not exists(select 1 from public.calendar_categories c where c.id=new.category_id and c.user_id=new.user_id) then raise exception 'category owner mismatch'; end if;
  if new.recurrence_parent_id is not null and not exists(select 1 from public.calendar_events e where e.id=new.recurrence_parent_id and e.user_id=new.user_id) then raise exception 'recurrence owner mismatch'; end if;
  return new;
end $$;

create function public.validate_event_reminder_ownership() returns trigger language plpgsql security invoker as $$
begin
  if not exists(select 1 from public.calendar_events e where e.id=new.event_id and e.user_id=new.user_id) then raise exception 'event owner mismatch'; end if;
  if new.subscription_id is not null and not exists(select 1 from public.push_subscriptions s where s.id=new.subscription_id and s.user_id=new.user_id) then raise exception 'subscription owner mismatch'; end if;
  return new;
end $$;

create trigger calendar_categories_updated before update on public.calendar_categories
for each row execute function public.set_updated_at();
create trigger calendar_events_updated before update on public.calendar_events
for each row execute function public.set_updated_at();
create trigger calendar_events_validate_owner before insert or update on public.calendar_events
for each row execute function public.validate_calendar_event_ownership();
create trigger event_reminders_updated before update on public.event_reminders
for each row execute function public.set_updated_at();
create trigger event_reminders_validate_owner before insert or update on public.event_reminders
for each row execute function public.validate_event_reminder_ownership();
create trigger push_subscriptions_updated before update on public.push_subscriptions
for each row execute function public.set_updated_at();
create trigger user_calendar_preferences_updated before update on public.user_calendar_preferences
for each row execute function public.set_updated_at();

create function public.ensure_calendar_defaults(p_timezone text default 'UTC') returns void
language plpgsql security definer set search_path = public as $$
declare names text[] := array['Studio','Lavoro','Esame','Lezione','Progetto','Appuntamento','Personale','Salute','Sport','Famiglia','Tempo libero','Altro'];
declare colors text[] := array['#22D3EE','#A78BFA','#F43F5E','#38BDF8','#818CF8','#F59E0B','#EC4899','#10B981','#84CC16','#FB7185','#FBBF24','#94A3B8'];
declare i integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.user_calendar_preferences(user_id, timezone)
  values (auth.uid(), coalesce(nullif(p_timezone,''),'UTC')) on conflict (user_id) do nothing;
  for i in 1..array_length(names,1) loop
    insert into public.calendar_categories(user_id,name,color,is_default)
    values(auth.uid(),names[i],colors[i],i=1) on conflict(user_id,name) do nothing;
  end loop;
end $$;

create function public.reassign_and_delete_category(p_category uuid, p_replacement uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_replacement uuid := p_replacement;
  v_was_default boolean;
begin
  if not exists(select 1 from calendar_categories where id=p_category and user_id=auth.uid()) then raise exception 'not found'; end if;
  if v_replacement=p_category then raise exception 'replacement must differ from category'; end if;
  if v_replacement is not null and not exists(select 1 from calendar_categories where id=v_replacement and user_id=auth.uid()) then raise exception 'invalid replacement'; end if;
  select is_default into v_was_default from calendar_categories where id=p_category and user_id=auth.uid();
  if v_was_default and v_replacement is null then
    select id into v_replacement from calendar_categories where user_id=auth.uid() and id<>p_category order by created_at,id limit 1;
  end if;
  update calendar_events set category_id=v_replacement where category_id=p_category and user_id=auth.uid();
  if v_was_default and v_replacement is not null then
    update calendar_categories set is_default=false where id=p_category and user_id=auth.uid();
    update calendar_categories set is_default=true where id=v_replacement and user_id=auth.uid();
  end if;
  delete from calendar_categories where id=p_category and user_id=auth.uid();
end $$;

create function public.delete_my_calendar_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from calendar_events where user_id=auth.uid();
  delete from calendar_categories where user_id=auth.uid();
  delete from push_subscriptions where user_id=auth.uid();
  delete from user_calendar_preferences where user_id=auth.uid();
  delete from notification_test_attempts where user_id=auth.uid();
end $$;

create function public.claim_due_reminders(p_limit integer default 100) returns setof public.event_reminders
language plpgsql security definer set search_path=public as $$
begin
  return query
  with due as (
    select id from event_reminders
    where (status='pending' or (status='failed' and attempts<5))
      and scheduled_at <= now()
      and scheduled_at > now() - interval '24 hours'
      and (processing_started_at is null or processing_started_at < now()-interval '10 minutes')
    order by scheduled_at for update skip locked limit least(greatest(p_limit,1),500)
  )
  update event_reminders r set status='processing', processing_token=gen_random_uuid(),
    processing_started_at=now(), attempts=r.attempts+1
  from due where r.id=due.id returning r.*;
end $$;
revoke all on function public.claim_due_reminders(integer) from public, anon, authenticated;
revoke all on function public.ensure_calendar_defaults(text), public.reassign_and_delete_category(uuid,uuid), public.delete_my_calendar_data() from public, anon;
revoke all on public.notification_test_attempts from public, anon, authenticated;

alter table public.calendar_categories enable row level security;
alter table public.calendar_events enable row level security;
alter table public.event_reminders enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.user_calendar_preferences enable row level security;

create policy categories_owner_all on public.calendar_categories for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy events_owner_all on public.calendar_events for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reminders_owner_select on public.event_reminders for select using(user_id=auth.uid());
create policy reminders_owner_insert on public.event_reminders for insert with check(user_id=auth.uid() and exists(select 1 from calendar_events e where e.id=event_id and e.user_id=auth.uid()));
create policy reminders_owner_update on public.event_reminders for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reminders_owner_delete on public.event_reminders for delete using(user_id=auth.uid());
create policy subscriptions_owner_all on public.push_subscriptions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy preferences_owner_all on public.user_calendar_preferences for all using(user_id=auth.uid()) with check(user_id=auth.uid());

grant select,insert,update,delete on public.calendar_categories,public.calendar_events,public.event_reminders,public.push_subscriptions,public.user_calendar_preferences to authenticated;
grant execute on function public.ensure_calendar_defaults(text), public.reassign_and_delete_category(uuid,uuid), public.delete_my_calendar_data() to authenticated;

commit;

-- Il segreto deve coincidere con AGENDA_CRON_SECRET su Vercel.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $agenda_cron$
declare existing_job bigint;
begin
  for existing_job in
    select jobid from cron.job where jobname='aula-agenda-reminders-every-minute'
  loop
    perform cron.unschedule(existing_job);
  end loop;
end
$agenda_cron$;

select cron.schedule(
  'aula-agenda-reminders-every-minute',
  '* * * * *',
  $$select net.http_post(
    url := 'https://aula-studio-virtuale.vercel.app/api/agenda/process-reminders',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer SEGRETO'),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );$$
);

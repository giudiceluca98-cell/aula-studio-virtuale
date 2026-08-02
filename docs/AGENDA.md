# Agenda di Aula Studio

## Architettura

`/agenda` è una rotta autonoma costruita come moduli browser separati e non aumenta il JavaScript delle altre pagine. Supabase Auth identifica l’utente; PostgreSQL è la fonte autorevole e applica RLS a ogni tabella. Il client interroga solo l’intervallo visibile, espande le RRULE e conserva in IndexedDB cache e coda temporanea offline.

Le subscription Web Push sono registrate da `/api/agenda/subscriptions`. Un cron Supabase invoca ogni minuto `/api/agenda/process-reminders`: la funzione acquisisce le righe con `FOR UPDATE SKIP LOCKED`, materializza le occorrenze ricorrenti, invia via VAPID e completa la riga usando il token di lavorazione. La chiave univoca `(event_id, occurrence_at, offset_minutes)` evita duplicati.

## Configurazione

1. Copiare `.env.example` nelle variabili locali e in Vercel. Se il progetto usa già `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`, il server li riconosce senza duplicarli. `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY` e `AGENDA_CRON_SECRET` sono esclusivamente server-side.
2. Applicare `supabase/migrations/202608020001_agenda.sql` dal SQL Editor Supabase o tramite Supabase CLI.
3. Generare le chiavi con `npx web-push generate-vapid-keys`; salvare la chiave pubblica e privata nelle rispettive variabili e impostare `VAPID_SUBJECT` a un indirizzo `mailto:` controllato.
4. Abilitare le estensioni Supabase `pg_cron` e `pg_net`, copiare `supabase/agenda_cron.sql`, sostituire `SEGRETO`, quindi eseguirlo. Conservare lo stesso valore in `AGENDA_CRON_SECRET` su Vercel.
5. Eseguire `pnpm build:web`, pubblicare su Vercel e controllare `/api/agenda/config`.

## Prova locale e produzione

Le API richiedono il runtime Vercel: usare `vercel dev` con le variabili locali. Aprire `/agenda`, creare o accedere a un account, attivare le notifiche con il pulsante esplicito e usare “Invia notifica di prova”. Web Push richiede HTTPS; localhost è considerato un contesto sicuro.

Per la prova reale creare un evento 10–15 minuti nel futuro, aggiungere un reminder, chiudere la pagina e verificare che il cron segni la riga `sent`. Ripetere spostando ed eliminando l’evento: i reminder precedenti devono essere rimossi per cascata o rigenerati.

## iPhone e iPad

Web Push è disponibile da iOS/iPadOS 16.4 per le web app aggiunte alla schermata Home. L’utente deve aprire la web app installata e premere personalmente “Attiva notifiche”. Le azioni rapide dipendono dal dispositivo e degradano all’apertura dell’evento.

## Checklist deploy

- [ ] migrazione applicata senza errori;
- [ ] URL, anon key, service role e VAPID configurati in Vercel;
- [ ] `AGENDA_CRON_SECRET` lungo e uguale in Supabase Cron e Vercel;
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build:web` superati;
- [ ] accesso con due account e verifica RLS;
- [ ] notifica di prova su desktop, Android e iOS Home Screen;
- [ ] evento modificato/eliminato non produce una vecchia notifica;
- [ ] `/agenda` consultabile offline dopo almeno un caricamento online;
- [ ] chiavi private assenti da bundle e repository.

## Limiti dichiarati

Il drag/resize non è abilitato: su touch ridurrebbe affidabilità e accessibilità; ogni operazione è disponibile dal modulo. La coda offline gestisce creazione e modifica basilare e segnala la sincronizzazione sospesa; conflitti concorrenti vengono rifiutati tramite `updated_at`. Le notifiche native della build Tauri richiederebbero un plugin desktop dedicato: l’Agenda usa Web Push nella versione web/PWA, mentre nell’app desktop i dati restano sincronizzati via Supabase.

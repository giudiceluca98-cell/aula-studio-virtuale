# Passaggio completo per un'altra IA — Aula Studio Virtuale

Aggiornato al 20 luglio 2026. Questo documento descrive lo stato reale del
progetto, comprese le funzioni operative, i limiti e le decisioni che non devono
essere annullate accidentalmente.

## 1. Identità e obiettivo del prodotto

**Aula Studio Virtuale** è una web app privata e responsive per studiare insieme
in tempo reale. È ottimizzata per due persone, ma database e interfaccia possono
gestire più partecipanti.

URL di produzione:

```text
https://aula-studio-virtuale.vercel.app
```

Obiettivi principali:

- condividere presenza, stato e attività di studio;
- lavorare sugli stessi corsi, materiali, checklist e appunti;
- vedere aggiornamenti, progressi e timer senza ricaricare la pagina;
- comunicare tramite chat e chiamata vocale;
- conservare automaticamente una cronologia didattica sintetica;
- creare un riepilogo automatico e copiabile per l'altro partecipante;
- cercare e organizzare percorsi tramite il Catalogo e l'assistente Eve;
- mantenere i dati privati e separati per stanza e utente.

## 2. Stack e architettura

- **Frontend e server:** Next.js App Router, TypeScript e React.
- **Stile:** Tailwind CSS.
- **Backend:** route server Next.js e funzioni RPC PostgreSQL.
- **Database/Auth/Realtime/Storage:** Supabase.
- **Validazione:** Zod.
- **Test:** Vitest.
- **Hosting:** Vercel.
- **Chiamate:** WebRTC audio P2P con signaling Supabase.

Flusso principale:

```text
Browser autenticato
  -> Next.js / Supabase client
  -> JWT Supabase
  -> PostgreSQL + RLS
  -> Realtime Postgres Changes / Presence
  -> aggiornamento degli altri partecipanti
```

Il client non è considerato attendibile. L'identità reale deriva sempre dalla
sessione Supabase e da `auth.uid()`. Le chiavi amministrative e i secret restano
esclusivamente sul server.

## 3. Pagine

| Percorso | Funzione |
| --- | --- |
| `/` | Ingresso e reindirizzamento iniziale. |
| `/register` | Registrazione email/password e feedback sulla conferma email. |
| `/login` | Accesso. |
| `/auth/confirm` | Conferma dell'indirizzo email. |
| `/dashboard` | Scrivania: elenco stanze, creazione e ingresso con codice. |
| `/room/[roomId]` | Aula completa in tempo reale. |
| `/room/[roomId]/settings` | Privacy, inviti, esportazione, uscita e cancellazione. |
| `/room/[roomId]/material/[materialId]` | Lettore interno dei file TXT. |
| `/catalog` | Catalogo e percorsi di Eve. |

Il Catalogo può ricevere `?roomId=<uuid>` per tornare all'aula selezionata e
importarvi materiali o percorsi.

## 4. Registrazione, dashboard e stanze

L'utente può:

1. registrarsi e confermare l'email;
2. accedere alla propria scrivania;
3. creare una stanza assegnandole un nome;
4. copiare un codice invito revocabile;
5. entrare in una stanza con il codice ricevuto;
6. aprire una delle stanze di cui è membro.

Le RPC principali sono `create_study_room`, `join_study_room`,
`leave_study_room`, `rotate_room_invite`, `prepare_study_room_deletion` e
`delete_study_room`. Una correzione specifica della migrazione `0003` risolve la
vecchia ambiguità SQL del campo `room_id` durante l'ingresso con invito.

Il modello non impone un limite di due utenti. I ruoli sono `owner`, `admin` e
`member`.

## 5. Aula: organizzazione visiva

La pagina della stanza segue tre aree:

- **sinistra:** corsi, materiali e checklist;
- **centro:** materiale selezionato, progressi e appunti;
- **destra:** partecipanti, timer, chat e attività recente;
- **testata:** nome stanza, connessione, Catalogo, Chiamata, Riepilogo e
  Impostazioni.

L'interfaccia è responsive e ha una modalità demo in `/room/demo`, che non usa
Supabase e non scrive dati reali.

## 6. Funzioni dell'aula attualmente operative

### Presenza

- Stati: online, sto studiando, in pausa, assente e in chiamata.
- Mostra attività corrente, ultimo aggiornamento e dispositivo generico.
- Usa Presence di Supabase come segnale effimero e la tabella `presence` come
  fonte persistente autorevole.
- Heartbeat e timestamp arrivano dal server.
- Una breve perdita di rete non rende immediatamente offline l'utente.
- La condivisione della presenza può essere disattivata nelle impostazioni.

### Corsi e materiali

- Creazione di corsi nella stanza.
- Aggiunta di link esterni.
- Upload privato di PDF, TXT, DOCX e PPTX fino a 10 MiB.
- Storage nel percorso `<roomId>/<userId>/<nome-sicuro>`.
- Apertura in nuova scheda quando un sito non può essere incorporato.
- I TXT possono essere aperti nel lettore interno.

### Progressi

La compilazione manuale è facoltativa e comprende:

- percentuale;
- capitolo e lezione;
- esercizi svolti;
- punteggio;
- note personali;
- obiettivo successivo.

I “minuti manuali” sono stati rimossi: il tempo viene dal timer server-side.
Il confronto fra partecipanti è informativo e non competitivo.

### Checklist

- Attività assegnabile a tutti o a una persona.
- Priorità bassa, media o alta.
- Scadenza facoltativa.
- Completamento in tempo reale.
- Gli esercizi completati alimentano automaticamente attività e riepilogo.

### Appunti

- Note condivise o private.
- Le private sono visibili solo all'autore grazie alla RLS.
- Questa sezione è considerata soddisfacente e non va stravolta senza una nuova
  richiesta esplicita.

### Chat

- Messaggi testuali in tempo reale.
- Link aperti in modo sicuro.
- Contatore non letti.
- Limite UI di 1.000 caratteri; il database accetta al massimo 2.000.
- Attesa minima client di 1,2 secondi e limiti database contro spam ripetuto.
- I messaggi della chat non entrano nel riepilogo per Tatiana.

### Timer

- Modalità libera o Pomodoro da 25 minuti.
- Avvio, pausa, ripresa e conclusione.
- Il browser visualizza il tempo, ma PostgreSQL lo calcola dai timestamp del
  server tramite RPC.
- `total_seconds` contiene solo tempo già materializzato; il segmento in corso
  viene calcolato da `resumed_at`.

### Attività recente e riepilogo per Tatiana

L'app registra deterministicamente eventi significativi creati dentro l'aula:

- timer avviato, sospeso o concluso;
- materiale aperto;
- task/esercizio creato o completato;
- progressi aggiornati;
- note e altre azioni didattiche pertinenti.

Il riepilogo per Tatiana viene generato senza AI usando dati strutturati:
progressi, tempo reale, esercizi, lezioni, materiali, difficoltà annotate e
obiettivi successivi. È copiabile. Non include chat, chiamate o una cronologia
invasiva di ogni click.

### Autosalvataggio e uscita

- Salvataggio periodico ogni 15 secondi.
- Salvataggio quando cambia la visibilità e dopo la riconnessione.
- `pagehide` usa `navigator.sendBeacon` come ultima rete, senza dipendere solo da
  `beforeunload`.
- Le revisioni crescenti rendono idempotenti replay e doppio beacon.
- Il payload finale può contenere durata, lezioni, esercizi, ultima risorsa,
  note aggiunte e stato del timer.

## 7. Chiamate vocali: stato reale

È implementata una chiamata **audio WebRTC**:

- scelta di una persona o di più partecipanti;
- chiamata individuale o di gruppo;
- invito, squillo, accettazione, rifiuto, uscita e annullamento;
- permesso microfono chiesto prima di far squillare gli altri;
- mute/riattivazione, volume, altoparlante e stop;
- popup fisso in basso a destra, chiudibile o minimizzabile a barretta;
- signaling tramite `call_sessions`, `call_participants` e `call_signals`;
- SDP e candidati ICE trasferiti tramite Supabase Realtime;
- audio P2P con una connessione per ogni partecipante.

Limite importante: sono configurati solo STUN pubblici Google e non un server
TURN. Quindi la chiamata può funzionare su molte reti ma fallire dietro NAT,
firewall o reti mobili restrittive. Non va descritta come affidabile al 100% in
produzione finché non viene aggiunto TURN. Video e condivisione schermo non sono
implementati.

## 8. Realtime

`use-room-realtime.ts` ascolta Postgres Changes per dati condivisi, normalizza
gli eventi, deduplica e riconnette con backoff. Dopo una riconnessione viene
ricaricato lo stato canonico.

`use-room-presence.ts` gestisce heartbeat, più schede dello stesso account,
finestra di tolleranza offline e preferenze di condivisione.

Le principali tabelle pubblicate in Realtime sono membership, presenza, corsi,
materiali, progressi, sessioni, task, messaggi, note, attività, riepiloghi e
chiamate. I canali della stanza sono privati e accessibili soltanto ai membri.

## 9. Catalogo ed Eve: decisione attuale

Eve è il nome dell'assistente dell'app. Nel **Catalogo non usa OpenAI**.

Questa è una decisione esplicita presa dopo prove costose e inaffidabili della
ricerca web via modello. Le route `/api/catalog/search` e `/api/catalog/path`
sono ora completamente deterministiche e non importano provider OpenAI. Anche
`getCatalogConfig()` forza a `false` i flag Eve, web search e curriculum AI,
indipendentemente da vecchie variabili presenti su Vercel.

Non riattivare automaticamente:

- chat OpenAI dentro Eve;
- web search OpenAI;
- generazione a pagamento del percorso;
- importazione automatica di fonti suggerite dal modello.

Vecchi helper, tabelle di cache e migrazioni AI possono ancora esistere per
compatibilità storica, ma il flusso attivo del Catalogo non li utilizza.

### Funzionamento del Catalogo

La barra offre:

1. **Cerca nel catalogo:** cerca soltanto materiali già salvati;
2. **Cerca percorso su Google:** apre Google con una query didattica preparata;
3. **Aggiungi materiale:** permette di ampliare manualmente il Catalogo.

Per ogni tappa del percorso Eve prepara quattro collegamenti Google contestuali:

- lezioni e teoria;
- esercizi svolti con soluzioni;
- video/playlist;
- dispense e file PDF usando anche `filetype:pdf`.

Eve non legge i risultati Google. L'utente sceglie una risorsa e la aggiunge
manualmente indicando URL HTTPS, titolo, tipo, lingua, fonte e descrizione.

I tipi supportati sono pagina, PDF, documento, dataset, notebook, archivio,
file, video, corso, libro e podcast. Le nuove fonti vengono deduplicate per URL,
marcate `pending/community` e restano personali finché non vengono importate in
una stanza.

Un percorso può essere personalizzato per livello iniziale, livello finale e
ore settimanali, poi salvato e importato nella stanza come corso, materiali e
checklist.

### Copertura editoriale attuale

**Programmazione** è il primo pacchetto modulare completo in
`src/lib/catalog/subjects/programming.ts`, registrato da
`src/lib/catalog/subjects/registry.ts`. Contiene 14 tappe, 12 fonti curate,
query Google IT/EN e dati strutturati importabili come corso e checklist.

Restano tre blueprint specifici legacy in `src/lib/catalog/roadmap.ts`:

1. biologia;
2. matematica;
3. ingegneria;

Tutte le altre richieste usano ancora cinque tappe generiche: orientamento,
fondamenti, esercizi, applicazione e verifica. Questo è il principale lavoro da
proseguire.

## 10. Prossimo obiettivo: pacchetti materia

La soluzione concordata è creare contenuti editoriali strutturati, generati
durante lo sviluppo e salvati nell'app. Nessuna AI deve essere chiamata quando
l'utente usa il Catalogo.

Ogni nuovo pacchetto deve seguire il contratto già implementato in
`src/lib/catalog/subjects/types.ts`, che contiene almeno:

```ts
type SubjectPackage = {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  prerequisites: string[];
  targetProfiles: string[];
  branches: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  stages: Array<{
    id: string;
    title: string;
    description: string;
    prerequisites: string[];
    concepts: string[];
    objectives: string[];
    activities: string[];
    exercises: string[];
    projects: string[];
    completionCriteria: string[];
    googleQueries: {
      lessons: string[];
      exercises: string[];
      videos: string[];
      pdfs: string[];
    };
    recommendedMaterials: Array<{
      title: string;
      provider: string;
      url: string;
      type: string;
      language: string;
      level: string;
      verified: boolean;
    }>;
  }>;
};
```

Il percorso non deve fingere che una materia abbia una “fine” assoluta. Deve
portare dalle basi a un livello avanzato o professionale e poi proporre
diramazioni. Per esempio medicina può avere biologia e chimica come prerequisiti
ma deve avere un pacchetto proprio, non riutilizzare impropriamente biologia.

Materie iniziali consigliate:

1. matematica;
2. fisica;
3. biologia;
4. chimica;
5. astronomia;
6. informatica;
7. programmazione;
8. medicina;
9. ingegneria;
10. inglese.

Divisione del lavoro consigliata fra IA:

- **IA editoriale:** produce un pacchetto alla volta, con struttura, ordine,
  prerequisiti e fonti reali; non modifica l'architettura dell'app;
- **Codex nel workspace:** valida il pacchetto, controlla le fonti, lo converte
  nel formato definitivo, aggiunge test, integra e pubblica;
- nessuna IA deve modificare contemporaneamente lo stesso file senza un
  coordinamento esplicito.

## 11. Lettore e traduzione adattiva

Il lettore TXT interno è operativo:

- scarica dal bucket privato dopo verifica RLS;
- mostra testo selezionabile;
- conserva posizione, token e percentuale dell'utente;
- salva periodicamente e quando la pagina viene nascosta;
- non invia automaticamente il documento a servizi esterni.

La route di traduzione contestuale è implementata e controlla sessione,
materiale, frase realmente presente, memoria personale, cache, limiti e
configurazione server. Il provider esterno può partire soltanto se abilitato da
variabili server-side. Il modello più costoso “Sol” è disabilitato nel flusso
normale.

Il Tutor AI personale di Eve, che analizza sessioni e propone materiali, è una
fase futura. Non va confuso con il riepilogo deterministico attuale.

## 12. API server

| Endpoint | Funzione |
| --- | --- |
| `POST /api/webhooks/study-update` | Webhook HMAC idempotente. |
| `POST /api/session/autosave` | Salvataggio revisionato della sessione. |
| `POST /api/session/leave` | Riepilogo finale/beacon. |
| `GET/DELETE /api/rooms/[roomId]` | Lettura e cancellazione orchestrata stanza. |
| `DELETE /api/account` | Cancellazione account e cleanup. |
| `GET /api/catalog/bootstrap` | Tassonomia, materiali, preferenze e stanze. |
| `POST /api/catalog/search` | Ricerca locale e roadmap deterministica. |
| `POST /api/catalog/path` | Salvataggio percorso deterministico. |
| `POST /api/catalog/action` | Salva/importa materiali e percorsi. |
| `POST /api/translation/translate` | Traduzione contestuale opzionale. |

Il webhook accetta eventi come `session_started`, `session_paused`,
`session_completed`, `progress_updated`, `exercise_completed`,
`material_opened`, `note_created` e `user_left_room`. Verifica HMAC-SHA256 sul
raw body, valida con Zod, limita dimensione/frequenza e deduplica tramite
`eventId`.

## 13. Database

Tabelle principali della stanza:

- `profiles`;
- `study_rooms`, `room_members`, `room_invites`;
- `user_room_preferences`, `presence`;
- `courses`, `materials`;
- `progress_entries`, `study_sessions`, `session_summaries`;
- `tasks`, `task_assignees`;
- `messages`, `message_reads`;
- `shared_notes`, `activity_events`;
- `webhook_events`;
- `call_sessions`, `call_participants`, `call_signals`.

Tabelle dell'apprendimento adattivo:

- `user_language_preferences`, `user_vocabulary`;
- `vocabulary_occurrences`, `vocabulary_reviews`;
- `vocabulary_learning_events`, `translation_cache`;
- `material_reader_progress`, `ai_usage_events`, `ai_model_consents`.

Tabelle del Catalogo:

- `catalog_topics`, `catalog_materials`, `catalog_material_topics`;
- `saved_catalog_materials`, `user_learning_preferences`;
- `catalog_searches`, `learning_paths`, `learning_path_modules`;
- `learning_path_items`, `learning_path_room_imports`;
- `catalog_curriculum_cache` rimane storica/inattiva nel flusso attuale.

Le migrazioni sono in `supabase/migrations/0001...0012` e devono essere
applicate in ordine. Non modificare una migrazione già applicata in produzione:
aggiungerne una nuova.

## 14. Sicurezza e privacy

- RLS su tutte le tabelle pubbliche.
- Un estraneo non può leggere una stanza di cui non è membro.
- Note private, preferenze, vocabolario e percorsi personali sono owner-only.
- Storage privato con allowlist MIME, limite di dimensione e path controllato.
- CSP e controlli same-origin sulle route che mutano dati.
- Identità ricavata dalla sessione; mai fidarsi di `userId` dal browser.
- Chiavi OpenAI, Supabase secret e webhook secret mai nel frontend.
- Chat renderizzata come testo, non HTML utente.
- URL manuali del Catalogo solo HTTPS, con blocco reti private e formati
  eseguibili.
- Nessuna raccolta di cronologia browser, fingerprint, audio registrato o pagine
  aperte fuori dall'app.

## 15. Configurazione essenziale

Variabili principali, senza valori reali:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_DEMO_MODE=0

NEXT_PUBLIC_CATALOG_ENABLED=1
CATALOG_ENABLED=true
EVE_CATALOG_ENABLED=false
EVE_WEB_SEARCH_ENABLED=false
EVE_AUTOMATIC_CURRICULUM_ENABLED=false
EVE_PATH_AI_ENABLED=false

TRANSLATION_AI_ENABLED=false
TRANSLATION_PROVIDER=disabled
OPENAI_API_KEY=
```

La chiave OpenAI può essere presente per la traduzione, ma le route del Catalogo
non la leggono. Non cancellare o mostrare segreti durante diagnosi o handoff.

## 16. Test e stato della build

Comandi:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

All'ultimo rilascio risultano superati **81 test su 81**, TypeScript, controllo
di stile delle parti modificate e build Next.js di produzione. La versione è
stata pubblicata e verificata direttamente online.

I test coprono webhook, sincronizzazione, riconnessione, autosalvataggio,
Catalogo, roadmap, lettore, vocabolario, router modelli, storage e controlli di
sicurezza/RLS statici.

## 17. Limiti e lavori futuri

Priorità attuali:

1. trasformare i quattro blueprint in un sistema estensibile di pacchetti;
2. creare pacchetti completi per le materie mancanti;
3. associare fonti esterne curate e verificate a ogni tappa;
4. aggiungere test che impediscano il ritorno al percorso generico per una
   materia dichiarata supportata;
5. aggiungere TURN alle chiamate per affidabilità reale.

Altri lavori futuri:

- video e condivisione schermo;
- lettore PDF con text layer;
- pagina completa del vocabolario e ripasso;
- Tutor Eve con analisi a checkpoint e consenso esplicito;
- rate limiting distribuito;
- worker webhook affidabile;
- scansione antivirus degli upload;
- notifiche push/email;
- editing collaborativo CRDT.

## 18. Regole per chi prosegue il progetto

1. Non riattivare OpenAI nel Catalogo senza una nuova decisione esplicita.
2. Non sostituire i pacchetti editoriali con percorsi generici generati a
   runtime.
3. Non inserire link inventati: ogni URL deve essere reale, HTTPS e verificato.
4. Non esporre segreti e non usare variabili `NEXT_PUBLIC_*` per chiavi private.
5. Non aggirare RLS con controlli solo frontend.
6. Non modificare il timer per calcolarlo soltanto nel browser.
7. Non affidare la perdita dati solo a `beforeunload`.
8. Non includere chat o chiamate nel riepilogo per Tatiana.
9. Conservare note private, privacy della presenza e opt-out attività.
10. Procedere in piccoli cambiamenti verificabili con test, build e controllo
    finale online.

## 19. File principali da conoscere

```text
src/components/room/study-room.tsx       aula e funzioni principali
src/hooks/use-room-realtime.ts            sincronizzazione Postgres Changes
src/hooks/use-room-presence.ts            Presence e heartbeat
src/hooks/use-autosave-session.ts         revisioni, autosave e beacon
src/hooks/use-audio-call.ts               WebRTC audio
src/components/catalog/catalog-explorer.tsx interfaccia Catalogo
src/lib/catalog/roadmap.ts                blueprint attuali
src/lib/catalog/search.ts                 interpretazione e ranking locale
src/app/api/catalog/search/route.ts       ricerca locale senza OpenAI
src/app/api/catalog/path/route.ts         salvataggio percorso locale
src/components/reader/txt-document-reader.tsx lettore TXT
supabase/migrations/                      schema, RPC, RLS e Storage
tests/                                    suite di regressione
README.md                                 avvio e deploy
docs/ARCHITECTURE.md                      architettura generale
docs/DATABASE.md                          modello dati e sicurezza
docs/CATALOG.md                           decisione corrente su Eve
```

Questo documento può essere fornito integralmente a un'altra IA. Il compito più
utile per una seconda chat, in questo momento, è produrre un singolo pacchetto
materia conforme alla struttura proposta, lasciando a Codex l'integrazione nel
repository, i test e la pubblicazione.

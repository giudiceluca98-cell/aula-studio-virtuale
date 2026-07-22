# Architettura della demo canonica

Questo documento descrive come è organizzata la demo ufficiale di **Aula Studio Virtuale**, quali dipendenze esistono tra le funzioni e dove devono essere integrate nell'app Next.js reale.

Fonte eseguibile:

`reference/demo-aula-studio-virtuale-canonica.html`

Branch autorevole:

`demo-canonica`

## 1. Scopo e confini

La demo è una **specifica eseguibile UX/UI** contenuta in un solo file HTML con CSS e JavaScript incorporati.

Serve a definire:

- aspetto;
- disposizione;
- animazioni;
- stati visivi;
- interazioni;
- flussi didattici;
- comportamento responsive.

Non è il codice di produzione e non deve sostituire l'app ufficiale.

Nell'app reale devono rimanere autorevoli:

- Next.js e React;
- autenticazione;
- routing;
- Supabase;
- Row Level Security;
- Realtime e Presence;
- Storage;
- API server-side;
- dati editoriali e progressi reali.

## 2. Modello ad alto livello

La demo contiene tre viste principali nello stesso documento:

1. `#portalPresentation` — presentazione pubblica;
2. `#portalDashboard` — dashboard delle stanze;
3. `#portalAula` — aula completa.

Il routing interno è simulato tramite hash:

- `#presentation`;
- `#dashboard`;
- `#aula`.

Funzioni centrali:

- `normalizePortalRoute()`;
- `navigatePortal()`;
- `portalRouteFromLocation()`;
- listener `popstate`.

Nell'app reale queste viste devono corrispondere a route e layout Next.js reali. Non va copiato il routing a hash.

## 3. Strati dell'interfaccia

### 3.1 Portale

Responsabilità:

- presentazione del prodotto;
- call to action;
- navigazione verso dashboard;
- contenuti descrittivi;
- responsive del sito pubblico.

Elementi chiave:

- `.portal-view`;
- `.portal-header`;
- `.portal-container`;
- `.portal-section`;
- `.portal-cta`;
- `.portal-footer`.

### 3.2 Dashboard

Responsabilità:

- elenco stanze;
- creazione stanza simulata;
- ingresso tramite codice simulato;
- apertura del Catalogo;
- accesso all'aula.

Elementi e funzioni chiave:

- `#portalDashboard`;
- `portalCreateRoom()`;
- `portalJoinRoom()`;
- `portalOpenCatalog()`;
- `portalNotify()`.

Nell'app reale, creazione e ingresso devono usare le API e le RPC esistenti. I toast simulati non sostituiscono operazioni server-side.

### 3.3 Shell dell'aula

Responsabilità:

- intestazione stanza;
- barra strumenti;
- apertura drawer e modali;
- timer;
- centro messaggi;
- contenuto didattico;
- Eve.

Destinazione principale confermata nell'app reale:

`src/components/room/study-room.tsx`

Il componente reale integra già Supabase, Realtime, Presence, autosalvataggio, chiamate audio, materiali e `MessageCenter`.

### 3.4 Workspace didattico

La struttura visiva è composta da:

- intestazione materiale;
- tab didattiche;
- pannello progressi e missioni;
- colonna moduli/lezioni;
- documento centrale;
- pannello Eve.

Tab logiche:

- lezione;
- esercizi/pratica;
- quiz;
- progetto;
- glossario.

Destinazione confermata nell'app reale:

`src/components/room/programming-lesson-workspace.tsx`

Il componente reale possiede già stato React per:

- tab attiva;
- sezione corrente;
- lezione selezionata;
- zoom;
- sidebar compressa;
- pannello Eve compresso;
- Eve sganciata;
- indice mobile;
- progressi e salvataggio.

## 4. Moduli funzionali

### 4.1 Lezione e navigazione

Responsabilità:

- undici sezioni navigabili;
- precedente/successiva;
- completamento contenuto;
- evidenziazione della sezione attiva;
- aggiornamento progresso;
- autosalvataggio.

Funzioni demo correlate:

- `renderLessonSection()`;
- `nextSection()`;
- `previousSection()`;
- `completeCurrentSection()`;
- `switchView()`;
- `selectLesson()`.

Nell'app reale usare azioni React e l'endpoint della lezione, non manipolazione diretta del DOM.

### 4.2 Progressi e missioni

Responsabilità:

- percentuale complessiva;
- missioni orizzontali;
- stato espanso/compresso;
- conteggio lettura, esercizi, quiz e progetto.

Funzioni demo correlate:

- `getProgress()`;
- `updateProgress()`;
- logica missioni;
- `progressMissionsExpanded`.

Nell'app reale il progresso deve derivare dallo stato canonico restituito dalle API, non essere ricalcolato soltanto nel client.

### 4.3 Eve mascotte contestuale

Responsabilità:

- presenza visiva;
- contesto in base all'attività;
- stato compresso;
- reazioni e animazioni;
- supporto a `prefers-reduced-motion`.

Funzioni demo correlate:

- `setEveContext()`;
- `toggleEveAssistant()`;
- `askEveContextualHelp()`;
- logica sguardo e puntatore;
- classi `eve-speaking`, `collapsed`, `wink`.

Contesti principali:

- lesson;
- exercises;
- quiz;
- project;
- glossary;
- corsi;
- materiali;
- checklist;
- progressi;
- appunti;
- partecipanti;
- attività;
- audio.

La mascotte non deve contenere dati sensibili e non deve sostituire il motore reale di Eve.

### 4.4 Eve Voice per la lezione

Responsabilità:

- Web Speech API;
- scelta voce;
- velocità;
- modalità fedele/spiegata;
- ambito corrente, selezionato o intera lezione;
- selezione compatta delle pagine;
- pausa, ripresa e stop;
- avanzamento automatico;
- testo sincronizzato;
- classificazione dell'attenzione.

Destinazione confermata nell'app reale:

`src/components/room/eve-lesson-audio.tsx`

Classificazioni semantiche:

- `standard` — spiegazione;
- `key` — concetto chiave;
- `critical` — massima attenzione;
- `example` — esempio/applicazione;
- `code` — schema o codice.

Preferenze locali ammesse:

- voce;
- velocità;
- modalità visiva.

I progressi didattici non devono dipendere dalla sola sintesi vocale locale.

### 4.5 Assistente vocale per gli esercizi

Responsabilità:

- lettura della consegna;
- lettura del testo selezionato nella consegna o nella risposta;
- suggerimenti progressivi non risolutivi;
- pausa e stop;
- transcript sincronizzato;
- lettura della soluzione/modello di confronto solo dopo il completamento.

Destinazione confermata nell'app reale:

`src/components/room/exercise-voice-assistant.tsx`

Flusso obbligatorio:

1. ascolta la consegna;
2. prova autonomamente;
3. richiede suggerimenti graduali;
4. conclude l'esercizio;
5. vede e ascolta il confronto corretto.

La soluzione non deve essere resa disponibile prima che il backend consideri completato l'esercizio.

### 4.6 Centro messaggi

Responsabilità:

- lobby generale permanente;
- chat private;
- gruppi;
- ricerca;
- filtri;
- non letti;
- allegati;
- emoji;
- informazioni partecipanti;
- archiviazione;
- minimizzazione di più conversazioni;
- riapertura rapida;
- layout desktop e mobile;
- trascinamento sicuro.

Destinazione confermata nell'app reale:

`src/components/room/message-center.tsx`

Componente contenitore reale:

`src/components/room/study-room.tsx`

Regole strutturali:

- la lobby deve essere sempre presente e non archiviabile;
- la lobby deve restare in cima;
- le altre conversazioni sono ordinate per ultimo aggiornamento;
- il trascinamento usa listener globali `pointermove`, `pointerup`, `pointercancel` e `blur`;
- i messaggi reali devono usare schema Supabase, Storage e Realtime;
- la posizione e le chat minimizzate possono restare preferenze locali dell'interfaccia.

### 4.7 Timer

Responsabilità:

- modalità libera/Pomodoro;
- avvio, pausa e reset;
- finestra flottante;
- trascinamento;
- persistenza della preferenza visiva.

Nell'app reale eventuali sessioni condivise devono usare lo stato server/realtime già esistente. La posizione della finestra può restare privata e locale.

### 4.8 Drawer e modali

Drawer simulati:

- corsi;
- materiali;
- checklist;
- progressi;
- appunti;
- partecipanti;
- attività recente.

Modali simulati:

- Catalogo;
- chiamata;
- riepilogo;
- impostazioni.

Funzioni demo correlate:

- `drawerTemplates`;
- `modalTemplates`;
- `openDrawer()`;
- `closeDrawer()`;
- `openModal()`;
- `closeModal()`.

Nell'app reale ciascun pannello deve ricevere dati tipizzati e autorizzati, non stringhe HTML inserite con `innerHTML`.

### 4.9 Cursore personalizzato

Responsabilità:

- sfera nera lucida;
- anello ciano;
- compressione su pressione;
- burst e onda al rilascio;
- movimento istantaneo;
- fallback nativo su touch/coarse pointer;
- rispetto di `prefers-reduced-motion`.

Il cursore è un miglioramento puramente visivo. Non deve interferire con focus, tastiera, touch o accessibilità.

## 5. Stato della demo

La demo usa un unico oggetto `state` e serializza la maggior parte delle preferenze nella chiave:

`aula-demo-layout-reale`

Stati principali:

- `currentSection`;
- `currentView`;
- `completedSections`;
- `exerciseDrafts`;
- `exerciseCompletedIds`;
- `activeExerciseId`;
- `quizCorrect`;
- `projectSubmitted`;
- `notes`;
- `timerSeconds`;
- `timerRunning`;
- `timerPomodoro`;
- `audioRate`;
- `audioVoiceURI`;
- `audioMode`;
- `audioScope`;
- `audioSelectedSections`;
- `evePanelCollapsed`;
- `eveDetachEnabled`;
- `progressMissionsExpanded`;
- `modulesPanelCollapsed`;
- `chat`.

## 6. Classificazione della persistenza

### Può restare locale nell'app reale

- tema;
- zoom di lettura;
- voce preferita;
- velocità di lettura;
- pannelli compressi;
- Eve sganciata;
- posizione widget;
- conversazioni minimizzate;
- preferenze responsive/UI.

### Deve usare il backend reale

- progressi;
- sezioni completate;
- risposte agli esercizi;
- quiz;
- progetto;
- messaggi;
- conversazioni;
- membri dei gruppi;
- allegati;
- note condivise;
- materiali;
- sessioni condivise;
- attività recente;
- stato presenza.

### Deve essere privato per utente

- appunti personali;
- bozze non condivise;
- preferenze di lettura;
- vocabolario e traduzioni personali;
- cronologia privata dell'assistente, quando prevista.

## 7. Flussi evento principali

### Apertura aula

1. il routing reale autorizza l'utente;
2. vengono caricati stanza, membri e materiali;
3. Realtime e Presence vengono attivati;
4. l'ultimo stato personale dell'interfaccia viene ripristinato;
5. l'utente apre il materiale nel workspace.

### Completamento sezione

1. l'utente conferma di aver compreso;
2. il client invia un'azione all'endpoint della lezione;
3. il server valida e salva;
4. il server restituisce stato e consiglio Eve aggiornati;
5. il client aggiorna progressi e missioni.

### Conclusione esercizio

1. la bozza viene conservata;
2. il backend verifica i requisiti minimi;
3. l'esercizio viene marcato completato;
4. solo allora viene fornito il confronto corretto;
5. Eve legge il confronto;
6. viene proposto il prossimo esercizio.

### Invio messaggio

1. l'utente seleziona lobby, privato o gruppo;
2. il client verifica appartenenza e conversazione attiva;
3. gli allegati vengono caricati nello Storage privato;
4. il messaggio viene salvato nel database;
5. Realtime aggiorna gli altri partecipanti;
6. non letti e ordinamento vengono ricalcolati.

## 8. Mappa demo → app reale

| Area demo | Destinazione reale confermata | Note |
|---|---|---|
| Shell aula, toolbar, pannelli | `src/components/room/study-room.tsx` | Conservare hook Supabase e autorizzazioni |
| Workspace programmazione | `src/components/room/programming-lesson-workspace.tsx` | Stato React + API lezione |
| Eve Voice lezione | `src/components/room/eve-lesson-audio.tsx` | Web Speech API lato client |
| Eve esercizi | `src/components/room/exercise-voice-assistant.tsx` | Soluzione subordinata al completamento |
| Centro messaggi | `src/components/room/message-center.tsx` | Dati reali, lobby permanente, minimizzazione locale |
| Realtime stanza | `src/hooks/use-room-realtime.ts` | Non duplicare listener o canali |
| Presence | `src/hooks/use-room-presence.ts` | Fonte autorevole di stato utenti |
| Autosalvataggio sessione | `src/hooks/use-autosave-session.ts` | Non sostituire con timer localStorage |
| Visualizzazione materiali | `src/components/room/material-workspace-viewer.tsx` | Aprire prima nel workspace interno |

Le route del portale e della dashboard devono essere mappate sulla struttura `app/` esistente dopo averne verificato i percorsi correnti. Non inventare route nuove senza analizzare il repository.

## 9. Dipendenze da non spezzare

- `switchView()` cambia anche il contesto di Eve;
- navigazione lezione e audio devono restare sincronizzati;
- completamenti aggiornano progressi e missioni;
- il pannello Eve dipende dalla scheda attiva;
- la soluzione esercizio dipende dallo stato di completamento;
- la lobby dipende dall'elenco membri della stanza;
- i badge non letti dipendono dalla conversazione attiva e dallo stato di lettura;
- minimizzazione e trascinamento non devono cancellare la conversazione;
- reset demo non equivale a cancellazione dati di produzione;
- tema e superfici di lettura devono restare distinti ma coerenti.

## 10. Ordine consigliato di integrazione

1. shell e layout aula;
2. workspace didattico;
3. progressi e missioni;
4. Eve Voice lezione;
5. Eve negli esercizi;
6. centro messaggi;
7. timer, drawer e modali;
8. portale e dashboard;
9. cursore ed effetti accessori;
10. verifica responsive e accessibilità.

Ogni fase deve avere un branch dedicato e una pull request verificabile.

## 11. Controlli anti-regressione

Prima di dichiarare equivalente una funzione:

- nessun errore in console;
- nessun ID o listener duplicato;
- nessuna funzione preesistente rimossa;
- desktop e mobile verificati;
- tastiera e focus utilizzabili;
- `prefers-reduced-motion` rispettato;
- localStorage usato soltanto per preferenze appropriate;
- RLS e autorizzazioni conservate;
- Realtime senza duplicazione eventi;
- refresh e navigazione non perdono dati;
- test, typecheck, lint e build superati;
- confronto visivo con la demo canonica completato.

## 12. Definizione di completamento

Un aggiornamento è completato soltanto quando:

1. la demo canonica contiene il comportamento approvato;
2. `CHANGELOG_DEMO.md` registra la modifica;
3. `README.md` contiene identificatori aggiornati;
4. Codex ha integrato la funzione nell'app reale su branch separato;
5. il risultato reale è stato confrontato con la demo;
6. backend, sicurezza e persistenza reale sono rimasti intatti;
7. la pull request documenta test eseguiti e limiti residui.

## Catalogo intelligente nella demo canonica

La route `#catalog` è una vista autonoma dello stesso documento HTML. Usa dati mock deterministici e riproduce il flusso operativo dell'app ufficiale senza chiamare backend o provider esterni.

Componenti logici:

- `catalogDemoMaterials` — inventario materiali;
- `catalogDemoState` — salvati, selezione e firma dell'importazione;
- `catalogDemoFilteredMaterials()` — ricerca e filtri combinati;
- `catalogDemoRender()` — risultati, feedback Eve e stati vuoti;
- `catalogDemoRenderPath()` — percorso selezionato;
- `catalogDemoImportPath()` — importazione locale idempotente.

L'app reale conserva come fonti autorevoli API, Supabase, RLS e importazione server-side; la demo definisce UX, stati e responsive.

### Materiali manuali del Catalogo

La demo 1.1.0-alpha.2 conserva le risorse inserite dall'utente in `localStorage` con la chiave `aula-demo-catalog-manual-v1`. Questa è esclusivamente una simulazione privata del browser. Nell'app reale la fonte autorevole resta il backend con RLS.

Funzioni:

- `catalogDemoNormalizeManualUrl()` — HTTPS, rete pubblica e formato;
- `catalogDemoManualId()` — identificatore stabile derivato dall'URL;
- `catalogDemoLoadManualMaterials()` — ripristino locale;
- `catalogDemoPersistManualMaterials()` — persistenza locale;
- `catalogDemoAddManualMaterial()` — validazione, deduplicazione e selezione;
- `catalogDemoOpenManualMaterial()` / `catalogDemoCloseManualMaterial()` — dialog e focus.

## Dashboard create/join nella demo

La demo 1.2.0-alpha.1 riproduce gli effetti utente delle RPC reali `create_study_room` e `join_study_room` usando dati locali e `localStorage` (`aula-demo-dashboard-rooms-v1`). Nell'app ufficiale restano autorevoli autenticazione, RPC, RLS e membership server-side.

Funzioni principali:

- `portalDashboardLoadRooms()` / `portalDashboardSaveRooms()`;
- `portalDashboardRenderRooms()`;
- `portalDashboardCreateRoom()`;
- `portalDashboardJoinRoom()`;
- `portalDashboardSetWorking()`;
- `portalDashboardFieldFeedback()`.

## Ruoli e presenza nella Dashboard demo

La demo 1.2.0-alpha.2 usa preset locali per mostrare gli effetti utente di membership e Presence. I dati non sono Realtime e l'interfaccia lo dichiara. Nell'app ufficiale restano autorevoli `room_members`, i record server di presenza, heartbeat e grace period prima dell'offline.

La matrice rappresentata comprende:

- ruoli `owner`, `admin`, `member`;
- stati `online`, `studying`, `break`, `away`, `in_call`, `offline`;
- attività, dispositivo, ultimo accesso e numero di sessioni;
- separazione tra utenti online e sessioni aperte.

## Codice invito nella Dashboard demo

La demo 1.2.0-alpha.3 riproduce l'effetto utente di `copyInvite()` e della RPC `rotate_room_invite` usando lo stato locale della Dashboard. La rotazione è disponibile soltanto per `owner`, incrementa `inviteRevision`, sostituisce `inviteCode` e registra `inviteRotatedAt`.

Il codice precedente non viene conservato tra i codici attivi. Nell'app ufficiale autorizzazione, atomicità e revoca sono garantite dal server; la demo mostra soltanto gli stati e il flusso dell'interfaccia.

## Uscita e cancellazione nella Dashboard demo

La demo 1.2.0-alpha.4 rappresenta gli effetti utente di `leave_study_room` e del route `DELETE /api/rooms/[roomId]` con stato locale. L'uscita trasferisce simbolicamente la proprietà prima a un admin e poi a un membro; se non resta nessuno, la stanza viene rimossa dalla Scrivania come archiviata.

La cancellazione è visibile solo agli owner, richiede `ELIMINA STANZA` e mostra le tre fasi del flusso reale: tombstone/revoca inviti, pulizia Storage, cancellazione database. Autorizzazione, transazioni e idempotenza restano responsabilità dell'app ufficiale.

## Collegamento contestuale Dashboard → Catalogo

La demo 1.2.0-alpha.5 riproduce il parametro `roomId` della route Catalogo dell'app ufficiale mediante `portalCatalogPreferredRoomId` e `localStorage` (`aula-demo-catalog-room-context-v1`). La destinazione viene impostata dal banner Dashboard, dalla scheda stanza o dall'Aula.

Le firme di importazione sono salvate per stanza in `aula-demo-catalog-room-imports-v1`, così lo stesso percorso può essere importato in stanze diverse ma non duplicato nella stessa. Nell'app ufficiale membership, autorizzazione e importazione restano server-side.

## Stati di errore della Dashboard demo

La demo 1.2.0-alpha.6 rappresenta gli effetti utente delle risposte RPC e dei controlli membership senza simulare un backend. `ARCHIVIATA26`, `NEGATO2026` e `OFFLINE2026` attivano rispettivamente stanza archiviata, accesso negato ed errore temporaneo.

Il retry dell'errore temporaneo è deterministico e idempotente: aggiunge `recovery-room` una sola volta. Il caricamento iniziale espone `aria-busy`; gli errori di `localStorage` usano una copia sicura delle stanze predefinite e dichiarano la possibile mancata persistenza.

## Pannello Materiali della Fase 3

La demo 1.3.0-alpha.1 introduce un modello locale di `UiMaterial` coerente con l'app ufficiale: corso, formato, `access_mode`, `monitoring_level`, viewer previsto e avanzamento. La selezione viene salvata in `aula-demo-materials-panel-v1`.

La lezione nativa riusa il workspace completo esistente. Per TXT, PDF, DOCX, PPTX e link esterni questa sottofase mostra soltanto selezione, metadati e stato di disponibilità. I viewer e il tracking specifico vengono integrati separatamente nelle sottofasi successive della Fase 3.

## Fase 3 · 1.3.0-alpha.2

Upload locale simulato e collegamenti https con validazione. La demo mantiene dati deterministici e non dichiara chiamate remote reali. La copia del checkpoint è salvata in `reference/checkpoints/phase-3/`.

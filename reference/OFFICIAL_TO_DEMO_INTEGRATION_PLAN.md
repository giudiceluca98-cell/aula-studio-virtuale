# Piano di integrazione — app ufficiale → demo canonica

Questo documento definisce come portare nella demo canonica le funzionalità operative presenti nell'app ufficiale ma assenti, semplificate o soltanto simulate nella demo.

## Snapshot analizzato

- App ufficiale: branch `main`
- Commit di riferimento iniziale: `2171cf45d6ebf8df53801b4788823894e7638e50`
- Demo: branch `demo-canonica`
- File: `reference/demo-aula-studio-virtuale-canonica.html`
- SHA-256 demo iniziale: `4727ddde31f968c5ecf9c931b303579c7ba27b2850f0fd407fc0ae72f8b4485a`

Il piano deve essere riesaminato quando `main` cambia in modo sostanziale.

---

## 1. Regola di scelta tra app e demo

### Mantieni la versione della demo quando

- la demo offre un'interazione più completa o più chiara;
- l'aspetto approvato è più coerente con Futuristica Focus;
- la demo ha già risolto problemi di responsive, minimizzazione o trascinamento;
- la demo presenta meglio Eve, la lettura o la chat;
- il comportamento non dipende da dati reali o sicurezza server-side.

Esempi in cui la demo resta autorevole:

- centro messaggi e chat minimizzate;
- comportamento del trascinamento globale;
- Eve mascotte e pannello vocale;
- visualizzatore di frequenza e attenzione;
- layout di lettura chiaro;
- progressi e missioni come presentazione visiva;
- cursore a sfera;
- pannelli comprimibili.

### Mantieni la funzione dell'app ufficiale quando

- nella demo la funzione non esiste;
- la funzione usa autenticazione, Supabase, RLS, Realtime o Storage;
- la demo contiene soltanto un mock o un toast senza flusso reale;
- l'app gestisce permessi, errori, importazione, rimozione o persistenza reale;
- la funzione è documentata come operativa e ha codice effettivo in `main`.

### Crea una versione ibrida quando

- l'app ufficiale ha il flusso corretto ma la demo ha un'interfaccia migliore;
- la demo deve mostrare tutti gli stati del flusso senza collegarsi al backend;
- il comportamento reale deve essere riprodotto con dati demo deterministici.

Regola sintetica:

> **Backend e regole dall'app ufficiale; UX e stile dalla demo, salvo che l'app abbia un'interazione migliore non ancora presente nella demo.**

---

## 2. Cosa non deve entrare nella demo come falsa funzionalità

Non integrare come se fosse operativo ciò che nell'app è soltanto pianificato o incompleto.

### Rimandato o non completamente operativo

- pagina completa del vocabolario con filtri, correzione, export e ripasso;
- annotazioni adattive automatiche su PDF;
- OCR per PDF scansionati;
- Eve Tutor con analisi AI automatica di fine sessione;
- consenso ed esecuzione del livello Sol;
- chiamate video complete, condivisione schermo e TURN gestito;
- notifiche push/email;
- moderazione avanzata e analytics aggregati;
- CRDT per editing simultaneo carattere per carattere;
- scansione antivirus asincrona.

La demo può mostrare queste voci soltanto come `In arrivo`, mai come pulsanti apparentemente funzionanti.

---

## 3. Inventario delle funzioni operative dell'app mancanti o incomplete nella demo

### 3.1 Catalogo intelligente

Fonte principale:

- `src/app/catalog/page.tsx`
- `src/components/catalog/catalog-explorer.tsx`
- `src/lib/catalog/`
- `docs/CATALOG.md`

Funzioni da rappresentare nella demo:

- route Catalogo completa, non semplice modale informativa;
- ricerca per materia, obiettivo, progetto, professione o esame;
- interpretazione deterministica di Eve;
- filtri per livello, formato, lingua e fonte verificata;
- esplorazione per argomenti e sottoargomenti;
- materiali salvati;
- selezione dei materiali per un percorso;
- schede con provider, formato, livello, lingua e monitorabilità;
- ricerca Google didattica preparata;
- aggiunta manuale di un materiale HTTPS;
- deduplicazione simulata per URL;
- creazione di un percorso;
- scelta livello iniziale, obiettivo, ore settimanali e stanza;
- consenso alla personalizzazione tramite progressi;
- importazione di un singolo materiale;
- importazione del percorso come corso, materiali e checklist;
- comportamento idempotente simulato;
- stati loading, vuoto, errore, già presente e importazione riuscita.

Decisione:

- **funzione dall'app ufficiale**;
- **stile Futuristica Focus e transizioni dalla demo**;
- Eve del Catalogo usa la mascotte e il linguaggio visivo della demo;
- nessuna chiamata OpenAI nella demo.

### 3.2 Lettore materiali e traduttore contestuale

Fonte principale:

- `src/app/room/[roomId]/material/[materialId]/page.tsx`
- `src/components/reader/txt-document-reader.tsx`
- `src/components/room/material-workspace-viewer.tsx`
- `docs/ADAPTIVE_LEARNING.md`

Funzioni da rappresentare:

- lettore TXT interno;
- testo tokenizzato e selezionabile;
- ripristino di paragrafo, token e posizione;
- scelta lingua sorgente e destinazione;
- selezione di una parola;
- traduzione rapida;
- traduzione accurata;
- spiegazione nel contesto;
- alternative ed eventuale spiegazione;
- indicazione della fonte: memoria, cache o server;
- aggiunta automatica al vocabolario privato;
- livello di apprendimento e mastery score;
- stati provider disattivato, limite raggiunto, richiesta in corso, contesto non valido e rate limit;
- risposta `confirmation_required` per analisi avanzata senza esecuzione automatica;
- autosalvataggio della posizione;
- messaggio privacy: viene inviata soltanto la frase necessaria.

Decisione:

- **flusso e stati dall'app ufficiale**;
- **superficie di lettura, Eve e accessibilità dalla demo**;
- il mock deve essere deterministico e non deve chiamare servizi esterni;
- il vocabolario viene simulato nello stato della demo, ma dichiarato privato.

### 3.3 Workspace interno dei materiali

Fonte principale:

- `src/components/room/material-workspace-viewer.tsx`
- route API dei materiali;
- `README.md`, sezione workspace interno.

Tipi da rappresentare:

- TXT;
- PDF;
- DOCX estratto come testo sicuro;
- PPTX come slide testuali;
- YouTube;
- playlist YouTube;
- Vimeo;
- video HTTPS;
- lezione nativa;
- `import-required`;
- non supportato;
- non disponibile.

Stati da rappresentare:

- apertura;
- ripresa;
- caricamento;
- errore;
- pagina/slide corrente;
- percentuale;
- tempo attivo;
- video in riproduzione, pausa e seek;
- intervalli realmente visti;
- completamento video solo dopo copertura sufficiente;
- alternativa o caricamento richiesto;
- apertura esterna non monitorabile come azione secondaria.

Decisione:

- mantenere il workspace centrale della demo;
- aggiungere un selettore di materiali realistico;
- non usare iframe remoti nella demo canonica;
- simulare i player con contenuti locali e stati controllabili.

### 3.4 Dashboard reale delle stanze

Fonte principale:

- route `dashboard`;
- componenti di creazione e ingresso stanza;
- README operativo.

Funzioni da aggiungere alla dashboard demo:

- elenco stanze possedute e stanze partecipate;
- creazione stanza con validazione;
- ingresso tramite codice;
- copia codice invito;
- revoca e rigenerazione del codice;
- indicazione ruolo owner/admin/member;
- ultima attività;
- partecipanti online;
- uscita dalla stanza;
- cancellazione owner-only;
- stati accesso non autorizzato, codice errato e stanza archiviata;
- collegamento reale al Catalogo come voce principale.

Decisione:

- mantenere l'aspetto della dashboard demo;
- sostituire le azioni puramente decorative con flussi mock completi.

### 3.5 Corsi, materiali e importazione

Funzioni da aggiungere o completare:

- creazione corso;
- collegamento materiale a un corso;
- URL e upload file;
- tipi PDF, TXT, DOCX e PPTX;
- limite 10 MB e MIME ammessi come stati simulati;
- nomi file sicuri generati dall'app;
- classificazione di accesso e monitorabilità;
- importazione dal Catalogo;
- selezione del materiale nel workspace;
- avviso se un materiale aperto viene rimosso.

Decisione:

- pannello Materiali della demo resta visivamente autorevole;
- aggiungere dialoghi e stati reali dell'app ufficiale.

### 3.6 Rimozione sicura di corsi e materiali

Fonte principale:

- `docs/ROOM_LAYOUT_AND_REMOVAL.md`
- `src/components/room/room-content-removal-dialog.tsx`

Funzioni da rappresentare:

- permessi owner/admin/creatore;
- anteprima impatto;
- archiviazione non distruttiva;
- indicazione file Storage;
- rimozione `Solo corso`;
- rimozione `Corso e contenuti`;
- preservazione di progressi e cronologia;
- importazione Catalogo riutilizzabile;
- seconda richiesta idempotente;
- stato coda eliminazione file;
- aggiornamento Realtime simulato sugli altri partecipanti;
- focus trap, Escape e ripristino del focus.

Decisione:

- integrare dopo il workspace materiali, perché dipende dai suoi stati.

### 3.7 Checklist reale

Funzioni da rappresentare:

- testo attività;
- priorità;
- scadenza;
- assegnazione a tutti o a un partecipante;
- completamento e riapertura;
- ordine;
- task importati da un percorso;
- aggiornamento dell'attività recente;
- separazione tra attività personali e condivise quando prevista.

Decisione:

- conservare il pannello comprimibile della demo;
- ampliare il contenuto con stati e metadati dell'app.

### 3.8 Appunti condivisi e privati

Funzioni da rappresentare:

- creazione nota;
- scelta privata/condivisa;
- autore e timestamp;
- modifica;
- ordinamento;
- visibilità coerente con il ruolo;
- preferenza predefinita per note private;
- mancata inclusione delle note private nei riepiloghi condivisi.

Decisione:

- integrare nel drawer Appunti esistente.

### 3.9 Progressi reali

Funzioni da rappresentare:

- progresso percentuale;
- capitolo e lezione;
- esercizi svolti;
- punteggio;
- note sul progresso;
- prossimo obiettivo;
- confronto non competitivo;
- eventi automatici da materiali e attività;
- stato personale separato da quello degli altri.

Decisione:

- mantenere la presentazione missioni/progresso della demo;
- aggiungere il dettaglio reale dell'app nei pannelli e nei dialoghi.

### 3.10 Timer e sessioni

Funzioni da rappresentare:

- libero/Pomodoro;
- avvio, pausa, ripresa e conclusione;
- tempo derivato da timestamp server;
- sessione propria e stato degli altri;
- autosalvataggio e riconnessione;
- minimizzazione senza perdita dello stato;
- evento nel riepilogo e nell'attività recente.

Decisione:

- mantenere il widget flottante della demo;
- aggiungere stati server simulati e cronologia sessioni.

### 3.11 Partecipanti e Presence

Funzioni da rappresentare:

- online;
- sta studiando;
- in pausa;
- assente;
- in chiamata;
- offline;
- attività corrente;
- ultimo accesso;
- dispositivo generico;
- ruolo;
- più schede dello stesso account;
- preferenza di condivisione presenza;
- tolleranza prima di mostrare offline.

Decisione:

- integrare nei pannelli Partecipanti e Attività, senza rendere invasiva la UI.

### 3.12 Centro messaggi

L'app ufficiale ha backend, RLS, Realtime, Storage e schema conversazioni. La demo ha UX più completa.

Decisione:

- **mantenere la chat della demo**;
- aggiungere solamente gli stati reali mancanti:
  - migrazione/schema non disponibile;
  - invio pendente;
  - errore upload;
  - permessi conversazione;
  - allegato privato;
  - ricezione Realtime simulata;
  - fallback Lobby legacy;
  - archiviazione autorizzata;
  - indicatori di connessione e riconnessione.

Non sostituire il layout demo con la versione più semplice dell'app.

### 3.13 Chiamate audio

Funzioni operative da rappresentare:

- apertura pannello;
- invito partecipanti;
- stato waiting/active/ended;
- partecipanti invitati, entrati e usciti;
- mute;
- volume;
- speaker bloccato;
- minimizzazione;
- suoneria in ingresso;
- consenso esplicito per il microfono;
- stato in chiamata nella Presence.

Non rappresentare come operative:

- video completo;
- condivisione schermo;
- qualità rete avanzata;
- TURN gestito.

Decisione:

- usare il pannello flottante e lo stile della demo;
- usare gli stati e il flusso dell'app ufficiale.

### 3.14 Attività recente e riepilogo

Funzioni da rappresentare:

- sessione iniziata/pausata/conclusa;
- progresso aggiornato;
- esercizio completato;
- attività creata/completata/riaperta;
- materiale aperto/ripreso/chiuso;
- lettura e video iniziati/completati;
- nota condivisa creata;
- uscita dalla stanza;
- riepilogo automatico copiabile;
- esclusione di chat, chiamate, risposte private, traduzioni e vocabolario.

Decisione:

- mantenere la resa visiva della demo;
- ampliare gli eventi e i filtri privacy.

### 3.15 Impostazioni, privacy e account

Funzioni operative da rappresentare:

- tema personale;
- preferenze di presenza;
- note private predefinite;
- lingue studiate;
- lingua destinazione;
- consenso personalizzazione Catalogo;
- esportazione progressi;
- cancellazione account;
- uscita dalla stanza;
- cancellazione stanza in due fasi;
- gestione del codice invito;
- indicazione dati privati e condivisi.

Decisione:

- estendere la modale Impostazioni della demo;
- usare conferme separate per azioni distruttive.

### 3.16 Autenticazione

Funzioni da rappresentare nella demo completa del prodotto:

- accesso;
- registrazione;
- sessione scaduta;
- redirect alla destinazione richiesta;
- conferma email come stato;
- errore credenziali;
- logout.

Decisione:

- aggiungere viste demo coerenti con presentazione e dashboard;
- non simulare provider sociali non presenti.

### 3.17 Python Project ed esecuzione

Funzioni dell'app da rappresentare quando si apre un progetto:

- editor;
- codice iniziale;
- esecuzione Python isolata;
- output;
- reset;
- errori;
- salvataggio bozza;
- consegna;
- risultato atteso e rubrica;
- stato di completamento.

Decisione:

- integrare dopo i lettori e prima del controllo finale del workspace didattico.

---

## 4. Funzioni tecniche da non trasformare in schermate

Queste parti devono restare documentate ma non diventare pannelli finti nella demo:

- RLS;
- policy Storage;
- HMAC webhook;
- Zod server-side;
- idempotenza database;
- rate limiting;
- coda webhook;
- cache server-only;
- chiavi e variabili ambiente;
- heartbeat RPC;
- CSP;
- sanitizzazione server dei documenti.

La demo deve mostrare soltanto gli effetti utente: accesso negato, limite raggiunto, errore sicuro, stato salvato o operazione idempotente.

---

## 5. Ordine di integrazione nella demo

Ogni fase produce una nuova versione canonica e non deve iniziare finché la precedente non è verificata.

### Fase 0 — Baseline e test di regressione

Obiettivo:

- creare una checklist automatica delle funzioni attuali della demo;
- congelare screenshot desktop e mobile;
- verificare route, Eve, audio, chat, esercizi, progressi e responsive;
- impedire che le integrazioni successive rompano il lavoro già approvato.

Output:

- versione `1.0.x` invariata visivamente;
- test JS e inventario DOM;
- screenshot baseline.

### Fase 1 — Catalogo intelligente

È il primo modulo da integrare perché è indipendente dall'aula e oggi la demo mostra soltanto un Catalogo semplificato.

Sottofasi:

1. vista Catalogo e navigazione;
2. ricerca e filtri;
3. schede materiali e salvati;
4. aggiunta manuale URL;
5. percorso Eve;
6. personalizzazione e consenso;
7. importazione in stanza;
8. stati errore/vuoto/idempotenza;
9. responsive.

### Fase 2 — Dashboard reale e gestione stanze

Sottofasi:

1. create/join;
2. ruoli e presenza;
3. codice invito;
4. uscita/cancellazione;
5. collegamento Catalogo;
6. stati di errore.

### Fase 3 — Materiali e workspace interno

Sottofasi:

1. pannello materiali;
2. upload/link;
3. tipi e classificazione;
4. PDF;
5. DOCX/PPTX;
6. video;
7. import-required;
8. tracking e ripresa;
9. errori e alternative.

### Fase 4 — Traduttore e lettore adattivo

Sottofasi:

1. lettore TXT;
2. selezione parola;
3. lingue;
4. traduzione rapida;
5. accurata;
6. spiegazione contestuale;
7. memoria/cache/vocabolario;
8. limiti ed errori;
9. autosalvataggio posizione;
10. accessibilità e mobile.

### Fase 5 — Corsi, checklist, note e progressi

Integrare un pannello alla volta:

1. corsi;
2. checklist;
3. note;
4. progressi;
5. attività recente;
6. riepilogo.

### Fase 6 — Rimozione sicura e permessi

Sottofasi:

1. rimozione materiale;
2. impatto;
3. rimozione corso;
4. due modalità;
5. ruoli;
6. realtime simulato;
7. accessibilità dialoghi.

### Fase 7 — Timer, Presence e chiamate audio

Sottofasi:

1. timer server-semantico;
2. cronologia sessioni;
3. stati partecipanti;
4. preferenza Presence;
5. chiamate e inviti;
6. suoneria, mute e volume;
7. minimizzazione.

### Fase 8 — Impostazioni, account e autenticazione

Sottofasi:

1. preferenze stanza;
2. preferenze linguistiche;
3. privacy;
4. export progressi;
5. eliminazione account;
6. login/register/logout;
7. redirect e sessione scaduta.

### Fase 9 — Python Project

Sottofasi:

1. editor;
2. runner;
3. output/errori;
4. bozza;
5. consegna;
6. rubrica e completamento;
7. Eve contestuale.

### Fase 10 — Parità completa

- audit desktop;
- audit mobile;
- tastiera e focus;
- riduzione movimento;
- nessuna regressione chat/Eve;
- confronto con `main` aggiornato;
- aggiornamento di architettura, changelog, README e stato integrazione.

---

## 6. Procedura obbligatoria per ogni pezzo

Per ogni sottofase:

1. leggere la funzione corrispondente in `main`;
2. elencare tutti gli stati utente;
3. verificare se la demo ha già una versione migliore;
4. scegliere `demo`, `app` o `ibrida`;
5. modificare esclusivamente la sezione necessaria del file canonico;
6. non eliminare comportamenti precedenti;
7. aggiungere dati mock deterministici;
8. testare desktop e mobile;
9. verificare sintassi JavaScript;
10. verificare assenza di ID duplicati;
11. aggiornare `CHANGELOG_DEMO.md`;
12. aggiornare hash e Git blob SHA nel `README.md`;
13. aggiornare `INTEGRATION_STATUS.md`;
14. creare un commit descrittivo su `demo-canonica`.

---

## 7. Criterio di completamento di una fase

Una fase è completa soltanto quando:

- tutti gli stati principali dell'app ufficiale sono rappresentati;
- gli errori e gli stati vuoti sono presenti;
- la funzione è raggiungibile dalla navigazione;
- la funzione non rompe Eve, chat, audio o responsive;
- la demo resta utilizzabile senza backend;
- la UI non afferma che un servizio esterno sia stato realmente chiamato;
- la documentazione e gli hash sono aggiornati;
- Codex può identificare chiaramente il delta da trasferire nell'app ufficiale.

---

## 8. Primo lavoro autorizzato

Il primo modulo da integrare è:

> **Fase 1 — Catalogo intelligente**

Motivo:

- è una funzione già operativa in `main`;
- è quasi assente dalla demo canonica;
- è separata dall'aula e riduce il rischio di regressione;
- prepara i flussi successivi di materiali, corsi e checklist;
- permette di stabilire il metodo di confronto app → demo su un modulo completo.

Prima modifica prevista:

- sostituire l'attuale Catalogo semplificato della demo con una vista completa nello stile Futuristica Focus;
- preservare presentazione, dashboard, aula, Eve, chat e tutte le funzioni attuali;
- aggiungere ricerca, filtri, argomenti, schede materiali, percorso Eve, aggiunta URL e importazione simulata.

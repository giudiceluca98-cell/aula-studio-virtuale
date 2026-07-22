# Stato integrazione demo → applicazione ufficiale

Questo file separa chiaramente:

- funzionalità presenti nella demo canonica;
- funzionalità già integrate nell'app reale;
- funzionalità che richiedono verifica di parità.

Uno stato "presente" non significa automaticamente "identico alla demo".

Legenda:

- ✅ Integrato e verificato
- 🟡 Integrato, parità demo da verificare
- 🔵 Presente solo nella demo canonica
- ⚪ Da implementare

---

# Stato generale

Ultimo aggiornamento: 2026-07-22

Fonte riferimento:

`reference/demo-aula-studio-virtuale-canonica.html`

Documentazione:

- `CHANGELOG_DEMO.md`
- `DEMO_ARCHITECTURE.md`

---

# Aula e layout

## Layout aula a tre colonne

Stato: 🟡

Note:

- integrato nell'app reale tramite allineamento dell'aula alla demo;
- verificare ad ogni modifica futura che colonne, spaziature e responsive restino equivalenti.

Riferimento:

PR #57 — Allinea l’aula e il pannello Eve alla demo ufficiale.

---

# Eve

## Pannello Eve principale

Stato: 🟡

Integrato:

- pannello;
- minimizzazione;
- mascotte riapribile;
- scorrimento indipendente;
- configurazioni vocali.

Da verificare:

- comportamento grafico identico alla demo dopo nuove modifiche.

## Audio lezione Eve

Stato: 🟡

Integrato:

- scelta voce;
- velocità;
- modalità lettura;
- avanzamento;
- sincronizzazione testo;
- classificazione importanza.

Da verificare:

- corrispondenza completa dei colori e animazioni.

## Eve negli esercizi

Stato: 🟡

Integrato:

- lettura consegna;
- lettura testo selezionato;
- suggerimenti;
- gestione completamento.

Da verificare:

- flusso completo soluzione dopo completamento.

---

# Centro messaggi

Stato: 🟡

Integrato:

- lobby generale;
- chat private;
- gruppi;
- allegati;
- non letti;
- Realtime e Storage.

Da verificare:

- comportamento identico alla demo per finestre compresse e trascinamento.

Riferimento:

PR #43 — Aggiunge Futuristica Focus, centro messaggi ed Eve vocale.

---

# Progressi e missioni

Stato: 🟡

Integrato parzialmente:

- progressi lezione;
- stato completamento;
- pannelli dedicati.

Da verificare:

- barra orizzontale missioni della demo;
- comportamento icona mostra missioni;
- riduzione a icona.

---

# Moduli e lezioni

Stato: 🟡

Integrato:

- workspace lezioni;
- navigazione sezioni;
- contenuti ufficiali.

Da verificare:

- layout pannelli laterali rispetto alla demo canonica.

---

# Chat flottanti

Stato: 🟡

Integrato:

- minimizzazione;
- persistenza posizione;
- trascinamento tramite pointer events.

Da verificare:

- esperienza esatta stile Facebook Chat della demo.

---

# Cursore personalizzato

Stato: 🔵

Presente nella demo canonica.

Da integrare nell'app ufficiale solo dopo aver verificato accessibilità e compatibilità.

---


# Catalogo intelligente

## Vista, navigazione, ricerca e percorso locale

Stato: 🟡 — checkpoint HTML in attesa di approvazione

Integrato nella demo canonica 1.1.0-alpha.1:

- route autonoma `#catalog`;
- navigazione Dashboard ↔ Catalogo e Aula → Catalogo;
- ricerca e filtri;
- argomenti rapidi;
- materiali salvati;
- selezione del percorso;
- interpretazione deterministica di Eve;
- importazione simulata idempotente;
- responsive e stato vuoto.

Da verificare manualmente:

- resa visuale desktop e mobile;
- navigazione avanti/indietro del browser;
- filtri combinati;
- salvataggio e selezione;
- doppia importazione senza duplicati.

---


## Aggiunta manuale URL HTTPS

Stato: 🟡 — checkpoint HTML 1.1.0-alpha.2 in attesa di approvazione

Integrato:

- form completo;
- URL HTTPS obbligatorio;
- blocco reti private e formati eseguibili;
- deduplicazione URL;
- materiale personale `da verificare`;
- selezione automatica nel percorso;
- persistenza locale privata della demo;
- apertura esterna sicura;
- dialog accessibile e responsive.

Da verificare manualmente:

- inserimento valido;
- messaggi per URL HTTP, locale ed eseguibile;
- inserimento duplicato;
- permanenza dopo ricaricamento;
- chiusura con Escape e ripristino focus.

---


# Dashboard reale e gestione stanze

## Create e join

Stato: 🟡 — checkpoint HTML 1.2.0-alpha.1 in attesa di approvazione

Integrato nella demo:

- elenco stanze dinamico;
- creazione con validazione;
- generazione codice;
- ingresso tramite invito;
- loading e feedback;
- errori codice corto/errato;
- idempotenza su stanza già presente;
- persistenza locale privata;
- ruolo, presenza sintetica e ultima attività.

Da verificare manualmente:

- creazione valida e duplicata;
- ingresso con `STUDY2026`;
- codice errato;
- permanenza dopo ricaricamento;
- apertura della stanza;
- mobile e tastiera.

---


## Ruoli e presenza Dashboard

Stato: 🟡 — checkpoint HTML 1.2.0-alpha.2 in attesa di approvazione

Integrato:

- ruoli owner/admin/member;
- sei stati presenza;
- attività corrente;
- dispositivo e sessioni multiple;
- ultimo accesso;
- anteprima sulle schede stanza;
- dialog dettagli accessibile;
- indicazione esplicita di simulazione locale.

Da verificare manualmente:

- apertura dettagli delle tre stanze;
- resa dei sei stati;
- conteggi partecipanti/online/sessioni;
- chiusura Escape e ripristino focus;
- creazione di una nuova stanza;
- mobile e tastiera.

---


## Codice invito Dashboard

Stato: 🟡 — checkpoint HTML 1.2.0-alpha.3 in attesa di approvazione

Integrato:

- copia codice con fallback locale;
- permesso owner-only per rotazione;
- conferma revoca;
- nuovo codice deterministico per revisione;
- invalidazione del codice precedente;
- persistenza revisione e timestamp;
- dialog accessibile e responsive;
- riconoscimento join di stanza già presente.

Da verificare manualmente:

- copia codice;
- rotazione su stanza proprietaria;
- impossibilità di rotazione su stanza partecipata;
- cambio immediato del codice sulla scheda;
- permanenza dopo ricaricamento;
- vecchio codice non riconosciuto;
- Escape, focus e mobile.

---


## Uscita e cancellazione Dashboard

Stato: 🟡 — checkpoint HTML 1.2.0-alpha.4 in attesa di approvazione

Integrato:

- uscita per owner/admin/member;
- trasferimento proprietà simulato;
- archiviazione stanza senza altri membri;
- cancellazione owner-only;
- conferma testuale distruttiva;
- fasi di cancellazione sicura;
- persistenza corretta dello stato vuoto;
- dialog accessibile e responsive.

Da verificare manualmente:

- uscita da stanza partecipata;
- uscita owner con nuovo proprietario;
- cancellazione owner-only;
- frase errata e corretta;
- permanenza della rimozione dopo refresh;
- creazione nuova stanza dopo Dashboard vuota;
- Escape, focus e mobile.

---


## Collegamento Dashboard Catalogo

Stato: 🟡 — checkpoint HTML 1.2.0-alpha.5 in attesa di approvazione

Integrato:

- Catalogo come CTA principale Dashboard;
- scelta stanza prima dell'apertura;
- accesso Catalogo da ogni stanza;
- contesto stanza visibile e modificabile;
- importazione disabilitata senza stanza;
- idempotenza separata per stanza;
- persistenza locale della destinazione;
- accesso contestuale dall'Aula.

Da verificare manualmente:

- selezione stanza nel banner;
- pulsante Catalogo su ogni scheda;
- cambio stanza nel Catalogo;
- importazione in due stanze diverse;
- seconda importazione idempotente;
- esplorazione senza stanza;
- persistenza dopo refresh;
- mobile e tastiera.

---


## Stati di errore Dashboard

Stato: 🟡 — checkpoint HTML 1.2.0-alpha.6 in attesa di approvazione

Integrato:

- caricamento iniziale accessibile;
- codice errato/revocato;
- stanza archiviata;
- accesso non autorizzato;
- errore temporaneo;
- retry idempotente;
- fallback storage;
- feedback e focus accessibili.

Codici demo:

- `ARCHIVIATA26`;
- `NEGATO2026`;
- `OFFLINE2026`.

Da verificare manualmente:

- scheletri al primo ingresso;
- messaggio per codice generico errato;
- tre codici demo;
- secondo tentativo riuscito;
- nessun duplicato dopo un altro retry;
- chiusura degli avvisi;
- create/join normali dopo gli errori;
- mobile e tastiera.

---


## Pannello Materiali e workspace

Stato: 🟡 — checkpoint HTML 1.3.0-alpha.1 in attesa di approvazione

Integrato:

- drawer Materiali dinamico;
- ricerca e filtri;
- corso, formato e accesso;
- monitorabilità;
- avanzamento;
- materiale selezionato persistente;
- apertura nel workspace;
- distinzione onesta tra viewer pronto e sottofase futura.

Da verificare manualmente:

- apertura drawer Materiali;
- ricerca;
- filtri corso/formato;
- selezione persistente;
- apertura lezione nativa;
- apertura anteprima PDF/DOCX/PPTX;
- risorsa esterna non monitorabile;
- ritorno alla lezione;
- mobile e tastiera.

---


## Materiali: upload e collegamenti

Stato: 🟢 — completato automaticamente nell'autorizzazione Fase 3

Versione: `1.3.0-alpha.2`

- upload locale simulato e collegamenti HTTPS con validazione;
- HTML canonico aggiornato;
- copia scaricabile: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-1.3.0-alpha.2.html`;
- controlli statici e sintattici eseguiti dal workflow.

---

# Regola per Codex

Prima di modificare una funzione:

1. controllare questo file;
2. controllare `DEMO_ARCHITECTURE.md`;
3. controllare `CHANGELOG_DEMO.md`;
4. modificare il componente reale corretto;
5. aggiornare questo registro.

Mai sostituire una funzione reale backend con una simulazione demo.

---

# Prossimi controlli consigliati

1. confronto visivo completo demo/app;
2. verifica Eve completa;
3. verifica chat completa;
4. aggiornamento stato a ✅ solo dopo test manuale.


## Materiali: tipi e classificazione

Stato: 🟢 — checkpoint prodotto

Versione: `1.3.0-alpha.3`

- tassonomia allineata a `src/lib/material-access.ts`;
- classificazione visibile nel pannello e nel workspace;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-1.3.0-alpha.3.html`;
- verifica statica e sintattica affidata al workflow dedicato.


## Materiali: viewer PDF

Stato: 🟢 — checkpoint prodotto

Versione: `1.3.0-alpha.4`

- viewer locale a pagine con navigazione e percentuale;
- avanzamento aggiornato nella sessione;
- nessun iframe o caricamento remoto;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-1.3.0-alpha.4.html`.


## Materiali: DOCX e PPTX

Stato: 🟢 — checkpoint prodotto

Versione: `1.3.0-alpha.5`

- documento DOCX come sezioni di testo sicuro;
- presentazione PPTX come slide testuali navigabili;
- fallback trasparente per file manuali non realmente analizzati;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-1.3.0-alpha.5.html`.

# Changelog demo canonica

Questo file registra tutte le modifiche apportate alla demo ufficiale di **Aula Studio Virtuale** nel branch `demo-canonica`.

La fonte eseguibile resta:

`reference/demo-aula-studio-virtuale-canonica.html`

## Regole di aggiornamento

Per ogni modifica futura:

1. aggiornare il file HTML canonico;
2. aggiungere una voce in cima a questo changelog;
3. indicare chiaramente cosa è stato aggiunto, modificato, corretto o rimosso;
4. registrare il nuovo SHA-256 e il nuovo Git blob SHA nel `README.md`;
5. non eliminare le versioni precedenti dal changelog;
6. distinguere sempre le modifiche della demo da quelle già trasferite nell'app ufficiale.

---

## [Non rilasciato]

### Aggiunto

- Nessuna modifica in attesa.

### Modificato

- Nessuna modifica in attesa.

### Corretto

- Nessuna modifica in attesa.

### Rimosso

- Nessuna modifica in attesa.

---

## [1.2.0-alpha.5] — 2026-07-22

### Dashboard — collegamento contestuale al Catalogo

- Trasformato il banner Catalogo in un ingresso principale con scelta della stanza.
- Aggiunto il pulsante `Catalogo` su ogni scheda stanza.
- Aggiunto il contesto stanza nell'header del Catalogo.
- Aggiunto cambio destinazione direttamente dal Catalogo.
- Il pulsante importazione mostra la stanza selezionata.
- L'importazione idempotente è ora separata per stanza.
- Aggiunta modalità esplorazione senza stanza, con importazione disabilitata e messaggio esplicito.
- Il Catalogo aperto dall'Aula conserva il contesto della stanza Python.
- Conservati create/join, presenza, inviti, gestione stanza, Eve, chat e audio.

### Identificatori

- Dimensione: `584031` byte
- Righe: `17256`
- SHA-256: `dd73c77c783d7c703cdefd0989f0315cf32392cf23c227bcd70859925e14667f`
- Git blob SHA: `37577e51e6e1e57d88c208761c69b435d6cd4207`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.2.0-alpha.4] — 2026-07-22

### Dashboard — uscita e cancellazione stanza

- Aggiunto il comando `Gestisci` su ogni stanza.
- Aggiunta uscita con conferma e chiusura della presenza/membership simulata.
- Per il proprietario viene mostrato il passaggio di proprietà ad admin o partecipante.
- Se il proprietario è solo, l'uscita archivia la stanza e revoca l'invito nella rappresentazione demo.
- Aggiunta cancellazione completa owner-only con frase `ELIMINA STANZA`.
- Aggiunte fasi visibili: blocco accessi, pulizia file, eliminazione dati condivisi.
- Corretto il caricamento locale: una Dashboard volutamente vuota resta vuota dopo il refresh.
- Aggiunti Escape, backdrop, ripristino focus e responsive.
- Conservati create/join, presenza, inviti, Catalogo, Aula, Eve, chat e audio.

### Identificatori

- Dimensione: `571517` byte
- Righe: `16899`
- SHA-256: `b6671183a838d7a7a85cfe7ab9934982bdc36177cdaf1ee4856574ed520fe392`
- Git blob SHA: `dcbdc41a7b0e1db3b9c9fefc3050e1ed72368432`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.2.0-alpha.3] — 2026-07-22

### Dashboard — codice invito

- Aggiunto il pulsante `Invito` su ogni scheda stanza.
- Aggiunto un dialog accessibile per copiare il codice attivo.
- Aggiunto fallback di copia per il file HTML aperto fuori da un contesto HTTPS.
- Aggiunta revoca e rigenerazione riservata al proprietario.
- Aggiunta conferma esplicita prima della revoca.
- Il codice precedente smette di corrispondere alla stanza dopo la rotazione.
- Aggiunti revisione, data dell'ultima rigenerazione e persistenza locale.
- Aggiunto controllo join per riconoscere una stanza già presente tramite il codice attuale.
- Conservati create/join, presenza, Catalogo, Aula, Eve, chat e audio.

### Identificatori

- Dimensione: `546698` byte
- Righe: `16253`
- SHA-256: `4f1f174f800c87ffa59ed2d8f40b4344549e2382ed996100c8b9ce68afa1c66a`
- Git blob SHA: `f9050783bd7d559adf66fb8c39ffb1fe54b73e5b`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.2.0-alpha.2] — 2026-07-22

### Dashboard — ruoli e presenza

- Aggiunti i ruoli proprietario, amministratore e partecipante.
- Aggiunti stati online, studio, pausa, assente, chiamata e offline.
- Aggiunta anteprima partecipanti su ogni scheda stanza.
- Aggiunto pannello dettagli con attività corrente, dispositivo, sessioni e ultimo accesso.
- Aggiunto conteggio separato di partecipanti, utenti online e sessioni attive.
- Aggiunti chiusura con Escape, click sullo sfondo e ripristino del focus.
- Corretto il testo `Supabase collegato`: la demo dichiara ora esplicitamente che la presenza è locale e simulata.
- Conservati create/join, Catalogo, Aula, Eve, chat e audio.

### Identificatori

- Dimensione: `526559` byte
- Righe: `15656`
- SHA-256: `a0597eed70fc26fc8c57419c403428fbebf79a29d6a67de674805b7436ab40b7`
- Git blob SHA: `6f086d95e76cce2da458c026754611927c50dd2e`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.2.0-alpha.1] — 2026-07-22

### Dashboard — creazione e ingresso stanza

- Sostituita la stanza statica con un elenco renderizzato da stato demo.
- Aggiunta creazione stanza con validazione 3–60 caratteri, duplicati e caricamento.
- Aggiunta generazione del codice invito e persistenza locale privata.
- Aggiunto ingresso tramite codici demo `STUDY2026` e `MATEMATICA24`.
- Aggiunti errori per codice corto, errato e stanza già presente.
- Aggiunti ruolo, partecipanti online e ultima attività nelle schede stanza.
- Aggiunto invio dei form con Enter e feedback accessibili.
- Conservato il collegamento principale al Catalogo approvato.

### Identificatori

- Dimensione: `505707` byte
- Righe: `15085`
- SHA-256: `47c2b54336bb84ec52fd5e1a2bed2cefe171c2af0fb7a17e2e46515d09e0db16`
- Git blob SHA: `b5c9881525ae32f71bc0a7243236642d5e190312`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.1.0-alpha.2] — 2026-07-22

### Catalogo — aggiunta manuale di materiali

- Aggiunto il pulsante `Aggiungi materiale` nella vista Catalogo.
- Aggiunto un dialog accessibile con titolo, URL HTTPS, tipo, lingua, fonte e descrizione.
- Aggiunta validazione contro URL non HTTPS, reti locali/private e comuni formati eseguibili.
- Aggiunta deduplicazione per URL normalizzato.
- Le risorse personali vengono marcate `da verificare`, salvate e selezionate automaticamente.
- Aggiunta persistenza locale privata della demo tramite `localStorage`.
- Aggiunto collegamento esterno sicuro con `noopener noreferrer`.
- Aggiunti chiusura con `Escape`, click sullo sfondo e ripristino del focus.
- Aggiunto layout mobile del dialog.

### Identificatori

- Dimensione: `490224` byte
- Righe: `14678`
- SHA-256: `9e7ae793062922540d8991eeed96021134507c02bb4d0fa6892f215c6d178cac`
- Git blob SHA: `2e9b628ccb691545d73cf46894f359572930200a`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.1.0-alpha.1] — 2026-07-22

### Catalogo intelligente — vista, ricerca e percorso

- Aggiunta una route `#catalog` completa nello stesso HTML canonico.
- Collegati Dashboard e pulsante Catalogo dell'Aula alla nuova vista.
- Aggiunti ricerca locale, filtri per livello/formato/lingua e filtro fonti verificate.
- Aggiunti otto materiali demo deterministici con monitorabilità e provenienza.
- Aggiunti materiali salvati, selezione per il percorso e rimozione dal percorso.
- Aggiunta interpretazione locale di Eve senza chiamate OpenAI.
- Aggiunta importazione simulata idempotente nella stanza Python.
- Aggiunti responsive mobile, pulsante Scrivania sempre visibile, focus nativo e rispetto di `prefers-reduced-motion`.

### Identificatori

- Dimensione: `471894` byte
- Righe: `14177`
- SHA-256: `fe15bb3424c0243bfb86fc2858a32477531061e1b9109745e19d2ab54e7284fd`
- Git blob SHA: `a78322051cb80af1e7f79c71fbb59c1c75d653c8`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.0.0] — 2026-07-22

### Importazione iniziale verificata

- Importata nel repository la demo canonica completa.
- Stabilito il branch `demo-canonica` come fonte visiva e funzionale ufficiale.
- Registrato il file `reference/demo-aula-studio-virtuale-canonica.html`.
- Verificata l'identità byte per byte con la versione locale approvata.

### Funzioni presenti nella versione canonica

- Portale di presentazione, dashboard e aula nello stesso file.
- Tema Futuristica Focus con area di lettura chiara e interfaccia esterna scura.
- Navigazione tra moduli, lezioni, esercizi, quiz, progetto e glossario.
- Pannello progressi e missioni comprimibile.
- Sidebar dei moduli comprimibile.
- Eve animata, contestuale e sempre visibile.
- Eve Voice con selezione compatta delle pagine, velocità, voce, anteprima, pausa e stop.
- Visualizzatore di frequenza e colori sincronizzati con la lettura.
- Lettura del testo selezionato negli esercizi.
- Guida vocale degli esercizi e lettura automatica delle soluzioni al completamento.
- Centro messaggi con lobby generale permanente.
- Chat private e di gruppo.
- Ricerca, filtri, badge dei non letti, allegati locali ed emoji.
- Chat minimizzabili in basso a destra in stile Facebook Chat.
- Correzione del trascinamento della finestra chat fuori dall'intestazione.
- Timer flottante, modali, drawer e preferenze persistenti.
- Cursore personalizzato a sfera con animazione di pressione e rilascio.
- Supporto responsive e `prefers-reduced-motion`.

### Identificatori

- Dimensione: `436216` byte
- Righe: `13145`
- SHA-256: `4727ddde31f968c5ecf9c931b303579c7ba27b2850f0fd407fc0ae72f8b4485a`
- Git blob SHA: `8beb580fbf16f87bbb9aaaef6c616067d12f259a`

### Stato integrazione app ufficiale

La presenza di una funzione in questo changelog non garantisce che sia già stata trasferita completamente nell'app Next.js. Codex deve confrontare la demo canonica con `main`, integrare una funzione per volta e verificare parità visiva, funzionale e responsive prima di dichiararla completata.

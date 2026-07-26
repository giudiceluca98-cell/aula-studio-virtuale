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

## [1.4.0-alpha.1-eve.1] — 2026-07-26

### Eve Animation Library 1.2.2

- Integrati esattamente 64 asset ufficiali: P0 `12`, P1 `21`, P2 `20`, compact `8`, hero `3`.
- Aggiunto un unico adapter pubblico `window.setEveAppState` e collegati gli stati Eve a chat, materiali, esercizi, quiz, checklist, progressi, timer, catalogo e dashboard.
- Aggiunti stage principale, avatar compact e floating, inspector accessibile con ricerca, filtri, replay e ritorno a idle.
- Incorporati i WebP finali come data URI; P0 è preriscaldato, gli altri gruppi vengono decodificati su richiesta.
- Aggiunto il fallback statico ufficiale per `prefers-reduced-motion` e per il controllo manuale dell'inspector.
- Corretto il layout mobile a 390 px senza overflow orizzontale.
- Conservata l'esecuzione autonoma senza fetch, CDN o dipendenze remote.

### Identificatori

- Dimensione: `18132481` byte
- Righe logiche: `21612`
- SHA-256: `07ab2db5da4015bb085f3f4b16e31a6c85f4356ca688945b47b0c8029a145ced`
- Git blob SHA: `ba94c24615b62d97a05455114e56a80b8afd0dbb`
- Checkpoint: `reference/checkpoints/eve/demo-aula-studio-virtuale-1.4.0-alpha.1-eve.1.html`

### Stato

`IN_ATTESA_VERIFICA_UTENTE`. Nessuna pull request o merge è stato creato.

---

## [1.3.0-alpha.9] — 2026-07-23

### Materiali: errori e alternative

- Stato dedicato per formato ZIP non supportato.
- Stato materiale non disponibile con progresso e cronologia conservati.
- Errore temporaneo recuperabile al secondo tentativo.
- Il retry trasforma lo stesso materiale in documento interno e non crea duplicati.
- Progresso e dati locali precedenti vengono mantenuti durante il recupero.
- Tracking interrotto durante le schermate di errore e riavviato soltanto dopo l’apertura del viewer recuperato.
- Alternative limitate a materiali interni con viewer sicuro.
- Nessun file non supportato viene eseguito o aperto esternamente.

### Identificatori

- Dimensione: `727961` byte
- Righe: `19865`
- SHA-256: `957ae6c18adf653dbcfa7bafeab33e57fb49a87a210717584a555b9abb534318`
- Git blob SHA: `e0a11bec94aa876c36789430842f498ee97d4e03`

---

## [1.3.0-alpha.8] — 2026-07-23

### Materiali: tracking e ripresa

- Salvataggio locale separato per ogni materiale.
- Posizione PDF, slide, video e scroll dei documenti ripristinata dopo l’apertura del viewer.
- Intervalli video realmente visti conservati insieme alla posizione temporale.
- Tempo attivo conteggiato soltanto con scheda visibile e interazione recente, oppure durante la riproduzione video.
- Autosalvataggio ogni cinque secondi attivi e dopo i cambi di posizione.
- Cronologia locale degli eventi aperto, ripreso, chiuso e posizione salvata.
- Banner visibile con stato, ultima posizione e minuti attivi.
- Gli stati `import-required` non vengono conteggiati come consultazione del materiale.

### Identificatori

- Dimensione: `714395` byte
- Righe: `19627`
- SHA-256: `4c08e2c1736bd40d9fc0d971668663487cf5c878a1631d12c53fac19533b1f8f`
- Git blob SHA: `74b81f90f32336c7ac9058c180e3ff0fc8fe2b4d`

---

## [1.3.0-alpha.7] — 2026-07-23

### Materiali: import-required

- Aggiunti una pagina web HTTPS e un PDF remoto che richiedono importazione.
- Flusso visuale in tre passaggi: verifica sorgente, copia protetta, classificazione e monitorabilità.
- Nessun contenuto remoto viene scaricato dalla demo.
- Gli ID importati vengono conservati localmente nel browser.
- Dopo l’importazione la pagina web diventa documento interno e il PDF diventa PDF interno.
- La seconda richiesta riutilizza la copia già presente e non crea duplicati.
- Stato e messaggi dichiarano esplicitamente il carattere simulato dell’operazione.

### Identificatori

- Dimensione: `699358` byte
- Righe: `19340`
- SHA-256: `dcd007394aece2c5dde6a134fd7744e5d38ca422d83062ad59664920970cafdb`
- Git blob SHA: `b68bdaa1e5d06e69e1fef7e1c4416156cf9f5af8`

---

## [1.3.0-alpha.6] — 2026-07-23

### Materiali: video

- Materiali dimostrativi per YouTube, Vimeo e video MP4 HTTPS.
- Player locale simulato con riproduzione, pausa, seek e controlli da tastiera.
- Nessun iframe, download o incorporamento remoto nella demo canonica.
- Copertura calcolata sugli intervalli unici realmente riprodotti.
- Gli spostamenti con il cursore non vengono conteggiati come tempo visto.
- Completamento attribuito soltanto dopo almeno il 90% di copertura.
- Pausa automatica quando la scheda del browser diventa nascosta.

### Identificatori

- Dimensione: `686506` byte
- Righe: `19117`
- SHA-256: `35f4ca7cb7b9d302f1f8d2850be08b1457aa3fbf69ac34a9bcb600f15dae1d1f`
- Git blob SHA: `4d1c3b88b51cdead868ab228f06efbb264d918ac`

---

## [1.3.0-alpha.5] — 2026-07-23

### Materiali: DOCX e PPTX

- DOCX rappresentato come documento testuale strutturato e sicuro.
- PPTX rappresentato come sequenza di slide testuali navigabili.
- Contenuti demo specifici per i materiali predefiniti e fallback dichiarato per i file caricati manualmente.
- Nessuna macro, animazione, immagine incorporata o contenuto eseguibile viene avviato.
- Navigazione slide con pulsanti e frecce della tastiera.
- Percentuale e avanzamento aggiornati per le presentazioni.
- Attivazione esclusiva per materiali interni classificati `document` o `presentation`.

### Identificatori

- Dimensione: `672684` byte
- Righe: `18874`
- SHA-256: `7059b095d76e0e56983fcdabfc721f48ff5a75bd84f49751ca3ddb9d6b9046d7`
- Git blob SHA: `0b6e15a09c4d3ec7065734fd859952071a805080`

---

## [1.3.0-alpha.4] — 2026-07-23

### Materiali: viewer PDF

- Viewer PDF locale e deterministico senza iframe o richieste remote.
- Navigazione pagina precedente/successiva e scorciatoie freccia sinistra/destra.
- Percentuale, progressbar accessibile e aggiornamento dell’avanzamento del materiale.
- Ripresa iniziale derivata dal progresso corrente della sessione.
- Attivazione esclusiva per PDF classificati `internal`; i PDF remoti restano `import-required`.
- Rispetto di `prefers-reduced-motion` durante lo spostamento fra pagine.

### Identificatori

- Dimensione: `659450` byte
- Righe: `18710`
- SHA-256: `00047a9696e596da120da0e6b7a01f9fac74b5a874167bc89715aceaf24d2d02`
- Git blob SHA: `7e71848ab8b5fc2e1e04b03154786d43c30d82ff`

---

## [1.3.0-alpha.3] — 2026-07-23

### Materiali: tipi e classificazione

- Tassonomia coerente con `src/lib/material-access.ts`.
- Access mode, viewer previsto, provider e import status visibili in ogni scheda.
- Monitoraggio distinto fra completo, parziale, solo apertura e non monitorabile.
- Classificazione inferita per materiali interni, video incorporabili, pagine da importare e formati non supportati.
- I valori espliciti hanno precedenza soltanto quando `explicitClassification` è dichiarato.
- Python Tutor classificato come risorsa esterna con sola apertura.

### Identificatori

- Dimensione: `649900` byte
- Righe: `18601`
- SHA-256: `a70215459d7919a020b673d9285574f8017e8098c5ccf74355e0fcf74bf0413a`
- Git blob SHA: `4a69dd1df5134bfdeba57f91d350156d4a1062b7`

---

## [1.3.0-alpha.2] — 2026-07-22

### Materiali: upload e collegamenti

- Dialog accessibile per collegamento HTTPS o file locale.
- Validazione URL pubblico e blocco indirizzi locali.
- Limite file 10 MB e formati PDF/TXT/MD/DOC/DOCX/PPT/PPTX.
- Generazione di un nome file sicuro e salvataggio dei soli metadati locali.
- Nuovo materiale immediatamente disponibile nel drawer.

### Identificatori

- Dimensione: `639741` byte
- Righe: `18474`
- SHA-256: `41d16b4dc64f6d86bafff282620228866f05459928c5ebda8506834839c43628`
- Git blob SHA: `31dcbe51fa53adabf16f339d3738268de9706fbe`

### Stato

Checkpoint HTML completo prodotto durante l'autorizzazione dell'utente a completare l'intera Fase 3.

---

## [1.3.0-alpha.1] — 2026-07-22

### Materiali e workspace — pannello Materiali

- Sostituito il contenuto statico del drawer Materiali con un selettore realistico.
- Aggiunti ricerca, filtro corso e filtro formato.
- Aggiunte schede con formato, corso, accesso, monitorabilità e avanzamento.
- Aggiunta selezione persistente del materiale.
- Aggiunta apertura nel workspace centrale.
- La lezione nativa conserva il lettore completo già approvato.
- I viewer TXT/PDF/DOCX/PPTX sono rappresentati onestamente come sottofasi successive, senza simulare servizi già operativi.
- Le risorse esterne sono dichiarate non monitorabili.
- Conservati Dashboard, Catalogo, Eve, audio, esercizi, chat e responsive.

### Identificatori

- Dimensione: `624620` byte
- Righe: `18408`
- SHA-256: `a9cca058bf0029e71c4d53273da80c61057f12d579a355f0cdf191addfcaa6c6`
- Git blob SHA: `3966405bb650a357a684ba330f3846b6bc66de81`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

---

## [1.2.0-alpha.6] — 2026-07-22

### Dashboard — stati di errore e recupero

- Aggiunto caricamento iniziale con schede scheletro e `aria-busy`.
- Aggiunto stato dedicato per codice errato o revocato.
- Aggiunto stato stanza archiviata tramite codice demo `ARCHIVIATA26`.
- Aggiunto accesso non autorizzato tramite codice demo `NEGATO2026`.
- Aggiunto errore temporaneo recuperabile tramite `OFFLINE2026`.
- Il pulsante `Riprova accesso` completa il secondo tentativo senza duplicare la stanza.
- Aggiunto ripristino sicuro quando il salvataggio locale è illeggibile o bloccato.
- Aggiunti annunci accessibili, focus controllato e responsive.
- Conservati create/join, presenza, inviti, gestione stanza, Catalogo, Aula, Eve, chat e audio.

### Identificatori

- Dimensione: `600685` byte
- Righe: `17700`
- SHA-256: `5a6f42d2182bce875063c7adac32c30335bd9086da6a9b6d689d1b9f67ab9225`
- Git blob SHA: `34f2dc43927fb684b76d488a7b3a4756f293a14d`

### Stato

Checkpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.

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

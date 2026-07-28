# Eve AI Studio — sorgente canonica e coordinamento

Questa procedura è obbligatoria per ogni modifica a Eve AI Studio. In caso di conflitto con documenti storici, prevale questo file insieme alla sezione Eve AI Studio di `AGENTS.md`.

## Fonte unica

- Repository: `giudiceluca98-cell/aula-studio-virtuale`
- Branch canonico: `eve-ai-studio`
- Cartella canonica: `reference/eve-ai-studio-preview/`
- Punto di ingresso unico: `reference/eve-ai-studio-preview/index.html`

La stessa sorgente modulare alimenta sviluppo, anteprima locale, test, versione desktop, pubblicazione degli aggiornamenti e aggiornamento dell'app installata.

Non sono ammesse:

- demo alternative;
- copie HTML;
- file standalone;
- nuove cartelle preview;
- interfacce duplicate;
- rinomina della sorgente canonica;
- ripristino di `EVE_AI_STUDIO_STANDALONE.html`;
- un secondo sistema desktop o di aggiornamento;
- pubblicazione diretta in produzione;
- modifiche a `main`, `demo-canonica` o Aula Studio;
- merge senza approvazione esplicita.

I riferimenti a preview o standalone contenuti nei checkpoint storici sono soltanto testimonianze del vecchio flusso e non autorizzano a ricrearli.

## Avvio di un'attività

1. Eseguire `git fetch origin --prune`.
2. Leggere `AGENTS.md`, `CODEX_COORDINATION.md`, questa procedura e gli handoff pertinenti.
3. Controllare commit recenti, branch e Pull Request aperte, attività, checkpoint e prenotazioni.
4. Partire dall'ultima `origin/eve-ai-studio`.
5. Creare un branch `codex/eve-ai-studio-<funzione>`.
6. Registrare in `CODEX_COORDINATION.md`, prima delle modifiche:
   - checkpoint e funzione;
   - responsabile e ruolo;
   - branch;
   - file esatti;
   - file condivisi richiesti;
   - stato iniziale.
7. Confermare che non verranno create demo, standalone o sorgenti duplicate e che `main`, `demo-canonica` e Aula Studio resteranno invariati.

## Struttura del codice

- Modificare direttamente i moduli nella cartella canonica.
- Conservare `index.html` come unico ingresso.
- Preferire un modulo JavaScript descrittivo a nuova logica inserita in `app.js`.
- Preferire un CSS dedicato a modifiche estese di `styles.css`.
- Separare HTML, JavaScript, CSS, asset, configurazioni, servizi, backend e test.
- Collegare un nuovo modulo a `index.html` soltanto dopo averlo verificato e aver prenotato il file.
- Trasformare le specifiche plain text in dati o moduli strutturati; non usarle per generare un nuovo HTML completo.

## Ordine tra i due Codex

Il lavoro sullo stesso checkpoint è sequenziale.

### Codex funzionale

Sviluppa prima:

- logiche applicative;
- servizi, backend e API;
- persistenza e database;
- sicurezza, validazione e gestione degli errori;
- contratti dati;
- moduli funzionali;
- test e documentazione tecnica.

Completa implementazione, test specifici e cumulativi, documentazione, Pull Request e passaggio di consegne. Non torna sui file congelati salvo bug documentato o riapertura esplicita.

### Codex grafico e desktop

Inizia soltanto dopo `READY_FOR_HANDOFF` e, dopo l'approvazione e il merge funzionale, riparte dalla nuova `origin/eve-ai-studio`.

Può occuparsi di:

- grafica, layout e organizzazione dell'interfaccia;
- UX, responsive e accessibilità;
- animazioni e prestazioni grafiche;
- integrazione desktop e aggiornamenti;
- rifinitura, integrazione finale e preparazione della release.

Non modifica logiche funzionali, contratti, sicurezza o test congelati.

## Stati obbligatori

| Stato | Significato |
|---|---|
| `RESERVED` | File o blocco prenotati; l'altro Codex non li modifica. |
| `IN_PROGRESS` | Implementazione in corso; nessun lavoro parallelo sullo stesso blocco. |
| `FUNCTIONAL_TESTING` | Funzione implementata ma test non conclusi; non disponibile. |
| `READY_FOR_HANDOFF` | Parte funzionale testata, commit e file congelati, handoff pubblicato. |
| `UI_INTEGRATION` | Grafica, UX, responsive, accessibilità, desktop o rifinitura in corso. |
| `REVIEW_REQUIRED` | Integrazione terminata e da verificare. |
| `RELEASE_READY` | Parte funzionale e grafica completate e verificate. |

La presenza di un file o il completamento dei test non sostituiscono `READY_FOR_HANDOFF`.

## File condivisi

Prima di modificare uno dei seguenti file, verificarne e registrarne la prenotazione:

```text
reference/eve-ai-studio-preview/index.html
reference/eve-ai-studio-preview/styles.css
reference/eve-ai-studio-preview/app.js
reference/eve-ai-studio-preview/simple-studio-navigation.js
reference/eve-ai-studio-preview/model-rules-workflow.js
reference/eve-ai-studio-preview/model-test-workflow.js
reference/eve-ai-studio-preview/graphics-performance.js
reference/eve-ai-studio-preview/eve-release-workflow.js
```

La prenotazione deve indicare motivo e durata prevista. La modifica va limitata al minimo e la prenotazione va rilasciata dopo il commit.

## Scheda checkpoint

Ogni checkpoint deve avere in `CODEX_COORDINATION.md` una scheda con:

```text
CHECKPOINT:
<nome completo e parole chiave>

RESPONSABILE FUNZIONALE:
<nome o ruolo>

STATO FUNZIONALE:
RESERVED / IN_PROGRESS / FUNCTIONAL_TESTING / READY_FOR_HANDOFF

BRANCH FUNZIONALE:
codex/eve-ai-studio-<funzione>

OBIETTIVO:
<descrizione>

FILE PRENOTATI:
- <file>

FILE CONDIVISI PRENOTATI:
- <file o nessuno>

MODULI NUOVI PREVISTI:
- <modulo o nessuno>

ULTIMO COMMIT FUNZIONALE:
<sha o non ancora disponibile>

DISPONIBILE PER L'ALTRO CODEX:
SÌ / NO

ATTIVITÀ CONSENTITE ALL'ALTRO CODEX:
- <attività o nessuna>

ATTIVITÀ VIETATE ALL'ALTRO CODEX:
- <attività>

NOTE DI INTEGRAZIONE:
<note>
```

Quando lo stato diventa `READY_FOR_HANDOFF`, aggiungere Pull Request, commit congelato, file congelati e file disponibili per l'integrazione grafica.

## Documento HANDOFF

Alla fine del blocco funzionale creare:

```text
CHECKPOINT_<LINEA>_<VERSIONE>_<PAROLE_CHIAVE>_HANDOFF.md
```

Il documento deve contenere:

- checkpoint, obiettivo e stato;
- commit congelato e Pull Request;
- implementazione, API e struttura dati;
- eventi JavaScript, identificatori HTML e hook;
- file modificati, congelati, riservati e disponibili;
- test e risultati;
- limiti di sicurezza;
- modifiche funzionali vietate;
- attività grafiche consentite;
- necessità desktop e note di release;
- conferma dell'assenza di sorgenti duplicate.

## Verifiche e Pull Request

Prima della Pull Request:

1. rieseguire `git fetch origin --prune`;
2. aggiornare il branch dall'ultima `origin/eve-ai-studio`;
3. ricontrollare coordinamento e prenotazioni;
4. risolvere soltanto conflitti della propria attività;
5. eseguire i test pertinenti e la suite cumulativa applicabile;
6. eseguire `node --check` su ogni JavaScript modificato;
7. verificare direttamente la sorgente canonica;
8. aggiornare scheda e, se necessario, handoff;
9. aprire la Pull Request verso `eve-ai-studio`;
10. non effettuare il merge.

## Desktop e aggiornamenti

Il pacchetto installabile deriva esclusivamente dalla sorgente canonica:

```text
eve-ai-studio canonica
→ test
→ approvazione
→ versione numerata
→ GitHub Release
→ notifica nell'app installata
→ download e sostituzione della versione precedente
```

Gli aggiornamenti devono preservare dati utente, configurazioni, preferenze, materiali, progetti, memoria ed eventuali database locali compatibili.

## Dichiarazione finale

Ogni consegna deve indicare:

- checkpoint e stato;
- branch di partenza e di lavoro;
- file modificati, congelati, riservati e disponibili;
- test e risultati;
- commit e Pull Request;
- modifiche desktop necessarie;
- attività consentite e vietate al Codex successivo;
- assenza di demo alternative, standalone e sorgenti duplicate;
- conferma che `main`, `demo-canonica` e Aula Studio non sono stati modificati.


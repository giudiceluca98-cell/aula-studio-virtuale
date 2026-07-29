# HANDOFF — INTELLIGENCE-0.2

## Identità

- Checkpoint: `INTELLIGENCE-0.2 — Acquisizione web controllata e quarantena fonti`
- Linea: `INTELLIGENCE`
- Stato al momento della preparazione: `FUNCTIONAL_TESTING`
- Repository: `giudiceluca98-cell/aula-studio-virtuale`
- Branch canonico letto in sola lettura: `eve-ai-studio`
- Commit canonico osservato: `185c08486d56a684a1b095558ab8860feef8bd43`
- Branch funzionale da usare: `codex/eve-ai-studio-intelligence-0-2-functional`
- Pull Request: `DA CREARE O RIUSARE DOPO IL CONTROLLO DELLE PR APERTE`
- Commit funzionale congelato: `DA COMPILARE DOPO I TEST`

Questa lavorazione non ha eseguito commit, push, PR, merge o altre scritture su GitHub.

## Obiettivo

Rendere realmente disponibile nell'app principale il modulo di acquisizione URL già
presente, mantenendo la rete disattivata per impostazione predefinita e conservando ogni
contenuto come dato esterno non fidato in quarantena.

## Stato trovato nel branch

Già presenti:

- configurazione server-side;
- modelli acquisizione;
- URL guard e trasporto IP-pinned;
- robots.txt;
- redirect, TLS, MIME e limite byte;
- persistenza eventi e documenti;
- servizio applicativo;
- API.

Mancanti o incompleti:

- wiring in `app/main.py`;
- variabili in `.env.example`;
- robots.txt sulla destinazione raggiunta dopo redirect;
- suite specifica;
- handoff e rapporti reali;
- UI di 0.2 senza regressione delle funzioni 0.1.

## Parte funzionale preparata

### File da modificare

- `eve-ai-studio/app/main.py`
- `eve-ai-studio/app/intelligence/web_acquisition.py`
- `eve-ai-studio/.env.example`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_PLAN.md`

### File da creare

- `eve-ai-studio/tests/test_intelligence_acquisition.py`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_UPDATE.txt`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_VERIFICATION.md`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_CI_RESULT.json`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_CI_RESULT.md`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_CLOSURE.md`
- questo unico file `HANDOFF`.

### API interessate

```http
GET  /v1/intelligence/research/status
POST /v1/intelligence/research/projects/{project_id}/sources/{source_id}/acquire
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/acquisitions
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/document
```

### Contratti finali attesi

```text
checkpoint=INTELLIGENCE-0.2
content_acquisition_available=true
content_acquisition_enabled=false   # default
web_search_enabled=false
model_training_enabled=false
human_review_required_by_default=true
```

Documento acquisito:

```text
status=quarantined
content_trust=untrusted_web_content
instructions_executable=false
```

## Sicurezza

- URL solo HTTP/HTTPS;
- nessuna credenziale incorporata;
- porte 80/443;
- blocco reti private, loopback, link-local, multicast, riservate e non globali;
- IP pinning dopo la risoluzione;
- TLS e SNI sul nome originale;
- nessun proxy dell'ambiente;
- redirect limitati e rivalidati;
- blocco HTTPS → HTTP;
- robots.txt fail-closed;
- robots.txt verificato anche sulla destinazione raggiunta tramite redirect;
- timeout e limite byte;
- rifiuto compressione inattesa;
- allowlist MIME testuali;
- SHA-256 dei byte originali;
- nessuna esecuzione di script o istruzioni contenute nel documento;
- nessuna promozione automatica nei materiali CORE.

## Test funzionali richiesti

```bash
python VERIFICA_CHECKPOINT.py --repo <repository> --stage functional --write-reports
```

Devono risultare verdi:

- compileall;
- `test_intelligence_research.py`;
- `test_intelligence_acquisition.py`;
- suite cumulativa;
- probe del wiring di `app.main` con database temporanei;
- status e flag;
- `git diff --check`;
- controllo dei percorsi modificati.

## Passaggio grafico/UX

La parte UI è preparata separatamente e non deve essere applicata prima di
`READY_FOR_HANDOFF` funzionale.

File canonico esistente da modificare, senza crearne copie:

- `reference/eve-ai-studio-preview/research-center-workflow.js`

La modifica UI:

- preserva creazione progetto;
- preserva aggiunta query;
- preserva registrazione fonti;
- aggiunge acquisizione simulata;
- non usa rete;
- mostra flag OFF, SSRF, robots, redirect, limiti e quarantena;
- non modifica `index.html`, `app.js` o `styles.css`;
- non crea HTML o standalone.

Comando dopo il passaggio funzionale:

```bash
python APPLICA_CHECKPOINT.py --repo <repository> --stage ui
python VERIFICA_CHECKPOINT.py --repo <repository> --stage ui --write-reports
```

## Attività consentite al Codex grafico/desktop

- integrare e rifinire esclusivamente la vista del modulo esistente;
- verificare responsive, accessibilità e compatibilità desktop;
- mantenere tutti gli ID e i contratti funzionali;
- correggere difetti UI documentati senza alterare sicurezza o persistenza.

## Attività vietate al Codex grafico/desktop

- modificare logica SSRF, robots, storage, API o test congelati;
- attivare la rete per impostazione predefinita;
- aggiungere ricerca generalista;
- promuovere automaticamente contenuti nei materiali CORE;
- creare demo, copie HTML, standalone o nuove cartelle preview;
- modificare main, demo-canonica, Aula Studio, produzione, Supabase o workflow;
- effettuare merge o release.

## File congelati dopo READY_FOR_HANDOFF funzionale

Da compilare con commit e hash reali dopo i test:

- `eve-ai-studio/app/main.py`
- `eve-ai-studio/app/intelligence/web_acquisition.py`
- `eve-ai-studio/.env.example`
- `eve-ai-studio/tests/test_intelligence_acquisition.py`
- documentazione tecnica del checkpoint.

## Stato e chiusura

Questo handoff deve essere aggiornato nello stesso file, non duplicato.

Transizioni:

```text
FUNCTIONAL_TESTING
→ READY_FOR_HANDOFF
→ UI_INTEGRATION
→ REVIEW_REQUIRED
→ approvazione utente
→ checkpoint chiuso
```

Prima della chiusura aggiungere:

- branch effettivo;
- PR effettiva;
- commit funzionale congelato;
- commit UI;
- file realmente modificati;
- conteggi test;
- warning;
- test browser;
- limiti residui;
- approvazione esplicita.

## Conferme obbligatorie

- nessuna demo alternativa creata;
- nessun file HTML o standalone creato;
- nessuna nuova cartella preview creata;
- `main` non modificato;
- `demo-canonica` non modificato;
- Aula Studio non modificata;
- produzione non modificata;
- workflow GitHub non modificati;
- nessuna scrittura GitHub effettuata dall'autore del pacchetto.

<!-- AUTO-VERIFICATION-START -->
## Verifica automatica 2026-07-29T15:55:29+00:00

- Stage: `functional`
- Stato: **failed_or_incomplete**
- Branch: `codex/eve-ai-studio-intelligence-0-2-functional`
- HEAD: `823b719222abdd2d6d799714e3c59b186a89bd18`
- Browser reale: **NON ESEGUITO DA QUESTO SCRIPT**

### Controlli
- `static_markers`: PASS
- `compileall`: PASS
- `specific_pytest`: PASS
- `full_pytest`: PASS
- `main_wiring_probe`: PASS
- `git_diff_check`: PASS
- `diff_scope`: FAIL/PENDING

Il checkpoint resta aperto finché non sono presenti test browser reali, revisione e approvazione utente.
<!-- AUTO-VERIFICATION-END -->

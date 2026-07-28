# CHECKPOINT DESKTOP-0.1 — Installer, release e aggiornamenti — HANDOFF

## Stato e fonte di verità

- Stato: `RELEASE_READY`
- Branch canonico: `eve-ai-studio`
- Sorgente unica dell’interfaccia: `reference/eve-ai-studio-preview/`
- Ingresso unico: `reference/eve-ai-studio-preview/index.html`
- Versione desktop pubblicata: `1.2.0-alpha.1`
- Release: https://github.com/giudiceluca98-cell/eve-ai-studio-releases/releases/tag/eve-ai-studio-v1.2.0-alpha.1
- Workflow riuscito: https://github.com/giudiceluca98-cell/aula-studio-virtuale/actions/runs/30373628931

Questo documento descrive il sistema desktop già operativo. Non va creata
un’altra demo, una copia HTML, uno standalone, un secondo pacchetto desktop o
un altro repository contenente la sorgente di Eve.

## Architettura realizzata

```text
reference/eve-ai-studio-preview/ (sorgente canonica)
        ↓ build-frontend.mjs
eve-desktop/frontend-dist/ (generato e ignorato da Git)
        ↓ Tauri 2 + NSIS
Eve.AI.Studio_<versione>_x64-setup.exe
        ↓ GitHub Actions
giudiceluca98-cell/eve-ai-studio-releases
        ├─ installer .exe
        ├─ firma .sig
        └─ latest.json
                ↓ updater Tauri
app installata: controllo, download, installazione e riavvio
```

La cartella `frontend-dist` è un prodotto temporaneo della build: non è una
sorgente modificabile e non deve essere committata.

## File e responsabilità

- `eve-desktop/package.json`: versione, comandi di build e CLI Tauri.
- `eve-desktop/pnpm-lock.yaml`: dipendenze JavaScript bloccate.
- `eve-desktop/scripts/build-frontend.mjs`: genera il frontend dalla sola sorgente canonica.
- `eve-desktop/scripts/check-version.mjs`: verifica package, Tauri e Cargo.
- `eve-desktop/scripts/create-release-config.mjs`: genera in CI la configurazione updater.
- `eve-desktop/scripts/test-desktop-build.mjs`: verifica provenienza e struttura.
- `eve-desktop/runtime/eve-desktop-window.js`: integrazione finestra nativa.
- `eve-desktop/runtime/eve-desktop-updater.js`: interfaccia UI/updater Tauri.
- `eve-desktop/runtime/eve-desktop.css`: adattamenti della sola app installata.
- `eve-desktop/src-tauri/`: backend nativo, capabilities, icone e NSIS.

`eve-desktop/src-tauri/src/lib.rs` espone `check_for_update` e
`install_pending_update`. L’aggiornamento sostituisce la versione installata:
non crea una nuova installazione per ogni release. Dati e preferenze
compatibili non devono essere cancellati durante l’upgrade.

## Workflow e repository release

`.github/workflows/release-eve-ai-studio-desktop.yml`:

1. parte da un tag `eve-ai-studio-v*` o manualmente sulla branch canonica;
2. installa pnpm in modo isolato con `--ignore-workspace`;
3. verifica versione e provenienza canonica;
4. genera la configurazione firmata dell’updater;
5. compila l’installer Windows NSIS;
6. pubblica installer, firma e `latest.json` in `eve-ai-studio-releases`.

Il repository `eve-ai-studio-releases` contiene esclusivamente artefatti
scaricabili. Non contiene e non deve ricevere una seconda sorgente di Eve.

## Segreti GitHub Actions

- `EVE_RELEASE_TOKEN`: pubblicazione nel repository release;
- `TAURI_SIGNING_PRIVATE_KEY`: firma degli aggiornamenti;
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: password della chiave privata;
- `TAURI_UPDATER_PUBLIC_KEY`: chiave pubblica inserita nella configurazione.

Non stampare, copiare nei file, rinominare o sostituire questi valori.
`AULA_RELEASE_TOKEN` non è più usato dal workflow desktop di Eve e non è stato
modificato.

## Problemi incontrati e correzioni

1. Le dipendenze finivano nel workspace principale. Correzione:
   `pnpm --dir eve-desktop install --no-frozen-lockfile --ignore-workspace`.
2. `tauri::generate_context!()` non trovava `serde_json`. Correzione:
   `serde_json = "1"` in `eve-desktop/src-tauri/Cargo.toml`.
3. Il token condiviso non poteva creare Release nel repository separato.
   Correzione: `EVE_RELEASE_TOKEN`, usato dal solo workflow desktop di Eve.
4. Un avvio manuale duplicato è stato annullato. La pubblicazione valida è il
   run `30373628931`.

## Pull Request di riferimento

- PR #75: governance e prima infrastruttura desktop.
- PR #76: configurazione del repository release.
- PR #77: installazione pnpm isolata.
- PR #78: dipendenza Rust `serde_json`.
- PR #79: token release dedicato.
- PR #80: chiusura del checkpoint a `RELEASE_READY`.
- Commit canonico precedente a questo handoff: `fef6ba9`.

## Verifiche concluse

- build dalla sola sorgente canonica: superata;
- versione `1.2.0-alpha.1`: coerente;
- compilazione Rust/Tauri Windows: superata;
- installer NSIS e firma: generati;
- `latest.json`: generato e pubblicato;
- workflow `30373628931`: `success`.

Asset pubblicati:

- `Eve.AI.Studio_1.2.0-alpha.1_x64-setup.exe`;
- `Eve.AI.Studio_1.2.0-alpha.1_x64-setup.exe.sig`;
- `latest.json`.

## Regole per il Codex successivo

Può aggiornare la sorgente canonica attraverso il normale handoff, incrementare
la versione nei tre manifest e riutilizzare il sistema desktop esistente.

Non può:

- creare demo, standalone, HTML completi o cartelle preview;
- modificare direttamente `frontend-dist`;
- creare un secondo progetto Tauri o repository release;
- pubblicare da `main`, `demo-canonica` o da una sorgente diversa;
- modificare `AULA_RELEASE_TOKEN` o esporre segreti;
- cambiare `it.aulastudio.eveai` senza migrazione esplicita;
- eliminare dati o preferenze durante un aggiornamento;
- effettuare merge o pubblicazioni senza approvazione.

## Conferma finale

La sorgente canonica, `main`, `demo-canonica`, Aula Studio e la produzione web
non sono stati modificati dal lavoro desktop. Non sono state create sorgenti
duplicate. L’app installabile e l’updater derivano dalla stessa Eve AI Studio
canonica.

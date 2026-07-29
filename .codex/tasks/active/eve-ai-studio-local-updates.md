# DESKTOP-0.3 — aggiornamento firmato da file locale

- Stato: `REVIEW_REQUIRED`
- Branch: `codex/eve-ai-studio-local-updates`
- Base: `origin/eve-ai-studio` @ `185c084`

## Obiettivo

Consentire all'utente di scegliere dal computer l'installer ufficiale della
release online corrente. Versione e firma devono essere validate usando i
metadati e la chiave del canale updater esistente; l'installazione deve
riutilizzare il plugin Tauri updater già presente.

## File prenotati

- `eve-desktop/runtime/eve-desktop-updater.js`
- `eve-desktop/runtime/eve-desktop.css`
- `eve-desktop/src-tauri/src/lib.rs`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- `eve-desktop/src-tauri/tauri.conf.json`
- `eve-desktop/src-tauri/capabilities/default.json`
- `eve-desktop/scripts/test-desktop-build.mjs`
- `eve-desktop/README.md`
- questa scheda e la relativa sezione di `CODEX_COORDINATION.md`

## Vincoli

- nessun secondo updater;
- nessun file non firmato o privo di release online corrispondente;
- nessuna modifica alla sorgente canonica, alle demo o ad Aula Studio;
- Draft PR verso `eve-ai-studio`; nessun merge senza approvazione.

## Verifiche

- `node --check eve-desktop/runtime/eve-desktop-updater.js`: superato;
- `pnpm --dir eve-desktop check:version 1.2.0-alpha.4`: superato;
- `pnpm --dir eve-desktop test`: superato;
- `cargo check`: superato;
- build Tauri e installer NSIS: superata;
- avvio reale dell'eseguibile: superato;
- browser reale: entrambi i percorsi visibili, nessun errore console;
- sorgente canonica e demo: non modificate.

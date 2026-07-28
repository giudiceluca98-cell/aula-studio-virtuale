# DESKTOP-0.1 — Applicazione installabile e aggiornamenti

- Responsabile: Codex grafico/desktop
- Stato: `FUNCTIONAL_TESTING`
- Branch di partenza: `codex/eve-ai-studio-coordination-policy` @ `238f721`
- Sorgente applicativa: `origin/eve-ai-studio` @ `13b8822`
- Branch di lavoro: `codex/eve-ai-studio-desktop-installable`
- Commit di implementazione: `0a1527d`
- Pull Request: da aprire verso `eve-ai-studio`

## Obiettivo

Creare il pacchetto Windows installabile di Eve AI Studio partendo esclusivamente da `reference/eve-ai-studio-preview/`, con aggiornamenti firmati tramite GitHub Release.

## File prenotati

- `.github/workflows/release-eve-ai-studio-desktop.yml`
- `eve-desktop/**`
- `.codex/tasks/active/eve-ai-studio-desktop-installable.md`
- `CODEX_COORDINATION.md`, limitatamente alla scheda `DESKTOP-0.1`

## File canonici condivisi

Nessuno. La sorgente canonica viene letta durante la build e non viene modificata.

## Vincoli

- nessuna demo alternativa;
- nessun file standalone;
- nessuna sorgente duplicata committata;
- nessuna modifica a `main`, `demo-canonica`, Aula Studio o produzione;
- nessun merge autonomo;
- conservazione di dati e preferenze compatibili tra gli aggiornamenti.

## Verifiche previste

- provenienza della build dalla sola sorgente canonica;
- sintassi dei controller desktop;
- test della directory frontend generata;
- compilazione Rust;
- build Tauri Windows;
- presenza dell'installer NSIS;
- configurazione dell'updater separata dai segreti;
- assenza di artefatti generati nel commit.

## Correzione CI in corso

- Branch: `codex/eve-ai-studio-desktop-serde-fix`
- Base: `origin/eve-ai-studio` @ `11acd27`
- Causa verificata: la build Windows non trova `serde_json`, richiesto da `tauri::generate_context!`.
- File prenotati: `eve-desktop/src-tauri/Cargo.toml`, relativo lockfile e i soli documenti di coordinamento.
- Perimetro: dipendenza Rust e rigenerazione del lockfile; nessuna modifica alla sorgente canonica o alla logica di Eve.
- Verifiche locali: build frontend superata; versione coerente; `cargo metadata --offline` superato; `git diff --check` superato.
- Limite locale: `cargo check` non può avviare `rustc` per il vincolo dell'ambiente Windows; verifica completa demandata a GitHub Actions.

## Pubblicazione nel repository release

- Branch: `codex/eve-ai-studio-desktop-release-token`
- Base: `origin/eve-ai-studio` @ `890a8fe`
- Causa verificata: il token condiviso precedente non poteva creare Release in `eve-ai-studio-releases`.
- Modifica prevista: usare esclusivamente il segreto cifrato `EVE_RELEASE_TOKEN` nel workflow desktop.
- Nessun valore segreto viene scritto nel repository o mostrato nei log.

## Risultati locali

- build frontend dalla sorgente canonica: superata;
- 64 asset Eve nella build: verificati;
- sintassi JavaScript canonica e desktop: superata;
- coerenza versione `1.2.0-alpha.1`: superata;
- `cargo metadata --offline`: superato;
- `git diff --check`: superato dopo la normalizzazione;
- compilazione NSIS: demandata al workflow Windows perché l'ambiente locale non dispone dei Build Tools MSVC e blocca l'esecuzione di `rustc`.

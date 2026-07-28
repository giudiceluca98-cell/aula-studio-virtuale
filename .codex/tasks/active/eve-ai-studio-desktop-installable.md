# DESKTOP-0.1 — Applicazione installabile e aggiornamenti

- Responsabile: Codex grafico/desktop
- Stato: `IN_PROGRESS`
- Branch di partenza: `codex/eve-ai-studio-coordination-policy` @ `238f721`
- Sorgente applicativa: `origin/eve-ai-studio` @ `13b8822`
- Branch di lavoro: `codex/eve-ai-studio-desktop-installable`
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


# DESKTOP-0.2 — Fluidità, caricamento progressivo e updater

- Responsabile: Codex grafico/desktop
- Stato: `IN_PROGRESS`
- Branch di partenza: `origin/eve-ai-studio` @ `b8ec526`
- Branch di lavoro: `codex/eve-ai-studio-desktop-performance`

## Obiettivo

Correggere il controllo aggiornamenti della versione alpha e ridurre il lavoro
grafico e JavaScript eseguito quando le relative sezioni non sono visibili,
senza rimuovere funzioni o modificare il comportamento didattico di Eve.

## File prenotati

- `reference/eve-ai-studio-preview/index.html`
- `reference/eve-ai-studio-preview/particles.js`
- `reference/eve-ai-studio-preview/graphics-performance.js`
- `reference/eve-ai-studio-preview/animation-library-gallery.js`
- `reference/eve-ai-studio-preview/styles.css`
- eventuale nuovo modulo dedicato al caricamento progressivo nella stessa cartella canonica
- `.github/workflows/release-eve-ai-studio-desktop.yml`
- `eve-desktop/package.json`
- `eve-desktop/src-tauri/tauri.conf.json`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- test desktop strettamente necessari
- questa scheda
- `CODEX_COORDINATION.md`, limitatamente a `DESKTOP-0.2`

## Vincoli

- nessuna demo, standalone o sorgente duplicata;
- nessun secondo updater o progetto desktop;
- nessuna modifica a `main`, `demo-canonica` o Aula Studio;
- grafica completa invariata quando selezionata;
- caricamento progressivo senza perdita di funzioni;
- segreti mai esposti.

## Verifiche previste

- endpoint updater pubblico raggiungibile;
- moduli caricati soltanto quando richiesti;
- particelle sospese quando non utili;
- galleria animazioni inizializzata alla prima apertura;
- modalità ottimizzata più leggera;
- build canonica e desktop, sintassi e regressioni.

## Risultato locale

- versione desktop preparata: `1.2.0-alpha.2`;
- moduli di test, RAG, configurazione modelli e pubblicazione caricati su richiesta;
- galleria delle animazioni inizializzata soltanto alla prima apertura;
- particelle ottimizzate a 30 FPS, DPR ridotto e sospensione in background;
- filtri grafici costosi rimossi soltanto in modalità ottimizzata;
- release GitHub configurata come release ordinaria per rendere valido
  `/releases/latest/download/latest.json`;
- sintassi JavaScript, coerenza versione e build desktop: superate;
- prova browser: avvio, caricamento progressivo del laboratorio e console senza errori.

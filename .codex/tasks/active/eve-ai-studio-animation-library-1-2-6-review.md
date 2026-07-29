# ANIMATION-1.2.6 — Libreria ufficiale e prestazioni

- Stato: `REVIEW_REQUIRED`
- Responsabile: AndreaGiudice94 / Codex integrazione grafica
- Branch: `codex/eve-ai-studio-animation-library-1-2-6-review`
- Pull Request: `#84` verso `eve-ai-studio`
- Base aggiornata: `origin/eve-ai-studio` @ `a508e00`
- Commit applicativo congelato: `6d9ea1a`

## Obiettivo

Sostituire il runtime Eve Animation Library 1.2.2 con la libreria ufficiale
1.2.6 nella sola preview canonica, mantenendo 64 asset e il profilo prestazioni
approvato.

## File prenotati

- `reference/eve-ai-studio-preview/index.html`
- `reference/eve-ai-studio-preview/animation-library-gallery.js`
- `reference/eve-ai-studio-preview/particles.js`
- `reference/eve-ai-studio-preview/eve-animation-runtime-v1.2.2/**`
- `reference/eve-ai-studio-preview/install_hq_animation_runtime.py`
- `reference/eve-ai-studio-preview/vendor/EVE_ANIMATION_RUNTIME_V1.2.2_ORIGINAL.tar.xz`
- `reference/eve-ai-studio-preview/eve-animation-runtime-v1.2.6/**`
- `reference/eve-ai-studio-preview/EVE_1.2.6_PERFORMANCE_FINAL_VALIDATION.json`
- questa scheda, la relativa sezione di `CODEX_COORDINATION.md` e il solo
  documento di handoff associato

## Vincoli

- non creare demo, copie HTML, standalone o nuove cartelle preview;
- non modificare `main`, `demo-canonica`, Aula Studio, produzione o workflow;
- `reference/eve-ai-studio-preview/index.html` resta l'unico ingresso;
- non effettuare merge o release senza revisione e approvazione dell'utente;
- non creare altri file di setup, stato, stop, avviso o coordinamento.

## Verifiche richieste

- 64 animazioni e 64 poster con hash SHA-256;
- manifesto 1.2.6 coerente;
- `node --check` sui JavaScript modificati;
- nessun riferimento eseguibile alla versione 1.2.2;
- prova HTTP della preview, galleria e layout responsive;
- aggiornamento dell'unico handoff con commit, file e risultati reali.

## Esito

- runtime ufficiale 1.2.6 integrato con 64 animazioni e 64 poster verificati
  tramite SHA-256;
- preview canonica verificata via HTTP e nel browser desktop e mobile;
- `node --check`, ESLint mirato, typecheck, test JavaScript, build, test Python e
  controllo delle 150 risorse HTTP completati con successo;
- nessun riferimento eseguibile al runtime 1.2.2 e nessun duplicato HTML;
- il lint completo segnala un errore preesistente nel file non modificato
  `reference/eve-ai-studio-preview/app.js` e due avvisi preesistenti;
- nessun merge, release desktop o intervento fuori dal perimetro eseguito.
- ogni scheda della galleria espone ora il comando diretto
  `Riproduci su Eve`; verificati 64 pulsanti e cambio stato dell'animazione.

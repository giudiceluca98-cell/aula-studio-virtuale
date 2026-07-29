# Handoff ANIMATION-1.2.6

Stato: `REVIEW_REQUIRED`

## Riferimenti congelati

- branch: `codex/eve-ai-studio-animation-library-1-2-6-review`;
- Pull Request: `#84` Draft verso `eve-ai-studio`;
- commit applicativo iniziale: `b869e37` (`Integrate Eve animation library 1.2.6`);
- ultimo commit applicativo: `6d9ea1a` (`Add play controls to Eve animation cards`);
- ingresso unico: `reference/eve-ai-studio-preview/index.html`;
- anteprima locale verificata: `http://127.0.0.1:4179/index.html`.

## Integrazione eseguita

- aggiornati `index.html`, `animation-library-gallery.js` e `particles.js` per
  usare il runtime 1.2.6 e il profilo prestazioni ottimizzato;
- aggiunta `eve-animation-runtime-v1.2.6/` con manifesto, runtime, 64 animazioni
  ufficiali e 64 poster statici;
- aggiunto `EVE_1.2.6_PERFORMANCE_FINAL_VALIDATION.json` con i risultati reali
  del collaudo locale;
- eliminati `eve-animation-runtime-v1.2.2/`,
  `install_hq_animation_runtime.py` e
  `vendor/EVE_ANIMATION_RUNTIME_V1.2.2_ORIGINAL.tar.xz`;
- mantenuto `index.html` come unico file HTML e unica sorgente canonica.
- aggiunto a ognuna delle 64 schede il pulsante diretto `Riproduci su Eve`,
  mantenendo separati il comando di selezione dell'anteprima e quello di
  riproduzione sul ritratto principale.

La galleria usa poster statici per le 64 schede e mantiene una sola animazione
grande attiva. Il ritratto principale viene sospeso quando la galleria è aperta;
visibilità e intersezione controllano la riproduzione per ridurre il carico.

## Verifiche concluse

- manifesto 1.2.6: 64 asset e 64 poster, tutti gli hash SHA-256 validi;
- `node --check`: 26 file JavaScript, 0 errori;
- ESLint mirato ai JavaScript modificati: superato;
- `pnpm typecheck`: superato;
- `pnpm test`: 31 file e 171 test superati;
- `pnpm build`: superato;
- compilazione Python: superata;
- `pytest`: 180 test superati, un avviso di deprecazione Starlette;
- verifica HTTP: 150 risorse richieste, 150 risposte valide, 0 errori;
- ricerca dei riferimenti eseguibili alla versione 1.2.2: 0 risultati;
- `git diff --check`: superato.

## Collaudo visivo

La preview è stata servita dalla cartella canonica sulla porta 4179 e verificata
nel browser integrato:

- ritratto Eve caricato dal runtime 1.2.6, riproduzione attiva e risorsa 512 px;
- galleria aperta con 64 schede, 64 poster associati e una sola preview animata;
- assenza di overflow orizzontale sia desktop sia mobile (viewport 390 × 844);
- ritorno dalla galleria al ritratto principale funzionante;
- console browser: 0 errori e 0 avvisi.
- 64 pulsanti diretti presenti; il click sulla scheda `Thinking Deep Hero` ha
  selezionato la scheda, aggiornato l'anteprima e impostato lo stato
  `eve-thinking-deep-hero` sul ritratto Eve;
- nessun overflow orizzontale desktop dopo l'aggiunta dei nuovi controlli.

## Limiti residui

Il comando di lint completo del repository segnala un errore preesistente in
`reference/eve-ai-studio-preview/app.js` (`@next/next/no-assign-module-variable`)
e due avvisi preesistenti in file non modificati. L'ESLint mirato ai file di
questa attività è superato; il problema non blocca la revisione della libreria.

## Confini rispettati e passo successivo

Non sono stati creati demo, standalone, copie di `index.html`, nuove cartelle
preview, altre Pull Request o sistemi di aggiornamento. `main`, `demo-canonica`,
Aula Studio, produzione, workflow desktop e repository release non sono stati
modificati. Non è stato eseguito alcun merge o rilascio.

Il revisore deve collaudare il commit congelato nella Draft PR #84. Solo dopo
l'approvazione sarà possibile unire la PR in `eve-ai-studio`; l'eventuale nuova
versione desktop e la pubblicazione in `eve-ai-studio-releases` restano un
passaggio separato.

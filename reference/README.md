# Demo canonica — Aula Studio Virtuale

Questa cartella contiene la fonte visiva e funzionale ufficiale usata per trasferire nell'app Next.js le funzioni sviluppate nella demo autonoma.

## Stato

**Demo 1.4.0-alpha.1-eve.1: Eve Animation Library 1.2.2 integrata, in attesa di verifica dell'utente.**

File canonico:

`reference/demo-aula-studio-virtuale-canonica.html`

Identificatori della versione corrente:

- versione: `1.4.0-alpha.1-eve.1`
- dimensione: `18132481` byte
- righe logiche: `21612`
- SHA-256: `07ab2db5da4015bb085f3f4b16e31a6c85f4356ca688945b47b0c8029a145ced`
- Git blob SHA: `ba94c24615b62d97a05455114e56a80b8afd0dbb`

Il canonico e il checkpoint Eve coincidono byte per byte. Il file è autonomo: i 64 WebP ufficiali e il fallback statico sono incorporati come data URI, senza fetch, CDN o dipendenze remote. La verifica automatica `file://` non è stata eseguita perché la policy del browser integrato blocca la navigazione a URL locali; la struttura offline è stata verificata staticamente e il doppio clic resta da provare dall'utente.

Checkpoint e rapporti:

- `reference/checkpoints/eve/demo-aula-studio-virtuale-1.4.0-alpha.1-eve.1.html`
- `reference/checkpoints/eve/STATUS_1.2.2.md`
- `reference/checkpoints/eve/VERIFICA_1.2.2.md`
- `reference/checkpoints/eve/build-report-1.2.2.json`

## Fonte di verità

Codex e gli altri agenti devono leggere la demo direttamente dal branch `demo-canonica`. Non devono usare copie locali non versionate, vecchi add-on, screenshot o ricostruzioni manuali come fonte principale.

La demo definisce:

- portale, presentazione, dashboard e aula;
- layout e responsive;
- progressi e missioni;
- sidebar e pannelli comprimibili;
- Eve Voice, selezione pagine e lettura automatica;
- assistenza vocale negli esercizi;
- chat completa e chat minimizzate;
- cursore personalizzato;
- timer, modali, drawer e persistenza locale della demo;
- viewer testuale e diagnostica dei Materiali;
- Checklist con ricerca, filtri, assegnatari, priorità, scadenze, stati e persistenza locale.

## Flusso di lavoro

1. Le modifiche visuali e funzionali alla demo vengono applicate nel branch `demo-canonica`.
2. Ogni aggiornamento modifica il file canonico, il manifesto e il changelog del checkpoint.
3. Codex esegue `git fetch origin --prune` e legge la versione più recente del branch.
4. Codex integra una funzione per volta nell'app ufficiale su un branch dedicato.
5. L'integrazione deve conservare autenticazione, routing, Supabase, RLS e Realtime.
6. Prima della consegna deve essere eseguito un confronto visivo e funzionale con la demo canonica.

La demo non deve essere copiata sopra l'app Next.js e non deve sostituire persistenza o servizi reali con mock o `localStorage`.

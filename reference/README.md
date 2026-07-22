# Demo canonica — Aula Studio Virtuale

Questa cartella contiene la fonte visiva e funzionale ufficiale usata per trasferire nell'app Next.js le funzioni sviluppate nella demo autonoma.

## Stato

**Demo 1.2.0-alpha.6 pronta per verifica: stati di errore della Dashboard.**

File canonico:

`reference/demo-aula-studio-virtuale-canonica.html`

Identificatori della versione corrente:

- versione: `1.2.0-alpha.6`

- dimensione: `600685` byte
- righe: `17700`
- SHA-256: `5a6f42d2182bce875063c7adac32c30335bd9086da6a9b6d689d1b9f67ab9225`
- Git blob SHA: `34f2dc43927fb684b76d488a7b3a4756f293a14d`

Il Git blob SHA del file presente nel branch coincide con quello calcolato sul file locale verificato: il contenuto è identico byte per byte.

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
- timer, modali, drawer e persistenza locale della demo.

## Flusso di lavoro

1. Le modifiche visuali e funzionali alla demo vengono applicate nel branch `demo-canonica`.
2. Ogni aggiornamento modifica il file canonico, il manifesto e il changelog.
3. Codex esegue `git fetch origin --prune` e legge la versione più recente del branch.
4. Codex integra una funzione per volta nell'app ufficiale su un branch dedicato.
5. L'integrazione deve conservare autenticazione, routing, Supabase, RLS e Realtime.
6. Prima della consegna deve essere eseguito un confronto visivo e funzionale con la demo canonica.

La demo non deve essere copiata sopra l'app Next.js e non deve sostituire persistenza o servizi reali con mock o `localStorage`.
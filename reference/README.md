# Demo canonica — Aula Studio Virtuale

Questa cartella contiene la fonte visiva e funzionale ufficiale usata per trasferire nell'app Next.js le funzioni sviluppate nella demo autonoma.

## Stato

**Demo 1.4.0-alpha.1 pronta per verifica: Fase 4 avviata con Checklist dinamica, filtri, assegnazioni e persistenza locale dichiarata.**

File canonico:

`reference/demo-aula-studio-virtuale-canonica.html`

Identificatori della versione corrente:

- versione: `1.4.0-alpha.1`
- dimensione: `14445` byte
- righe: `1`
- SHA-256: `6d8fd182954be313b51049831d54dfdb529a523ed9715b46737e1810776c7974`
- Git blob SHA: `ebd236cea4a6deac902b8c618319a85663394bb3`

Il file canonico e il checkpoint 1.4.0-alpha.1 coincidono byte per byte. Il caricatore verifica il checkpoint immutabile `1.3.0-alpha.9` e applica localmente il consolidamento della Fase 3 e la Checklist della Fase 4.

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
- Checklist dinamica della stanza con filtri, priorità, assegnatari e scadenze.

## Flusso di lavoro

1. Le modifiche visuali e funzionali alla demo vengono applicate nel branch `demo-canonica`.
2. Ogni aggiornamento modifica il file canonico, il manifesto e il changelog.
3. Codex esegue `git fetch origin --prune` e legge la versione più recente del branch.
4. Codex integra una funzione per volta nell'app ufficiale su un branch dedicato.
5. L'integrazione deve conservare autenticazione, routing, Supabase, RLS e Realtime.
6. Prima della consegna deve essere eseguito un confronto visivo e funzionale con la demo canonica.

La demo non deve essere copiata sopra l'app Next.js e non deve sostituire persistenza o servizi reali con mock o `localStorage`.

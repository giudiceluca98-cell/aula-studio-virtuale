# Demo canonica — Aula Studio Virtuale

Questa cartella contiene la fonte visiva e funzionale ufficiale usata per trasferire nell'app Next.js le funzioni sviluppate nella demo autonoma.

## Stato

**Demo 1.4.0-alpha.1 approvata: consolidamento dei Materiali e primo checkpoint della Checklist.**

File canonico:

`reference/demo-aula-studio-virtuale-canonica.html`

Identificatori della versione corrente:

- versione: `1.4.0-alpha.1`
- dimensione: `763281` byte
- righe: `20872`
- SHA-256: `85ad819914cf85740b0013f0d3147adaa2ff7b233f99935ba67f4fb77fefe95c`
- Git blob SHA: `1a4b68f4aa04bd5602afddb7a9feba867da33574`

Il canonico e il checkpoint della Fase 4 coincidono byte per byte. Il file è autonomo: può essere aperto con doppio clic e non richiede Internet o checkpoint esterni.

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

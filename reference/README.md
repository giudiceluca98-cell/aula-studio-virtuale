# Demo canonica — Aula Studio Virtuale

Questa cartella contiene la fonte visiva e funzionale ufficiale usata per trasferire nell'app Next.js le funzioni sviluppate nella demo autonoma.

## Stato

**Demo 1.3.0-alpha.10 pronta per verifica: Fase 3 consolidata con lettore TXT/Markdown e diagnostica integrata.**

File canonico:

`reference/demo-aula-studio-virtuale-canonica.html`

Identificatori della versione corrente:

- versione: `1.3.0-alpha.10`

- dimensione: `7997` byte
- righe: `22`
- SHA-256: `7125ae833c32daf9742a0310d6dd69227a1638c9934ddfd564320df28a86fede`
- Git blob SHA: `6c9848a82ef8e6ef8160cbc7ae05caf42ba9ffc2`

Il file canonico e il checkpoint alpha.10 coincidono byte per byte. Alpha.10 è un caricatore verificato: recupera il checkpoint immutabile alpha.9 dalla stessa cartella, ne controlla il SHA-256 e applica localmente il lettore TXT/Markdown e la diagnostica della Fase 3.

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

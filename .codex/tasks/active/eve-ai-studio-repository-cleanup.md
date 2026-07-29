# REPOSITORY-0.1 — Riordino GitHub e workflow canonici

- Responsabile: Codex coordinamento
- Stato: `IN_PROGRESS`
- Branch base: `origin/eve-ai-studio` @ `023fbe5`
- Branch: `codex/eve-ai-studio-repository-cleanup`

## Obiettivo

Ripristinare una struttura GitHub coerente con la sorgente modulare canonica,
eliminare dai workflow ogni dipendenza operativa da standalone superati,
archiviare attività concluse e preparare la pulizia controllata dei branch.

## File prenotati

- `.github/workflows/eve-ai-studio-checks.yml`
- `.github/workflows/eve-hq-final-verification.yml`
- `.github/workflows/eve-intelligence-0.1-checks.yml`
- `.github/workflows/eve-ai-studio-install-hq-animations.yml`
- `.codex/tasks/active/`, limitatamente alle attività concluse verificate
- `.codex/tasks/completed/`
- `CODEX_COORDINATION.md`, limitatamente a `REPOSITORY-0.1`
- `docs/EVE_AI_STUDIO_COORDINATION.md`, soltanto per regole anti-disordine

## Vincoli

- nessuna modifica a `main`, `demo-canonica`, Aula Studio o produzione;
- nessuna demo, copia HTML, standalone o nuova cartella preview;
- nessun contenuto della libreria 1.2.6 integrato in questa attività;
- la Draft PR #84 verrà ripulita separatamente senza sostituire il lavoro
  applicativo dell’altro Codex.

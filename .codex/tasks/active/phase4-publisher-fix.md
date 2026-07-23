# Correzione pubblicazione checkpoint 1.4 autonomo

Stato: in corso
Assegnazione: Codex
Branch: `agent/phase4-publisher-fix`

## Obiettivo

Correggere esclusivamente i due marker JavaScript errati che bloccano il workflow già caricato per pubblicare il checkpoint canonico autonomo `1.4.0-alpha.1`.

## File previsti e riservati

- `scripts/apply-phase4-alpha1.py`
- `.codex/tasks/active/phase4-publisher-fix.md`
- `CODEX_COORDINATION.md`

## Verifiche previste

- ricostruzione dell'artefatto con dimensione `763281` byte;
- SHA-256 `85ad819914cf85740b0013f0d3147adaa2ff7b233f99935ba67f4fb77fefe95c`;
- presenza delle funzioni effettive `aulaTextOpen` e `aulaMaterialDiagnosticsOpen`;
- workflow GitHub completato con successo;
- nessuna modifica alla logica della demo o dell'applicazione.

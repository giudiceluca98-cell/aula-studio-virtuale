# Verifica INTELLIGENCE-0.4

Da eseguire sull'ultimo checkout:
- test specifici `tests/test_intelligence_search.py`;
- suite Python cumulativa;
- query disabled-by-default;
- retry/fallback;
- limiti attore/aula/progetto;
- URL vietati, deduplicazione e filtri;
- isolamento cross-room;
- registrazione candidati con `content_acquired=false`;
- zero eventi di acquisizione automatica;
- API execute/list/detail;
- `node --check` e browser reale della preview canonica;
- `git diff --check` e verifica scope.

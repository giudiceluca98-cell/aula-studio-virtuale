# CI result — integrazione locale

Stato: `REVIEW_REQUIRED`.

- verifica pacchetto/repository: PASS;
- test specifici Python: 13 superati;
- suite cumulativa Python: 261 superati;
- test web: 224 superati;
- typecheck: PASS;
- build Next.js: PASS;
- lint mirato JavaScript: PASS.

Correzioni applicate: normalizzazione CRLF nel validatore estratto e filtro dei
segmenti la cui promozione viene revocata dopo l'indicizzazione. GitHub Actions,
installer firmato, release alpha.14 e collaudo desktop non sono ancora dichiarati.

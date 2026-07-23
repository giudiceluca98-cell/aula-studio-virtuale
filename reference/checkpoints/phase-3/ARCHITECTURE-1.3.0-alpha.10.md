# Architettura aggiuntiva — 1.3.0-alpha.10

## Modello

`1.3.0-alpha.10` è composto da:

1. caricatore HTML autonomo;
2. checkpoint immutabile `1.3.0-alpha.9`;
3. verifica SHA-256 nel browser;
4. inserimento locale di CSS e JavaScript di consolidamento;
5. apertura della copia risultante tramite URL `Blob`.

## Sicurezza e recupero

- Il checkpoint alpha.9 non viene modificato.
- Un hash errato impedisce l'esecuzione.
- Nessun iframe remoto viene introdotto.
- Il reset riguarda soltanto le chiavi locali dei Materiali.
- Il pulsante di fallback apre direttamente alpha.9.
- Il branch può essere ripristinato al checkpoint precedente senza ricostruire la demo.

## Destinazione nell'app reale

Il lettore TXT/Markdown e la diagnostica sono specifiche UX della demo. Nell'app Next.js devono essere implementati come componenti React tipizzati, usando Storage e progressi server-side già esistenti, senza copiare la logica `Blob` o affidare i progressi reali a `localStorage`.

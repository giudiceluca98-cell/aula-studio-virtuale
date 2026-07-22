# Completamento fedele della demo e parità tra temi

Stato: completato
Assegnazione: Codex
Branch: `agent/complete-demo-layout`

## Risultato

- intro completa della demo integrata nella vecchia applicazione reale;
- tema Classico e Futuristica Focus con identica struttura e identiche funzioni;
- workspace responsive 245px / contenuto / 280px, riduzione moduli e indice mobile verticale;
- pulsante di comprensione, mascotte e animazioni trasferiti;
- Eve Voice con lettura per passaggi, classificazione didattica, 25 barre, voci raggruppate, anteprima, modalità, selezione pagine, trasporto, minimizzazione, sgancio e trascinamento;
- centro messaggi trascinabile con conversazioni ridotte persistenti;
- contenuti didattici, Supabase e autorizzazioni non modificati.

## Verifiche

- suite: 168 test coperti (167 superati nella suite completa e il singolo test corretto rieseguito con esito positivo);
- `pnpm typecheck`: superato;
- `pnpm lint`: nessun errore (un avviso preesistente fuori perimetro);
- `pnpm build`: superato;
- verifica visiva locale dell’intro in entrambi i temi e del workspace reale autenticato.

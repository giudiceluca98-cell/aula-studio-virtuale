# Verifica Eve Animation Library 1.2.2

## Risultati automatici

- Manifesto sorgente: 64 ID unici; distribuzione 12/21/20/8/3.
- HTML canonico e checkpoint: identici byte per byte.
- Build ripetuta: SHA-256 invariato, quindi idempotente.
- Verificatore statico: 64 WebP incorporati, 3 script validi, 3 style bilanciati.
- Sicurezza/offline: nessun `fetch`, CDN, URL remoto, `eval`, `new Function` o `DecompressionStream` nell'integrazione.
- Browser locale: 39/39 stati richiesti selezionati dall'inspector con WebP incorporato.
- Filtri inspector: Tutte 64, P0 12, P1 21, P2 20, compact 8, hero 3; ricerca `goodbye` 1 risultato.
- Interazioni reali: chat, materiali, esercizi, quiz, checklist, progressi, timer, pannello Eve e impostazioni verificate.
- Accessibilità: focus trap, Escape, ritorno del focus e fallback statico verificati.
- Reduced motion: main e preview sul fallback ufficiale 256 × 256.
- Responsive: viewport 390 × 844 senza overflow orizzontale; stage Eve largo 283 px.
- Console browser: 0 warning, 0 errori.

## Prove visive

Le schermate sono in `reference/checkpoints/eve/screenshots/1.2.2/`: idle, inspector completo, filtri P0/P1/P2, listening, thinking, reading, test running, publishing, pannello aperto, reduced motion e mobile.

## Limite reale

La policy del browser integrato blocca la navigazione automatica a `file://`; non è stato usato un browser alternativo per aggirarla. L'offline è stato verificato staticamente e la stessa build è stata provata via server HTTP locale senza dipendenze remote. L'utente deve ancora aprire il checkpoint con doppio clic e confermare la resa nel proprio browser.

## Prova manuale richiesta

1. Aprire con doppio clic `demo-aula-studio-virtuale-1.4.0-alpha.1-eve.1.html`.
2. Entrare nell'Aula e aprire “Animazioni Eve 1.2.2”.
3. Provare ricerca, filtri, replay, ritorno a idle e fallback statico.
4. Provare chat, Materiali, Esercizi, Quiz, Checklist, Progressi e Timer.
5. Ridimensionare il browser fino a una larghezza mobile e verificare l'assenza di scorrimento orizzontale.

Stato finale: `IN_ATTESA_VERIFICA_UTENTE`.

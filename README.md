# Aula Studio Virtuale

Questo repository pubblica come sito ufficiale la **demo canonica** di Aula Studio Virtuale.

## Versione pubblicata

- versione: `1.4.0-alpha.1`
- branch sorgente: `demo-canonica`
- file canonico: `demo-aula-studio-virtuale-canonica.html`

Il file HTML viene distribuito senza modifiche. La rotta principale `/` viene riscritta da Vercel verso il file canonico tramite `vercel.json`.

## Struttura

- `demo-aula-studio-virtuale-canonica.html`: applicazione canonica completa;
- `vercel.json`: configurazione minima di pubblicazione;
- `VERSION.txt`: riferimenti verificabili della versione;
- `README.md`: documentazione essenziale.

La precedente applicazione Next.js, le API, le migrazioni Supabase, i test e i contenuti paralleli sono stati rimossi dal ramo ufficiale per evitare sovrapposizioni con la demo canonica. Restano recuperabili dalla cronologia Git precedente a questa sostituzione.

## Aggiornamenti futuri

Ogni nuova versione deve:

1. provenire dal branch `demo-canonica`;
2. mantenere il nome `demo-aula-studio-virtuale-canonica.html`;
3. sostituire integralmente il file precedente;
4. aggiornare `VERSION.txt`;
5. essere verificata in anteprima prima della pubblicazione.

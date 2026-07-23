# Verifica checkpoint 1.4.0-alpha.1

## Ambito

Fase 4 — primo passaggio Checklist: elenco, filtri e gestione delle attività della stanza.

## Identificatori

- Dimensione: `14445` byte
- Righe: `1`
- SHA-256: `6d8fd182954be313b51049831d54dfdb529a523ed9715b46737e1810776c7974`
- Git blob SHA: `ebd236cea4a6deac902b8c618319a85663394bb3`

## Controlli superati

- caricatore HTML chiuso correttamente;
- script esterno del caricatore verificato con `node --check`;
- script innestato della Checklist verificato con `node --check`;
- checkpoint di base `1.3.0-alpha.9` verificato tramite SHA-256 prima dell'esecuzione;
- marker della base alpha.9 richiesto prima dell'innesto;
- caricamento compatibile sia dalla cartella `reference/` sia da `reference/checkpoints/phase-4/`;
- Checklist disponibile soltanto quando viene aperto il drawer omonimo;
- normalizzazione dei record salvati nel browser;
- ricerca e filtri deterministici;
- controllo del titolo duplicato;
- cambio stato limitato a `todo`, `in_progress` e `done`;
- scadenze riconosciute soltanto in formato ISO;
- nessuna richiesta remota o iframe aggiunto;
- persistenza locale chiaramente distinta dallo stato reale Supabase;
- canonico e checkpoint attesi sul medesimo Git blob.

## Limiti reali

- Non è stato eseguito un test visuale manuale in un browser.
- La pagina deve essere servita tramite HTTP locale; l'apertura `file://` può bloccare `fetch`.
- Il salvataggio è una simulazione privata del browser e non sincronizza due utenti.
- Assegnatari e autorizzazioni non sostituiscono membership, RLS o Realtime dell'app ufficiale.

## Azioni da provare

1. Aprire l'Aula e il drawer Checklist.
2. Cercare una parola e provare i filtri.
3. Creare una nuova attività.
4. Cambiare stato e completare un'attività.
5. Ricaricare la pagina e controllare la persistenza.
6. Rimuovere un'attività.

Stato: `IN_ATTESA_APPROVAZIONE`.

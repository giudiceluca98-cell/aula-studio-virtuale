# Tema Futuristica Focus e aggiornamenti master dell’aula

Stato: in corso
Assegnazione: Codex
Branch: `agent/futuristic-focus-theme`
Dipendenza: commit locale `b52b2c3` dei controlli di lettura e scorrimento

## Obiettivo

Integrare in modo incrementale il documento master del 22 luglio 2026 senza sostituire l’architettura ufficiale. Il design attuale resta disponibile come tema `Classico`; il nuovo design viene aggiunto come tema personale `Futuristica Focus` selezionabile nelle impostazioni.

## Fonte

- `ADDON_MASTER_CODEX_TUTTI_AGGIORNAMENTI_AULA_STUDIO_VIRTUALE.txt`
- demo dichiarata: `demo-aula-studio-virtuale-eve-esercizi-vocali.html`
- SHA-256 dichiarato: `4727ddde31f968c5ecf9c931b303579c7ba27b2850f0fd407fc0ae72f8b4485a`

## File previsti e riservati

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/lib/ui-theme.ts`
- `src/components/theme/**`
- `src/components/room/room-settings.tsx`
- `src/components/room/programming-lesson-workspace.tsx`
- `src/components/dashboard/room-launcher.tsx`
- `src/app/page.tsx`
- test dedicati al tema
- `.codex/tasks/active/futuristic-focus-theme.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

- `src/components/room/study-room.tsx`
- `src/components/room/message-center.tsx`
- `src/components/room/exercise-voice-assistant.tsx`
- `src/components/room/demo-data.ts`
- `src/hooks/use-room-realtime.ts`
- `src/lib/types.ts`
- `supabase/migrations/0017_message_center.sql`
- test dedicati al centro messaggi e all’assistente esercizi

La prenotazione prosegue quella già attiva sul ramo dipendente dei controlli di lettura. Per la fase Centro messaggi è prenotata anche la nuova migrazione incrementale `0017_message_center.sql`; non vengono riscritte migrazioni già applicate.

## Fasi

1. infrastruttura temi e selettore persistente;
2. shell Futuristica Focus per portale, dashboard, aula, lettore e impostazioni;
3. stati UI modulari richiesti dal master, riutilizzando backend e componenti ufficiali;
4. test funzionali, responsive, accessibilità, lint, typecheck e build.

## Vincoli

- il tema Classico non deve cambiare aspetto o comportamento;
- la preferenza del tema è personale e non viene condivisa nella stanza;
- `prefers-reduced-motion`, touch e tastiera devono mantenere fallback accessibili;
- nessun mock della demo sostituisce i dati ufficiali;
- nessuna regressione a timer, chat, chiamata, quiz, Python Project, glossario, progressi o salvataggio.

## Integrazione completata in questa fase

- aggiunti i temi personali `Classico` e `Futuristica Focus`, con Classico come fallback;
- aggiunta la sezione Temi nelle impostazioni e persistenza locale sincronizzata tra schede;
- applicata la nuova shell a presentazione, autenticazione, dashboard, catalogo, aula e impostazioni;
- mantenuta chiara l’area di lettura dentro l’interfaccia scura;
- aggiunti header metallizzato, indicatore di sincronizzazione, pulsanti attivi fluidi, materiale selezionato animato e cursore ciano/nero con fallback touch;
- aggiunte colonna Moduli e lezioni riducibile, missioni del progresso espandibili e pulsante di comprensione evidenziato;
- aggiunta Audio-lezione di Eve con voci browser, velocità, pagina corrente, pagine scelte, lezione completa, precedente, play/pausa, stop, successivo, 25 barre e pannello riducibile/sganciabile;
- tutte le preferenze puramente visive o vocali restano personali e non vengono condivise nella stanza.

## Verifiche eseguite

- test mirati tema, Audio-lezione, navigazione e layout: 18/18 superati;
- typecheck: superato;
- lint: superato senza errori;
- build di produzione: superata.

## Seconda fase completata

- sostituita la chat laterale con un centro messaggi responsive e minimizzabile;
- aggiunte Lobby permanente, chat private e gruppi con ricerca, filtri, ordinamento, separatori giornalieri, non letti per conversazione, emoji e pannello partecipanti;
- aggiunta la migrazione incrementale `0017_message_center.sql` con RLS, RPC sicure, Realtime, backfill dei messaggi storici e contenitore privato per gli allegati;
- aggiunti allegati fino a 5 file da 10 MB, validazione MIME, percorsi sicuri e apertura tramite URL firmati temporanei;
- mantenuta una modalità compatibile: prima dell’applicazione della migrazione la Lobby continua a funzionare, mentre private, gruppi e allegati restano disabilitati;
- aggiunto Eve negli esercizi con lettura consegna/selezione, voci e velocità condivise, pausa/stop, suggerimenti editoriali progressivi e confronto sbloccato solo dopo una risposta valida;
- aggiunta l’evidenziazione progressiva del parlato sia nelle lezioni sia negli esercizi, con fallback nei browser privi dell’evento vocale parola-per-parola.

## Limite editoriale esplicito

- I modelli di soluzione completi non vengono inventati: finché una lezione non contiene una soluzione editoriale ufficiale, Eve mostra e legge dopo il completamento soltanto i criteri di verifica già presenti.

## Verifiche della seconda fase

- suite completa: 29 file, 165/165 test superati;
- test finali mirati voce/tema: 6/6 superati;
- typecheck: superato;
- lint: superato senza errori (resta un warning preesistente e non correlato in `src/lib/vocabulary/mastery.ts`);
- build di produzione finale: superata.

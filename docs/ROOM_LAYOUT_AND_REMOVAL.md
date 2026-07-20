# Aula modulare e rimozione dei contenuti

## Layout

L'intestazione della stanza rimane sempre visibile. Sotto di essa, la barra strumenti
apre un solo pannello alla volta: Corsi, Materiali, Checklist, Progressi, Appunti,
Partecipanti o Attività recente. L'area di lavoro centrale resta dominante; sui dispositivi
piccoli i pannelli diventano cassetti a tutto schermo e si chiudono con il pulsante dedicato
o con `Escape`.

Timer e Chat sono widget flottanti indipendenti. Possono essere minimizzati senza perdere
lo stato. La preferenza del singolo utente, la stanza, lo strumento aperto e l'ultima
selezione vengono salvati localmente con una chiave separata per utente e stanza.

## Rimozione di un materiale

Dal menu del materiale, un utente autorizzato può chiedere la rimozione dall'aula. Prima
della conferma il server restituisce l'impatto: corso collegato, tipo, eventuale file
Storage e permessi. La procedura archivia il record, preserva attività e cronologia e
accoda la cancellazione del file soltanto quando nessun altro materiale attivo usa lo
stesso percorso.

## Rimozione di un corso

La conferma mostra quanti materiali, attività, progressi e importazioni del Catalogo sono
coinvolti. Sono disponibili due modalità:

- **Solo corso**: archivia il contenitore e scollega materiali e attività importate, senza
  cancellare progressi o cronologia.
- **Corso e contenuti**: archivia anche materiali e attività collegate; i progressi e gli
  eventi storici restano disponibili per riepiloghi e verifiche.

Il pacchetto originale nel Catalogo non viene mai cancellato. La relazione di importazione
con la stanza viene rimossa, così lo stesso percorso può essere importato di nuovo. Le
funzioni SQL sono transazionali e una seconda richiesta di rimozione restituisce successo
senza ripetere gli effetti.

## Autorizzazione e Storage

La route identifica l'utente dalla sessione Supabase e non accetta `userId` o percorsi
Storage dal browser. Owner e admin possono rimuovere i contenuti della stanza; un membro
può rimuovere solo ciò che ha creato. La stessa regola viene verificata nel database.

I file sono eliminati attraverso una coda privata, leggibile soltanto dal ruolo server.
La rimozione dall'interfaccia avviene subito tramite archiviazione; se Storage è
temporaneamente indisponibile, il job resta in attesa senza rendere nuovamente visibile il
materiale.

## Realtime e accessibilità

Le liste della stanza ignorano i record archiviati. Gli aggiornamenti Realtime delle
tabelle `courses`, `materials` e `tasks` fanno ricaricare i dati senza refresh; se il
materiale aperto viene rimosso da un altro partecipante, la selezione viene chiusa e appare
un avviso.

La barra espone `aria-expanded` e `aria-controls`. Le conferme usano un dialogo modale con
focus iniziale, focus trap, chiusura con `Escape` e ripristino del focus sul controllo che
le ha aperte.

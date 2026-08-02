# CORE-1.4 — Sicurezza del Context Builder

Il Context Builder non accetta identità, ruoli o permessi dichiarati dal client come
fonte di verità. L'utente viene ricavato dalla sessione Supabase server-side; aula,
corso, conversazione e materiali vengono rivalidati attraverso RLS e query vincolate
al `room_id`.

## Minimizzazione

- il contesto predefinito è `private`;
- il testo selezionato richiede un materiale CORE autorizzato;
- il testo condiviso è disattivato per impostazione predefinita;
- l'audit salva soltanto SHA-256, lunghezza, identificativi e conteggi;
- nessun testo selezionato o token firmato viene scritto nell'audit;
- i token hanno TTL breve e firma HMAC server-side.

## Ruoli

`room_members.role` continua a governare appartenenza e amministrazione. La tabella
`eve_room_roles` aggiunge soltanto ruoli didattici espliciti: `student`, `teacher`,
`author`, `admin`. Nessun ruolo viene assegnato per inferenza del modello.

## Divieti

- nessuna autorizzazione basata soltanto sulla UI;
- nessun riferimento cross-room;
- nessun materiale revocato o archiviato;
- nessuna persistenza del testo selezionato nei log;
- nessun segreto esposto nelle route o nella preview.

# CORE-1.3 — Database di produzione, migrazioni e RLS — PLAN

Stato iniziale: PLANNED. Dipendenza: CORE-1.2 preparato e INTELLIGENCE-0.3 preparato; applicazione Codex obbligatoriamente in sequenza.

Obiettivo: introdurre uno schema PostgreSQL/Supabase versionato per i dati Eve, mantenendo disattivati database e import finché backup, migrazione, RLS, test ruoli e rollback non sono verificati.

Incluso: schema 1.3.0, tabelle prompt/materiali/ricerca/conversazioni/audit/import, vincoli cross-room, indici, trigger, RLS, mapping SQLite, batch idempotenti, status server-side, preview simulata, rollback manuale bloccante.

Escluso: esecuzione sul Supabase remoto, import reale di dati utente, attivazione automatica, provider AI, embedding, produzione e cancellazioni.

Gate: migrazione su database temporaneo; test owner/admin/member/cross-room/service-role; backup e restore; import ripetuto; audit invariato; suite e desktop verdi; approvazione utente.

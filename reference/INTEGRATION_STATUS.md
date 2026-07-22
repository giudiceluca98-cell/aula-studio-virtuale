# Stato integrazione demo → applicazione ufficiale

Questo file separa chiaramente:

- funzionalità presenti nella demo canonica;
- funzionalità già integrate nell'app reale;
- funzionalità che richiedono verifica di parità.

Uno stato "presente" non significa automaticamente "identico alla demo".

Legenda:

- ✅ Integrato e verificato
- 🟡 Integrato, parità demo da verificare
- 🔵 Presente solo nella demo canonica
- ⚪ Da implementare

---

# Stato generale

Ultimo aggiornamento: 2026-07-22

Fonte riferimento:

`reference/demo-aula-studio-virtuale-canonica.html`

Documentazione:

- `CHANGELOG_DEMO.md`
- `DEMO_ARCHITECTURE.md`

---

# Aula e layout

## Layout aula a tre colonne

Stato: 🟡

Note:

- integrato nell'app reale tramite allineamento dell'aula alla demo;
- verificare ad ogni modifica futura che colonne, spaziature e responsive restino equivalenti.

Riferimento:

PR #57 — Allinea l’aula e il pannello Eve alla demo ufficiale.

---

# Eve

## Pannello Eve principale

Stato: 🟡

Integrato:

- pannello;
- minimizzazione;
- mascotte riapribile;
- scorrimento indipendente;
- configurazioni vocali.

Da verificare:

- comportamento grafico identico alla demo dopo nuove modifiche.

## Audio lezione Eve

Stato: 🟡

Integrato:

- scelta voce;
- velocità;
- modalità lettura;
- avanzamento;
- sincronizzazione testo;
- classificazione importanza.

Da verificare:

- corrispondenza completa dei colori e animazioni.

## Eve negli esercizi

Stato: 🟡

Integrato:

- lettura consegna;
- lettura testo selezionato;
- suggerimenti;
- gestione completamento.

Da verificare:

- flusso completo soluzione dopo completamento.

---

# Centro messaggi

Stato: 🟡

Integrato:

- lobby generale;
- chat private;
- gruppi;
- allegati;
- non letti;
- Realtime e Storage.

Da verificare:

- comportamento identico alla demo per finestre compresse e trascinamento.

Riferimento:

PR #43 — Aggiunge Futuristica Focus, centro messaggi ed Eve vocale.

---

# Progressi e missioni

Stato: 🟡

Integrato parzialmente:

- progressi lezione;
- stato completamento;
- pannelli dedicati.

Da verificare:

- barra orizzontale missioni della demo;
- comportamento icona mostra missioni;
- riduzione a icona.

---

# Moduli e lezioni

Stato: 🟡

Integrato:

- workspace lezioni;
- navigazione sezioni;
- contenuti ufficiali.

Da verificare:

- layout pannelli laterali rispetto alla demo canonica.

---

# Chat flottanti

Stato: 🟡

Integrato:

- minimizzazione;
- persistenza posizione;
- trascinamento tramite pointer events.

Da verificare:

- esperienza esatta stile Facebook Chat della demo.

---

# Cursore personalizzato

Stato: 🔵

Presente nella demo canonica.

Da integrare nell'app ufficiale solo dopo aver verificato accessibilità e compatibilità.

---

# Regola per Codex

Prima di modificare una funzione:

1. controllare questo file;
2. controllare `DEMO_ARCHITECTURE.md`;
3. controllare `CHANGELOG_DEMO.md`;
4. modificare il componente reale corretto;
5. aggiornare questo registro.

Mai sostituire una funzione reale backend con una simulazione demo.

---

# Prossimi controlli consigliati

1. confronto visivo completo demo/app;
2. verifica Eve completa;
3. verifica chat completa;
4. aggiornamento stato a ✅ solo dopo test manuale.

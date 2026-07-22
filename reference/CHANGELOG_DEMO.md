# Changelog demo canonica

Questo file registra tutte le modifiche apportate alla demo ufficiale di **Aula Studio Virtuale** nel branch `demo-canonica`.

La fonte eseguibile resta:

`reference/demo-aula-studio-virtuale-canonica.html`

## Regole di aggiornamento

Per ogni modifica futura:

1. aggiornare il file HTML canonico;
2. aggiungere una voce in cima a questo changelog;
3. indicare chiaramente cosa è stato aggiunto, modificato, corretto o rimosso;
4. registrare il nuovo SHA-256 e il nuovo Git blob SHA nel `README.md`;
5. non eliminare le versioni precedenti dal changelog;
6. distinguere sempre le modifiche della demo da quelle già trasferite nell'app ufficiale.

---

## [Non rilasciato]

### Aggiunto

- Nessuna modifica in attesa.

### Modificato

- Nessuna modifica in attesa.

### Corretto

- Nessuna modifica in attesa.

### Rimosso

- Nessuna modifica in attesa.

---

## [1.0.0] — 2026-07-22

### Importazione iniziale verificata

- Importata nel repository la demo canonica completa.
- Stabilito il branch `demo-canonica` come fonte visiva e funzionale ufficiale.
- Registrato il file `reference/demo-aula-studio-virtuale-canonica.html`.
- Verificata l'identità byte per byte con la versione locale approvata.

### Funzioni presenti nella versione canonica

- Portale di presentazione, dashboard e aula nello stesso file.
- Tema Futuristica Focus con area di lettura chiara e interfaccia esterna scura.
- Navigazione tra moduli, lezioni, esercizi, quiz, progetto e glossario.
- Pannello progressi e missioni comprimibile.
- Sidebar dei moduli comprimibile.
- Eve animata, contestuale e sempre visibile.
- Eve Voice con selezione compatta delle pagine, velocità, voce, anteprima, pausa e stop.
- Visualizzatore di frequenza e colori sincronizzati con la lettura.
- Lettura del testo selezionato negli esercizi.
- Guida vocale degli esercizi e lettura automatica delle soluzioni al completamento.
- Centro messaggi con lobby generale permanente.
- Chat private e di gruppo.
- Ricerca, filtri, badge dei non letti, allegati locali ed emoji.
- Chat minimizzabili in basso a destra in stile Facebook Chat.
- Correzione del trascinamento della finestra chat fuori dall'intestazione.
- Timer flottante, modali, drawer e preferenze persistenti.
- Cursore personalizzato a sfera con animazione di pressione e rilascio.
- Supporto responsive e `prefers-reduced-motion`.

### Identificatori

- Dimensione: `436216` byte
- Righe: `13145`
- SHA-256: `4727ddde31f968c5ecf9c931b303579c7ba27b2850f0fd407fc0ae72f8b4485a`
- Git blob SHA: `8beb580fbf16f87bbb9aaaef6c616067d12f259a`

### Stato integrazione app ufficiale

La presenza di una funzione in questo changelog non garantisce che sia già stata trasferita completamente nell'app Next.js. Codex deve confrontare la demo canonica con `main`, integrare una funzione per volta e verificare parità visiva, funzionale e responsive prima di dichiararla completata.

# INTELLIGENCE-0.2 — Piano: acquisizione web controllata e quarantena fonti

Data di avvio: 28 luglio 2026  
Branch: `eve-ai-studio`  
Approvazione: preventiva per avanzamento senza pause intermedie.

## Obiettivo

Consentire a Eve di acquisire in modo tracciato il contenuto di URL registrati nel centro ricerca, senza trasformarlo automaticamente in conoscenza approvata.

## Modello di sicurezza

- funzione di rete disattivata per impostazione predefinita;
- soli schemi HTTP e HTTPS;
- nessuna credenziale incorporata negli URL;
- sole porte standard 80 e 443;
- risoluzione DNS prima della richiesta;
- rifiuto di indirizzi privati, loopback, link-local, multicast, riservati o non globali;
- connessione fissata all'IP già verificato per ridurre il rischio di DNS rebinding;
- SNI e verifica TLS conservati per HTTPS;
- nessun proxy ereditato dall'ambiente;
- redirect limitati e ogni destinazione rivalidata;
- blocco del downgrade HTTPS → HTTP;
- timeout, limite byte e Content-Length;
- `Accept-Encoding: identity` e rifiuto di contenuti compressi inattesi;
- tipi MIME testuali ammessi in allowlist;
- controllo `robots.txt` con limite dedicato;
- errori di rete e robots irraggiungibile trattati in modo fail-closed;
- contenuto sempre non fidato e in quarantena.

## Persistenza

- eventi di acquisizione immutabili;
- URL richiesto e URL finale;
- catena dei redirect;
- indirizzi IP verificati;
- stato HTTP;
- MIME e dimensione;
- SHA-256 dei byte originali;
- testo estratto localmente;
- codici errore tipizzati;
- nessun header sensibile salvato;
- nessuna esecuzione di script, SVG o istruzioni documentali.

## API previste

```http
POST /v1/intelligence/research/projects/{project_id}/sources/{source_id}/acquire
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/acquisitions
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/document
```

## Escluso

- motore di ricerca generalista senza provider configurato;
- crawling ricorsivo;
- login, cookie o autenticazione web;
- JavaScript browser-side;
- PDF, Office, immagini, audio o video;
- approvazione automatica della fonte;
- inserimento automatico nei materiali CORE;
- embedding;
- generazione con modello AI;
- addestramento dei pesi del modello.

## Criteri di completamento

1. acquisitore di rete testabile con trasporto iniettabile;
2. protezioni SSRF e redirect coperte da test;
3. rispetto di robots coperto da test;
4. persistenza di eventi e documento in quarantena;
5. acquisizione possibile soltanto quando il flag server-side è attivo;
6. contenuto non promosso automaticamente a conoscenza;
7. API e isolamento per aula verificati;
8. preview canonica modulare aggiornata e verificata; nessun file standalone creato;
9. suite specifica e cumulativa verdi.

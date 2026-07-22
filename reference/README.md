# Demo canonica — Aula Studio Virtuale

Questa cartella ospita il riferimento visivo e funzionale usato per trasferire nella app Next.js ufficiale le funzioni sviluppate nella demo autonoma.

## File richiesto

Caricare in questa cartella il file con il nome esatto:

`demo-aula-studio-virtuale-canonica.html`

Versione sorgente locale verificata:

- nome originale: `demo-aula-studio-virtuale-eve-esercizi-vocali.html`
- dimensione: `436216` byte
- righe: `13145`
- SHA-256: `4727ddde31f968c5ecf9c931b303579c7ba27b2850f0fd407fc0ae72f8b4485a`

Dopo il caricamento verificare:

```bash
sha256sum reference/demo-aula-studio-virtuale-canonica.html
```

Il risultato deve coincidere esattamente con l'hash sopra.

## Uso da parte di Codex

La demo non deve sostituire la app ufficiale. Deve essere usata come specifica eseguibile per:

- layout e responsive;
- portale, dashboard e aula;
- progressi e missioni;
- sidebar e pannelli comprimibili;
- Eve Voice, selezione pagine e lettura automatica;
- assistenza vocale negli esercizi;
- chat completa e chat minimizzate;
- cursore personalizzato;
- timer, modali, drawer e persistenza della demo.

Ogni trasferimento nell'app Next.js deve preservare autenticazione, RLS, Realtime, routing e persistenza Supabase già presenti nel repository.

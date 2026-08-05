# Distribuzione desktop e aggiornamenti

## Risultato

Aula Studio Virtuale mantiene due distribuzioni dello stesso codice:

- **web**: le rotte modulari vengono pubblicate su Vercel;
- **desktop Windows**: Tauri crea un installer NSIS che usa la stessa demo
  canonica e controlla la presenza di release più recenti.

La fonte rimane sempre
`demo-aula-studio-virtuale-canonica.html`. La cartella `desktop-dist` è
generata e non va modificata o pubblicata manualmente.

## Perché serve un repository pubblico per le release

Il repository sorgente può restare privato. L'app installata, però, deve poter
leggere `latest.json` e scaricare l'installer senza contenere un token GitHub.
Inserire un token nell'app lo renderebbe recuperabile dagli utenti.

Per questo gli artefatti devono essere pubblicati in un secondo repository
GitHub **pubblico**, ad esempio:

`giudiceluca98-cell/aula-studio-virtuale-releases`

Quel repository contiene soltanto release, installer, firme e `latest.json`;
non contiene il sorgente privato.

La pagina web `/download` controlla l'ultima release pubblica attraverso l'API
pubblica di GitHub e collega automaticamente il primo installer Windows
disponibile. Prima della prima release mostra semplicemente che l'installer è
in preparazione.

## Preparazione una tantum

### 1. Creare il repository delle release

Creare un repository pubblico vuoto con branch predefinito `main`. Non
caricare lì il progetto.

### 2. Generare la coppia di firma Tauri

Eseguire su un computer fidato:

```powershell
pnpm install
pnpm tauri signer generate -w "$HOME\.tauri\aula-studio-virtuale.key"
```

Il comando produce:

- una **chiave privata**, che non deve mai essere committata, inviata in chat o
  inserita nel frontend;
- una **chiave pubblica**, che può essere condivisa e serve all'app per
  verificare gli aggiornamenti.

Conservare una copia offline della chiave privata e della relativa password.
Senza quella chiave non sarà possibile aggiornare in modo trasparente le copie
già installate.

### 3. Configurare il repository sorgente

In GitHub, in **Settings > Secrets and variables > Actions**, aggiungere:

Variabili:

- `AULA_RELEASE_OWNER`: proprietario del repository pubblico;
- `AULA_RELEASE_REPOSITORY`: nome del repository pubblico.

Secret:

- `AULA_RELEASE_TOKEN`: token con permesso `Contents: write` limitato al solo
  repository pubblico delle release;
- `TAURI_SIGNING_PRIVATE_KEY`: contenuto o percorso supportato della chiave
  privata Tauri;
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: password della chiave, se presente;
- `TAURI_UPDATER_PUBLIC_KEY`: contenuto della chiave pubblica.

Il workflow non scrive questi valori nei file web e non li espone all'app.

## Flusso per ogni nuova versione

1. Aggiornare la demo canonica e mantenere invariato il suo nome.
2. Allineare la stessa versione SemVer in:
   - `package.json`;
   - `src-tauri/Cargo.toml`;
   - `src-tauri/tauri.conf.json`;
   - metadati della demo e `VERSION.txt`.
3. Rigenerare e verificare:

   ```powershell
   pnpm build:web
   pnpm build:desktop
   pnpm release:check-version -- 1.4.0-alpha.12
   ```

4. Aprire l'anteprima IP e controllare portale, dashboard, Catalogo e aula.
5. Pubblicare lo stesso commit su Vercel e verificare il sito ufficiale.
6. Creare e inviare il tag corrispondente:

   ```powershell
   git tag v1.4.0-alpha.12
   git push origin v1.4.0-alpha.12
   ```

7. Il workflow GitHub:
   - verifica che tutte le versioni coincidano;
   - genera la configurazione updater senza commettere segreti;
   - crea l'installer Windows;
   - firma l'artefatto;
   - pubblica installer, firma e `latest.json` nel repository pubblico.

Le app installate controllano gli aggiornamenti all'avvio al massimo una volta
ogni sei ore. Il controllo manuale resta sempre disponibile. Il download parte
soltanto dopo la conferma dell'utente.

## Versioni alpha e stabili

Il livello di maturità resta nel numero SemVer, per esempio
`1.4.0-alpha.12`. Il workflow pubblica comunque la release GitHub come release
normale: l'endpoint statico `/releases/latest/download/latest.json` usato
dall'updater di Tauri ignora infatti le release marcate come prerelease. Prima
di distribuire una versione stabile conviene usare un numero senza suffisso,
per esempio `1.4.0`.

## Cosa non viene fatto automaticamente

- il workflow non modifica Supabase;
- il workflow non cambia variabili o progetto Vercel;
- il desktop non aggiorna l'app web;
- la pubblicazione di una release non sostituisce la verifica dell'anteprima;
- la firma Tauri dell'updater non sostituisce un eventuale certificato di firma
  del codice Windows. Senza certificato Windows può mostrare un avviso
  SmartScreen al primo avvio dell'installer.

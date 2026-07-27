# Aula Studio Virtuale

Questo repository pubblica come sito ufficiale la **demo canonica** di Aula Studio Virtuale.

## Versione pubblicata

- versione: `1.4.0-alpha.4`
- branch sorgente: `demo-canonica`
- file canonico: `demo-aula-studio-virtuale-canonica.html`

Il file canonico resta la fonte editoriale verificabile. Prima dell'anteprima o della pubblicazione viene trasformato in quattro ingressi indipendenti: portale, dashboard, catalogo e aula. In questo modo il browser scarica il markup, gli stili e il controller della sola pagina aperta.

## Struttura

- `demo-aula-studio-virtuale-canonica.html`: fonte canonica completa, non usata come ingresso pubblico;
- `tools/build-modular.mjs`: generatore deterministico delle pagine modulari;
- `index.html`: portale iniziale;
- `dashboard/index.html`: scrivania e gestione delle stanze;
- `catalog/index.html`: Catalogo ed Eve;
- `download/index.html`: pagina pubblica che individua l'installer Windows più recente;
- `room/index.html`: aula e strumenti di studio;
- `assets/css/`: fogli di stile filtrati per pagina;
- `assets/js/`: controller JavaScript separati per pagina;
- `assets/aula-cursor.svg`: cursore grafico nativo per la pagina;
- `assets/aula-pointer.svg`: variante nativa per pulsanti e collegamenti;
- `vercel.json`: configurazione minima di pubblicazione;
- `VERSION.txt`: riferimenti verificabili della versione;
- `README.md`: documentazione essenziale.

Il portale non carica più i dati del Catalogo o il motore dell'aula. La dashboard non carica il contenuto didattico. Il Catalogo carica le proprie schede soltanto sulla rotta `/catalog`. L'aula contiene esclusivamente il corso e gli strumenti che le appartengono.

## Generazione locale

Usare Node.js 20 o successivo:

```powershell
node tools/build-modular.mjs
```

I file generati vengono mantenuti nel repository per consentire a Vercel di pubblicare il progetto statico senza una fase di build remota. Non vanno modificati manualmente: ogni cambiamento parte dal file canonico o dal generatore.

## Aggiornamenti futuri

Ogni nuova versione deve:

1. provenire dal branch `demo-canonica`;
2. mantenere il nome `demo-aula-studio-virtuale-canonica.html`;
3. sostituire integralmente il file precedente;
4. rigenerare le quattro pagine con `tools/build-modular.mjs`;
5. aggiornare `VERSION.txt`;
6. verificare tutte le rotte in anteprima prima della pubblicazione.

## Applicazione installabile

La stessa demo canonica può essere distribuita anche come applicazione Windows
tramite Tauri. La versione desktop non contiene una seconda interfaccia: il
comando `build:desktop` rigenera le rotte dalla fonte canonica e copia nel
pacchetto soltanto portale, dashboard, Catalogo, aula e relativi asset.

```powershell
pnpm install
pnpm build:desktop
pnpm desktop:dev
```

L'installer Windows viene generato in formato NSIS:

```powershell
pnpm desktop:build
```

La build locale non include un canale di aggiornamento reale. Le release
ufficiali vengono invece firmate e configurate dal workflow GitHub
`.github/workflows/release-desktop.yml`. Nell'app installata il controllo è
disponibile dal pulsante con icona di trasmissione **Aggiornamenti** nell'aula
e da **Impostazioni > Applicazione desktop**. Non viene aggiunto un secondo
pulsante flottante. L'utente deve confermare il download e l'installazione.

La procedura completa, inclusa la configurazione sicura delle chiavi, è in
[`docs/DESKTOP_RELEASE.md`](docs/DESKTOP_RELEASE.md).

## Installazione per gli utenti

Sul sito sono disponibili i pulsanti **Installa app** e **Scarica per
Windows**. Dentro l'aula lo stesso collegamento si trova in
**Impostazioni > Applicazione per Windows**.

La pagina `/download` interroga le release pubbliche ufficiali di GitHub e
seleziona automaticamente l'installer `.exe` più recente. Se non esiste ancora
una release desktop, il pulsante resta disattivato e mostra un messaggio
esplicito. Non vengono inseriti token GitHub nel browser.

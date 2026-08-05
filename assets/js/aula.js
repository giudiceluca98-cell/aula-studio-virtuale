
const routeUrls = {
  presentation: "/",
  dashboard: "/dashboard",
  catalog: "/catalog",
  aula: "/room/"
};

function navigatePortal(route) {
  window.location.assign(routeUrls[route] || routeUrls.presentation);
}

function portalNotify(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(portalNotify.timeout);
  portalNotify.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function portalScrollTo(elementId) {
  const target = document.getElementById(elementId);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function portalDashboardOpenCatalogForRoom(roomId = "") {
  try {
    if (roomId) localStorage.setItem("aula-demo-catalog-room-context-v1", roomId);
  } catch {
    // Il Catalogo si apre comunque senza contesto persistente.
  }
  window.location.assign("/catalog?from=aula");
}


    const lessonSections = [
      {
        label: "Lezione 0.1 · Sezione 1 di 11",
        title: "Lezione 0.1 · Che cosa significa programmare?",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 1 di 11</div>
          <h1>Lezione 0.1 · Che cosa significa programmare?</h1>
          <p><strong>AULA STUDIO VIRTUALE</strong></p>
          <p>
            Programmare significa costruire una sequenza precisa di istruzioni che una macchina
            possa eseguire per ottenere un risultato.
          </p>
          <div class="callout">
            <strong>Idea fondamentale</strong>
            Il computer non interpreta liberamente ciò che intendiamo: applica regole e istruzioni
            nella forma in cui sono state definite.
          </div>
          <h2>Un obiettivo, dei dati, una procedura</h2>
          <p>Ogni semplice problema di programmazione può essere osservato attraverso quattro elementi:</p>
          <ol>
            <li>un obiettivo;</li>
            <li>dei dati iniziali;</li>
            <li>una procedura;</li>
            <li>un risultato.</li>
          </ol>
          <h3>Esempio: calcolare uno sconto</h3>
          <div class="code-block">prezzo = 100
sconto = 20
prezzo_finale = prezzo - prezzo * sconto / 100
print(prezzo_finale)</div>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 2 di 11",
        title: "Programmare non significa soltanto scrivere codice",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 2 di 11</div>
          <h1>Programmare non significa soltanto scrivere codice</h1>
          <p>
            Il codice è la parte visibile del programma, ma arriva dopo la comprensione del problema.
          </p>
          <h2>Prima del codice</h2>
          <ul>
            <li>comprendere il problema;</li>
            <li>individuare i dati;</li>
            <li>definire il risultato desiderato;</li>
            <li>scomporre il problema;</li>
            <li>considerare errori e casi limite.</li>
          </ul>
          <div class="callout">
            <strong>Controesempio</strong>
            “Controlla l'età e decidi” non è ancora una procedura sufficientemente precisa.
          </div>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 3 di 11",
        title: "Che cos'è un'istruzione?",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 3 di 11</div>
          <h1>Che cos'è un'istruzione?</h1>
          <p>Un'istruzione è un comando elementare che il computer può eseguire.</p>
          <div class="code-block">nome = "Andrea"
print(nome)</div>
          <p>
            La prima istruzione associa un valore a un nome. La seconda mostra quel valore.
          </p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 4 di 11",
        title: "Programma, applicazione, script e processo",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 4 di 11</div>
          <h1>Programma, applicazione, script e processo</h1>
          <p>
            Un programma è un insieme organizzato di istruzioni e dati. Quando viene avviato,
            il sistema operativo crea un processo.
          </p>
          <div class="callout">
            <strong>Diagramma</strong>
            Programma memorizzato → Avvio → Processo in esecuzione
          </div>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 5 di 11",
        title: "Algoritmi",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 5 di 11</div>
          <h1>Algoritmi</h1>
          <p>
            Un algoritmo è una procedura ordinata e finita che trasforma dati iniziali in un risultato.
          </p>
          <h2>Algoritmo e programma</h2>
          <p>L'algoritmo è la soluzione logica; il programma è la sua implementazione.</p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 6 di 11",
        title: "Input, elaborazione e output",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 6 di 11</div>
          <h1>Input, elaborazione e output</h1>
          <div class="callout"><strong>Modello</strong>INPUT → ELABORAZIONE → OUTPUT</div>
          <p>
            L'input rappresenta i dati ricevuti, l'elaborazione le operazioni applicate e l'output
            il risultato prodotto.
          </p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 7 di 11",
        title: "Stato e memoria",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 7 di 11</div>
          <h1>Stato e memoria</h1>
          <p>
            Lo stato è l'insieme delle informazioni correnti che il programma conserva durante
            l'esecuzione.
          </p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 8 di 11",
        title: "Sintassi e semantica",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 8 di 11</div>
          <h1>Sintassi e semantica</h1>
          <p>
            La sintassi stabilisce come deve essere scritto il codice. La semantica riguarda il
            significato delle istruzioni.
          </p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 9 di 11",
        title: "Decomposizione e astrazione",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 9 di 11</div>
          <h1>Decomposizione e astrazione</h1>
          <p>
            La decomposizione divide un problema complesso in parti più piccole; l'astrazione
            permette di concentrarsi sugli aspetti essenziali.
          </p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 10 di 11",
        title: "Casi limite ed errori",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 10 di 11</div>
          <h1>Casi limite ed errori</h1>
          <p>
            Un programma non deve essere verificato soltanto con dati semplici. I casi particolari
            possono rivelare errori nascosti.
          </p>
        `
      },
      {
        label: "Lezione 0.1 · Sezione 11 di 11",
        title: "Riepilogo della lezione",
        html: `
          <div class="document-section-label">Lezione 0.1 · Sezione 11 di 11</div>
          <h1>Riepilogo della lezione</h1>
          <p>Programmare significa trasformare un problema in una procedura precisa e verificabile.</p>
          <div class="callout">
            <strong>Criterio di comprensione</strong>
            Prova a spiegare con parole tue la differenza tra algoritmo, programma e processo.
          </div>
        `
      }
    ];



    const exerciseDefinitions = [
      {
        id: "distributor",
        kind: "Guidato",
        title: "Progetta un distributore di bevande",
        prompt: "Descrivi come dovrebbe comportarsi un distributore automatico dal momento in cui una persona sceglie una bevanda fino alla consegna del prodotto o al rimborso.",
        goal: "Organizza la risposta in input, elaborazione, output e casi limite. Il comportamento deve essere preciso e verificabile.",
        placeholder: "Input:\n\nElaborazione:\n\nOutput:\n\nCasi limite:",
        minimumChars: 90,
        hint: "Comincia dagli input: scelta della bevanda, denaro inserito, disponibilità e richiesta di annullamento. Poi chiediti cosa deve verificare il sistema prima di erogare il prodotto.",
        solutionHtml: `
          <h4>Struttura corretta</h4>
          <ul>
            <li><strong>Input:</strong> bevanda scelta, denaro o metodo di pagamento, disponibilità del prodotto, eventuale annullamento.</li>
            <li><strong>Elaborazione:</strong> verificare che la scelta esista, controllare scorte e prezzo, validare il pagamento, calcolare il resto, autorizzare l'erogazione e aggiornare la quantità disponibile.</li>
            <li><strong>Output:</strong> bevanda, resto, ricevuta o messaggio di conferma; in caso di errore, messaggio chiaro e rimborso.</li>
            <li><strong>Casi limite:</strong> prodotto esaurito, credito insufficiente, moneta non accettata, resto non disponibile, sportello bloccato, annullamento, pagamento duplicato o interruzione di corrente.</li>
          </ul>
          <p>Una sequenza valida è: ricevi la scelta, controlla disponibilità e prezzo, acquisisci il pagamento, verifica il credito, eroga la bevanda, restituisci il resto e aggiorna le scorte. Se un controllo fallisce, non erogare il prodotto e restituisci il denaro quando necessario.</p>
        `,
        solutionSpeech: "Una soluzione corretta è questa. Gli input sono la bevanda scelta, il denaro o metodo di pagamento, la disponibilità del prodotto e l'eventuale annullamento. L'elaborazione verifica che la scelta esista, controlla scorte e prezzo, valida il pagamento, calcola il resto, autorizza l'erogazione e aggiorna la quantità disponibile. Gli output sono la bevanda, il resto, una conferma oppure un messaggio di errore con rimborso. I casi limite comprendono prodotto esaurito, credito insufficiente, moneta non accettata, resto non disponibile, sportello bloccato, pagamento duplicato e interruzione di corrente. La regola fondamentale è non erogare mai il prodotto prima che tutti i controlli siano superati."
      },
      {
        id: "app-analysis",
        kind: "Autonomo",
        title: "Analizza un'applicazione che usi spesso",
        prompt: "Scegli un'applicazione reale e descrivila come sistema: quali dati riceve, quali operazioni esegue, quali risultati produce e quali errori deve gestire?",
        goal: "Dimostrare che anche un'app complessa può essere scomposta in input, elaborazione, output e casi limite.",
        placeholder: "Applicazione scelta:\n\nInput:\n\nElaborazione:\n\nOutput:\n\nPossibili errori:",
        minimumChars: 100,
        hint: "Puoi usare un'app di messaggistica. Considera testo digitato, destinatario, allegati e comandi come input; invio, sincronizzazione e notifiche come elaborazione.",
        solutionHtml: `
          <h4>Esempio corretto: app di messaggistica</h4>
          <ul>
            <li><strong>Input:</strong> testo, destinatario, file allegati, registrazione vocale, reazioni e comandi dell'utente.</li>
            <li><strong>Elaborazione:</strong> controllo del destinatario, preparazione e cifratura del messaggio, caricamento degli allegati, invio al server, sincronizzazione sui dispositivi e gestione delle conferme.</li>
            <li><strong>Output:</strong> messaggio nella conversazione, stato inviato/consegnato/letto, notifica al destinatario ed eventuale avviso di errore.</li>
            <li><strong>Casi limite:</strong> assenza di rete, file troppo grande, destinatario bloccato o inesistente, spazio insufficiente, invio duplicato, perdita della connessione durante il caricamento.</li>
          </ul>
          <p>Altre applicazioni sono valide se l'analisi mantiene la stessa precisione e distingue chiaramente dati in ingresso, trasformazioni e risultati.</p>
        `,
        solutionSpeech: "Una soluzione modello può usare un'app di messaggistica. Gli input sono il testo, il destinatario, gli allegati, le registrazioni vocali e i comandi dell'utente. L'elaborazione controlla il destinatario, prepara e protegge il messaggio, carica gli allegati, invia i dati, sincronizza i dispositivi e gestisce le conferme. Gli output sono il messaggio visualizzato, lo stato inviato, consegnato o letto, le notifiche e gli eventuali errori. I casi limite includono assenza di rete, file troppo grande, destinatario bloccato, spazio insufficiente, invio duplicato e perdita della connessione durante il caricamento. Anche un'altra app è corretta se l'analisi distingue con precisione input, elaborazione, output ed errori."
      },
      {
        id: "precise-algorithm",
        kind: "Autonomo",
        title: "Trasforma un algoritmo ambiguo",
        prompt: "Rendi precisa questa procedura: «Metti l'acqua sul fuoco, aggiungi la pasta, aspetta un po', scolala e servila». Specifica condizioni, quantità, ordine e criteri di fine.",
        goal: "Eliminare parole vaghe come “un po'” e rendere ogni passaggio eseguibile senza interpretazioni personali.",
        placeholder: "1. ...\n2. ...\n3. ...",
        minimumChars: 110,
        hint: "Definisci almeno: quantità d'acqua e pasta, condizione di ebollizione, tempo o criterio di cottura, gestione del sale e operazione finale.",
        solutionHtml: `
          <h4>Algoritmo preciso di riferimento</h4>
          <ol>
            <li>Versa 1 litro d'acqua in una pentola ogni 100 grammi di pasta.</li>
            <li>Metti la pentola sul fornello e porta l'acqua a ebollizione, riconoscibile da bolle continue su tutta la superficie.</li>
            <li>Aggiungi circa 10 grammi di sale per litro d'acqua.</li>
            <li>Versa la quantità stabilita di pasta e mescola per evitare che si attacchi.</li>
            <li>Imposta un timer usando il tempo indicato sulla confezione; assaggia un minuto prima della fine.</li>
            <li>Quando la consistenza desiderata è raggiunta, spegni il fornello e scola la pasta con uno scolapasta.</li>
            <li>Trasferisci la pasta nel recipiente di servizio e aggiungi il condimento previsto.</li>
          </ol>
          <p>Il punto centrale non è la ricetta: è la sostituzione di istruzioni vaghe con condizioni osservabili e quantità definite.</p>
        `,
        solutionSpeech: "Una versione precisa è questa. Versa un litro d'acqua ogni cento grammi di pasta. Porta l'acqua a ebollizione, cioè fino a quando compaiono bolle continue su tutta la superficie. Aggiungi circa dieci grammi di sale per litro. Versa la pasta e mescola. Imposta un timer con il tempo indicato sulla confezione e controlla la consistenza un minuto prima della fine. Quando la cottura desiderata è raggiunta, spegni il fornello, scola la pasta e trasferiscila nel recipiente di servizio. Questa soluzione è corretta perché sostituisce espressioni vaghe con quantità, condizioni osservabili e criteri di fine."
      },
      {
        id: "edge-cases",
        kind: "Autonomo",
        title: "Individua i casi limite",
        prompt: "Per il distributore automatico del primo esercizio, individua almeno cinque situazioni anomale che il progetto deve gestire senza perdere denaro, prodotto o informazioni.",
        goal: "Allenarsi a cercare ciò che può accadere fuori dal caso normale e definire una risposta sicura del sistema.",
        placeholder: "1. Caso limite — comportamento previsto\n2. ...",
        minimumChars: 100,
        hint: "Cerca problemi relativi a pagamento, scorte, resto, sensori, annullamento, rete e interruzione di corrente.",
        solutionHtml: `
          <h4>Casi limite corretti</h4>
          <ol>
            <li>La bevanda è esaurita: bloccare la selezione o proporre un'alternativa senza trattenere il denaro.</li>
            <li>Il credito è insufficiente: mostrare l'importo mancante e consentire integrazione o annullamento.</li>
            <li>Il resto non è disponibile: avvisare prima della conferma e accettare soltanto importi compatibili.</li>
            <li>La moneta o il pagamento non sono validi: rifiutare l'operazione senza modificare il credito.</li>
            <li>Il prodotto non cade: rilevare il guasto, evitare un secondo addebito e avviare rimborso o assistenza.</li>
            <li>L'utente annulla: restituire il credito e azzerare la sessione.</li>
            <li>Manca corrente durante l'operazione: registrare lo stato in modo sicuro e impedire addebiti duplicati al riavvio.</li>
            <li>Due comandi arrivano quasi insieme: elaborare una sola transazione e ignorare i duplicati.</li>
          </ol>
        `,
        solutionSpeech: "Ecco una soluzione corretta con più di cinque casi limite. Primo, bevanda esaurita: bloccare la selezione o proporre un'alternativa senza trattenere denaro. Secondo, credito insufficiente: indicare l'importo mancante e permettere integrazione o annullamento. Terzo, resto non disponibile: avvisare prima della conferma. Quarto, pagamento non valido: rifiutare l'operazione senza modificare il credito. Quinto, prodotto bloccato: evitare un secondo addebito e avviare rimborso o assistenza. Sesto, annullamento dell'utente: restituire il credito e azzerare la sessione. Settimo, interruzione di corrente: salvare lo stato e impedire addebiti duplicati. Ottavo, comandi duplicati: elaborare una sola transazione."
      }
    ];


    const viewTemplates = {
      exercises: ``,
      quiz: `
        <div class="document-section-label">Lezione 0.1 · Quiz</div>
        <h1>Quiz finale</h1>
        <p><strong>Qual è la differenza tra algoritmo e programma?</strong></p>
        <button class="quiz-option" type="button" onclick="selectQuiz(this, false)">Sono due parole equivalenti.</button>
        <button class="quiz-option" type="button" onclick="selectQuiz(this, true)">L'algoritmo è la procedura logica; il programma è la sua implementazione.</button>
        <button class="quiz-option" type="button" onclick="selectQuiz(this, false)">Il programma esiste solo durante l'esecuzione.</button>
        <div class="callout" id="quizFeedback" style="display:none"></div>
      `,
      project: `
        <div class="document-section-label">Lezione 0.1 · Python Project</div>
        <h1>Progetta un assistente per lo studio</h1>
        <p>
          Senza scrivere codice, definisci input, output, algoritmo, casi limite e funzioni
          principali di un assistente per lo studio.
        </p>
        <div class="project-box">
          <label for="projectText"><strong>Elaborato</strong></label>
          <textarea class="notes-textarea" id="projectText" placeholder="Scrivi qui il progetto..."></textarea>
          <button class="primary-small" type="button" onclick="submitProject()">Consegna progetto</button>
        </div>
      `,
      glossary: `
        <div class="document-section-label">Lezione 0.1 · Glossario</div>
        <h1>Glossario</h1>
        <h3>Programmazione</h3>
        <p>Processo di progettazione e realizzazione di istruzioni eseguibili.</p>
        <h3>Algoritmo</h3>
        <p>Procedura ordinata e finita che trasforma input in output.</p>
        <h3>Processo</h3>
        <p>Istanza di un programma durante l'esecuzione.</p>
        <h3>Sintassi</h3>
        <p>Insieme delle regole che definiscono la forma corretta del codice.</p>
        <h3>Semantica</h3>
        <p>Significato delle istruzioni.</p>
      `
    };

    const modalTemplates = {
      catalogo: {
        title: "Catalogo",
        html: `
          <p>Il Catalogo ora dispone di una vista completa integrata nella demo.</p>
          <button class="primary-small" type="button" onclick="closeModal(); navigatePortal('catalog')">Apri il Catalogo completo</button>
          <p style="margin-top:12px"><small>Ricerca, filtri, selezione e importazione restano locali e deterministici.</small></p>
          <div hidden>Trova percorsi, lezioni e materiali da importare nell'aula.</div>
          <div class="drawer-section">
            <h3>Programmazione da Zero</h3>
            <p>Corso editoriale nativo · Principiante assoluto</p>
            <button class="primary-small" type="button" onclick="showToast('Percorso già presente nell’aula')">Apri percorso</button>
          </div>
          <div class="drawer-section">
            <h3>Matematica da Zero</h3>
            <p>Percorso dalle basi al livello universitario introduttivo.</p>
            <button class="primary-small" type="button" onclick="showToast('Importazione simulata')">Importa nell'aula</button>
          </div>
        `
      },
      chiamata: {
        title: "Chiamata",
        html: `
          <p>La chiamata è simulata in questa demo UX.</p>
          <div class="drawer-section">
            <h3>Partecipanti disponibili</h3>
            <div class="list-row"><span class="avatar">L</span><div><strong>Luca</strong><br><small>Online</small></div></div>
            <div class="list-row"><span class="avatar">T</span><div><strong>Tatiana</strong><br><small>Online</small></div></div>
          </div>
          <button class="primary-small" type="button" onclick="showToast('Chiamata avviata nella simulazione')">Avvia chiamata</button>
        `
      },
      riepilogo: {
        title: "Riepilogo per Tatiana",
        html: `
          <div class="drawer-section">
            <h3>Tempo di studio</h3>
            <p>42 minuti attivi nella sessione simulata.</p>
          </div>
          <div class="drawer-section">
            <h3>Avanzamento</h3>
            <p><span id="summaryProgress">0</span>% della Lezione 0.1.</p>
          </div>
          <div class="drawer-section">
            <h3>Difficoltà rilevate</h3>
            <p>Nessuna difficoltà registrata nella demo.</p>
          </div>
          <p><small>Chat e chiamate non sono incluse nel riepilogo didattico.</small></p>
        `
      },
      impostazioni: {
        title: "Impostazioni della demo",
        html: `
          <div class="drawer-section">
            <h3>Aspetto</h3>
            <button class="primary-small" type="button" onclick="toggleDarkMode()">Attiva/disattiva modalità chiara</button>
          </div>
          <div class="drawer-section">
            <h3>Prestazioni grafiche</h3>
            <p>Scegli il livello di movimento e di effetti. La preferenza viene ricordata su questo dispositivo.</p>
            <div class="graphics-mode-grid" role="group" aria-label="Prestazioni grafiche">
              <button class="graphics-mode-option" type="button" data-graphics-mode="full" aria-pressed="false" onclick="setGraphicsMode('full')">
                <strong>Grafica completa</strong>
                <small>Tutti gli effetti visibili e cursore grafico nativo; le animazioni fuori schermo restano in pausa.</small>
              </button>
              <button class="graphics-mode-option" type="button" data-graphics-mode="optimized" aria-pressed="false" onclick="setGraphicsMode('optimized')">
                <strong>Grafica ottimizzata</strong>
                <small>Meno animazioni decorative e cursore grafico nativo.</small>
              </button>
              <button class="graphics-mode-option" type="button" data-graphics-mode="reduced" aria-pressed="false" onclick="setGraphicsMode('reduced')">
                <strong>Riduci animazioni</strong>
                <small>Movimenti essenziali, cursore di sistema e nessuna sfocatura dinamica.</small>
              </button>
            </div>
          </div>
          <div class="drawer-section">
            <h3>Layout</h3>
            <button type="button" onclick="resetDemo()">Ripristina stato iniziale</button>
          </div>
          <div class="drawer-section" data-web-install>
            <h3>Applicazione per Windows</h3>
            <p>Scarica e installa Aula Studio Virtuale sul computer. Gli aggiornamenti successivi saranno disponibili direttamente nell'app.</p>
            <a class="primary-small desktop-install-link" data-web-install href="/download">Installa app per Windows</a>
          </div>
        `
      }
    };

    const state = {
      currentSection: 0,
      currentView: "lesson",
      completedSections: new Set(),
      exerciseSaved: false,
      exerciseDrafts: {},
      exerciseCompletedIds: [],
      activeExerciseId: "distributor",
      quizCorrect: false,
      projectSubmitted: false,
      notes: "",
      timerSeconds: 0,
      timerRunning: false,
      timerPomodoro: false,
      audioRate: 1,
      audioVoiceURI: "",
      audioMode: "faithful",
      audioScope: "section",
      audioSelectedSections: lessonSections.map((_, index) => index),
      evePanelCollapsed: false,
      eveDetachEnabled: false,
      progressMissionsExpanded: false,
      modulesPanelCollapsed: false,
      graphicsMode: "optimized",
      chat: null
    };

    const drawerTemplates = {
      corsi: {
        title: "Corsi",
        html: `
          <div class="drawer-section">
            <h3>Programmazione da Zero</h3>
            <p>Modulo 0 · 1 lezione pubblicata</p>
            <button class="primary-small" type="button" onclick="closeDrawer(); showToast('Corso aperto')">Apri</button>
          </div>
          <div class="drawer-section">
            <h3>Matematica da Zero</h3>
            <p>Modulo 0 · In preparazione</p>
            <button type="button" onclick="showToast('Corso rimosso solo dalla demo')">Rimuovi dall'aula</button>
          </div>
        `
      },
      materiali: {
        title: "Materiali",
        html: `
          <div class="drawer-section">
            <input style="width:100%;padding:11px;border:1px solid var(--line);border-radius:10px;background:var(--surface-strong);color:var(--ink)" placeholder="Cerca materiali">
          </div>
          <div class="drawer-section">
            <h3>Materiali disponibili</h3>
            <div class="list-row"><span>▣</span><div><strong>Che cosa significa programmare?</strong><br><small>Lezione nativa</small></div></div>
            <div class="list-row"><span>▧</span><div><strong>Dispensa introduttiva.pdf</strong><br><small>PDF interno</small></div></div>
            <div class="list-row"><span>▶</span><div><strong>Algoritmi e istruzioni</strong><br><small>Video interno</small></div></div>
          </div>
        `
      },
      checklist: {
        title: "Checklist",
        html: `
          <div class="drawer-section">
            <label><input type="checkbox"> Leggi la Lezione 0.1</label>
          </div>
          <div class="drawer-section">
            <label><input type="checkbox"> Completa gli esercizi</label>
          </div>
          <div class="drawer-section">
            <label><input type="checkbox"> Completa il quiz</label>
          </div>
          <div class="drawer-section">
            <label><input type="checkbox"> Consegna il progetto</label>
          </div>
        `
      },
      progressi: {
        title: "Progressi",
        html: `
          <div class="drawer-section">
            <h3>Lezione 0.1</h3>
            <div class="progress-track"><span style="width:${getProgress()}%"></span></div>
            <p>${getProgress()}% completato</p>
          </div>
          <div class="drawer-section">
            <h3>Attività</h3>
            <p>Esercizi: ${state.exerciseSaved ? "salvati" : "non completati"}</p>
            <p>Quiz: ${state.quizCorrect ? "superato" : "non superato"}</p>
            <p>Progetto: ${state.projectSubmitted ? "consegnato" : "non consegnato"}</p>
          </div>
        `
      },
      appunti: {
        title: "Appunti",
        html: `
          <p>Gli appunti restano privati e non entrano automaticamente nel contesto del tutor.</p>
          <textarea class="notes-textarea" id="privateNotes" placeholder="Scrivi appunti personali...">${escapeHtml(state.notes)}</textarea>
          <button class="primary-small" type="button" onclick="saveNotes()">Salva appunti</button>
        `
      },
      partecipanti: {
        title: "Partecipanti",
        html: `
          <div class="list-row"><span class="avatar">L</span><div><strong>Luca</strong><br><small>Sta leggendo · Timer 00:42:18</small></div></div>
          <div class="list-row"><span class="avatar">T</span><div><strong>Tatiana</strong><br><small>Sta svolgendo esercizi · 61%</small></div></div>
          <div class="list-row"><span class="avatar" style="background:#899188">A</span><div><strong>Andrea</strong><br><small>Assente</small></div></div>
        `
      },
      attivita: {
        title: "Attività recente",
        html: `
          <div class="list-row"><span>●</span><div><strong>Lezione aperta</strong><br><small>Adesso</small></div></div>
          <div class="list-row"><span>●</span><div><strong>Posizione ripristinata</strong><br><small>Sezione ${state.currentSection + 1}</small></div></div>
          <div class="list-row"><span>●</span><div><strong>${state.completedSections.size} sezioni comprese</strong><br><small>Sessione corrente</small></div></div>
        `
      }
    };

    const documentContent = document.getElementById("documentContent");
    const progressBar = document.getElementById("progressBar");
    const progressPercent = document.getElementById("progressPercent");
    const progressTrackDetailed = document.getElementById("progressTrackDetailed");
    const progressObjectiveCount = document.getElementById("progressObjectiveCount");
    const progressReadingBar = document.getElementById("progressReadingBar");
    const progressReadingStatus = document.getElementById("progressReadingStatus");
    const progressExerciseStatus = document.getElementById("progressExerciseStatus");
    const progressQuizStatus = document.getElementById("progressQuizStatus");
    const progressProjectStatus = document.getElementById("progressProjectStatus");
    const progressNextGoal = document.getElementById("progressNextGoal");
    const progressGoalReading = document.getElementById("progressGoalReading");
    const progressGoalExercise = document.getElementById("progressGoalExercise");
    const progressGoalQuiz = document.getElementById("progressGoalQuiz");
    const progressGoalProject = document.getElementById("progressGoalProject");
    const autosaveLabel = document.getElementById("autosaveLabel");
    const audioLessonStatus = document.getElementById("audioLessonStatus");
    const audioLessonProgress = document.getElementById("audioLessonProgress");
    const audioPlayButton = document.getElementById("audioPlayButton");
    const audioPlayButtonLabel = document.getElementById("audioPlayButtonLabel");
    const audioScopeNote = document.getElementById("audioScopeNote");
    const audioPageSelector = document.getElementById("audioPageSelector");
    const audioPageChecklist = document.getElementById("audioPageChecklist");
    const audioPageSelectionSummary = document.getElementById("audioPageSelectionSummary");
    const audioVoice = document.getElementById("audioVoice");
    const audioRate = document.getElementById("audioRate");
    const audioMode = document.getElementById("audioMode");
    const audioScope = document.getElementById("audioScope");
    const eveVoiceConsole = document.getElementById("eveVoiceConsole");
    const learningLayout = document.querySelector(".learning-layout");
    const tutorColumn = document.querySelector(".tutor-column");
    const eveAssistantCard = document.getElementById("eveAssistantCard");
    const evePanelMinimize = document.getElementById("evePanelMinimize");
    const eveDetachToggle = document.getElementById("eveDetachToggle");
    const evePanelToggle = document.getElementById("evePanelToggle");
    const eveRestFace = document.getElementById("eveRestFace");
    const readerArea = document.querySelector(".reader-area");
    const pageScroll = document.querySelector(".page-scroll");
    const eveVoiceTitle = document.getElementById("eveVoiceTitle");
    const exerciseVoiceMode = document.getElementById("exerciseVoiceMode");
    const exerciseVoiceCounter = document.getElementById("exerciseVoiceCounter");
    const exerciseVoiceCurrentTitle = document.getElementById("exerciseVoiceCurrentTitle");
    const exerciseVoiceCurrentStatus = document.getElementById("exerciseVoiceCurrentStatus");
    const exerciseSelectionPreview = document.getElementById("exerciseSelectionPreview");
    const exerciseReadSelectionButton = document.getElementById("exerciseReadSelectionButton");
    const exerciseFinishVoiceButton = document.getElementById("exerciseFinishVoiceButton");
    const exerciseFinishVoiceLabel = document.getElementById("exerciseFinishVoiceLabel");
    const exerciseAudioRate = document.getElementById("exerciseAudioRate");
    const exerciseAudioVoice = document.getElementById("exerciseAudioVoice");
    const exerciseVoicePlayButton = document.getElementById("exerciseVoicePlayButton");
    const exerciseVoicePlayLabel = document.getElementById("exerciseVoicePlayLabel");
    const exerciseNextSuggestion = document.getElementById("exerciseNextSuggestion");
    const exerciseSelectionToolbar = document.getElementById("exerciseSelectionToolbar");

    const eveAttentionVisualizer = document.getElementById("eveAttentionVisualizer");
    const eveFrequencyBars = document.getElementById("eveFrequencyBars");
    const eveFrequencyLevel = document.getElementById("eveFrequencyLevel");
    const eveFrequencyTopic = document.getElementById("eveFrequencyTopic");
    const eveAssistant = document.getElementById("eveAssistant");
    const eveHelperTitle = document.getElementById("eveHelperTitle");
    const eveHelperText = document.getElementById("eveHelperText");
    const eveMascotAvailable = Boolean(eveAssistant && eveHelperTitle && eveHelperText);

    const exerciseSpeechState = {
      speaking: false,
      paused: false,
      utterance: null,
      currentText: "",
      currentLabel: "",
      currentKind: "",
      activeExerciseId: null,
      selectedText: "",
      selectedSourceElement: null,
      activeElement: null,
      block: null,
      selectionCaptureTimer: null
    };

    const audioLessonState = {
      queue: [],
      index: 0,
      speaking: false,
      paused: false,
      voices: [],
      utterance: null,
      frequencyTimer: null,
      activeFocus: "standard",
      activeImportance: 1,
      activeElement: null,
      activeBlock: null,
      mascotPositionFrame: null,
      scope: "section",
      startSection: 0,
      selectedSections: []
    };


    function setAudioPlayButtonState(stateName = "play") {
      if (!audioPlayButton) return;
      const pauseState = stateName === "pause";
      const label = pauseState ? "Pausa" : "Riproduci";
      audioPlayButton.dataset.audioState = pauseState ? "pause" : "play";
      audioPlayButton.setAttribute("aria-label", pauseState ? "Metti in pausa l’Audio-lezione" : "Riproduci o riprendi l’Audio-lezione");
      audioPlayButton.title = label;
      if (audioPlayButtonLabel) audioPlayButtonLabel.textContent = label;
    }

    function normalizedAudioSelectedSections() {
      const source = Array.isArray(state.audioSelectedSections)
        ? state.audioSelectedSections
        : [];
      return [...new Set(source.map(Number))]
        .filter((index) => Number.isInteger(index) && index >= 0 && index < lessonSections.length)
        .sort((a, b) => a - b);
    }

    function audioPageTitle(index) {
      return lessonSections[index]?.title || `Pagina ${index + 1}`;
    }

    function renderAudioPageSelection() {
      if (!audioPageSelector || !audioPageChecklist || !audioPageSelectionSummary) return;
      const selected = normalizedAudioSelectedSections();
      state.audioSelectedSections = selected;
      const customMode = audioScope?.value === "custom";
      audioPageSelector.classList.toggle("hidden", !customMode);

      audioPageChecklist.innerHTML = lessonSections.map((section, index) => {
        const checked = selected.includes(index);
        const pageLabel = `Pagina ${index + 1}: ${audioPageTitle(index)}`;
        return `
          <label
            class="audio-page-choice${checked ? " selected" : ""}"
            title="${escapeHtml(pageLabel)}"
          >
            <input
              type="checkbox"
              aria-label="${escapeHtml(pageLabel)}"
              ${checked ? "checked" : ""}
              onchange="toggleAudioPageSelection(${index}, this.checked)"
            >
            <span class="audio-page-choice-number">${index + 1}</span>
          </label>`;
      }).join("");

      if (!selected.length) {
        audioPageSelectionSummary.textContent = "Nessuna pagina selezionata";
        audioPageSelectionSummary.classList.add("warning");
      } else {
        const sequence = selected.map((index) => index + 1).join(", ");
        audioPageSelectionSummary.textContent = `${selected.length} ${selected.length === 1 ? "pagina selezionata" : "pagine selezionate"} · ordine: ${sequence}`;
        audioPageSelectionSummary.classList.remove("warning");
      }
    }

    function toggleAudioPageSelection(index, checked) {
      const selected = new Set(normalizedAudioSelectedSections());
      if (checked) selected.add(index);
      else selected.delete(index);
      state.audioSelectedSections = [...selected].sort((a, b) => a - b);
      renderAudioPageSelection();
      saveState();
      if (audioLessonState.speaking && audioScope.value === "custom") {
        syncAudioPreferences();
      }
    }

    function setAllAudioPages(enabled) {
      state.audioSelectedSections = enabled
        ? lessonSections.map((_, index) => index)
        : [];
      renderAudioPageSelection();
      saveState();
      if (audioLessonState.speaking && audioScope.value === "custom") {
        syncAudioPreferences();
      }
    }

    function selectAudioPagesFromCurrent() {
      state.audioSelectedSections = lessonSections
        .map((_, index) => index)
        .filter((index) => index >= state.currentSection);
      renderAudioPageSelection();
      saveState();
      if (audioLessonState.speaking && audioScope.value === "custom") {
        syncAudioPreferences();
      }
    }

    function updateAudioScopeNote() {
      if (!audioScopeNote || !audioScope) return;
      const notes = {
        section: "Legge soltanto la pagina visualizzata e si ferma alla fine.",
        custom: "Legge in sequenza soltanto le pagine selezionate e cambia pagina automaticamente, senza fermarsi.",
        lesson: "Legge tutte le pagine dall’inizio alla fine e passa automaticamente alla successiva."
      };
      audioScopeNote.textContent = notes[audioScope.value] || notes.section;
      renderAudioPageSelection();
    }

    function shouldDetachEveToReading() {
      return Boolean(
        state.eveDetachEnabled &&
        state.evePanelCollapsed &&
        (audioLessonState.speaking || exerciseSpeechState.speaking) &&
        audioLessonState.activeElement
      );
    }

    function applyEveDetachState() {
      if (!learningLayout || !eveDetachToggle) return;
      const enabled = Boolean(state.eveDetachEnabled);
      learningLayout.classList.toggle("eve-detach-enabled", enabled);
      eveDetachToggle.setAttribute("aria-pressed", String(enabled));
      eveDetachToggle.textContent = enabled ? "Sgancio attivo" : "Sgancia durante audio";
      refreshReadingMascotPosition();
      syncRestingEvePresence();
    }

    function applyEvePanelState() {
      if (!learningLayout || !tutorColumn || !eveAssistantCard || !evePanelToggle) return;
      const collapsed = Boolean(state.evePanelCollapsed);
      learningLayout.classList.toggle("eve-panel-collapsed", collapsed);
      tutorColumn.classList.toggle("eve-panel-collapsed", collapsed);
      eveAssistantCard.classList.toggle("is-panel-collapsed", collapsed);
      evePanelToggle.setAttribute("aria-expanded", String(!collapsed));
      evePanelToggle.setAttribute(
        "aria-label",
        collapsed ? "Riapri il pannello di Eve" : "Eve a riposo"
      );
      if (evePanelMinimize) evePanelMinimize.setAttribute("aria-hidden", String(collapsed));
      window.setTimeout(refreshReadingMascotPosition, 320);
      window.setTimeout(syncRestingEvePresence, 330);
    }

    function toggleEvePanel() {
      state.evePanelCollapsed = !state.evePanelCollapsed;
      applyEvePanelState();
      saveState();
      showToast(state.evePanelCollapsed ? "Pannello di Eve minimizzato" : "Pannello di Eve riaperto");
    }

    function openEvePanelFromMascot() {
      if (!state.evePanelCollapsed) return;
      state.evePanelCollapsed = false;
      applyEvePanelState();
      saveState();
      showToast("Pannello di Eve riaperto");
    }

    function toggleEveDetach() {
      state.eveDetachEnabled = !state.eveDetachEnabled;
      applyEveDetachState();
      saveState();
      showToast(
        state.eveDetachEnabled
          ? "Sgancio attivo: con il pannello chiuso Eve seguirà il testo"
          : "Sgancio disattivato"
      );
    }

    function resetRestingEveGaze() {
      if (!eveRestFace) return;
      eveRestFace.style.setProperty("--eve-gaze-x", "0px");
      eveRestFace.style.setProperty("--eve-gaze-y", "0px");
      eveRestFace.querySelectorAll(".eve-rest-pupil").forEach((pupil) => {
        pupil.style.transform = "translate(0px, 0px)";
      });
    }

    function syncRestingEvePresence() {
      if (!evePanelToggle || !eveAssistant) return;
      const detachedReading = shouldDetachEveToReading();
      evePanelToggle.classList.toggle("is-reading", detachedReading);
      if (detachedReading) resetRestingEveGaze();
    }

    const eveContexts = {
      lesson: {
        zone: "eve-zone-lesson",
        title: "Ti seguo nella lettura",
        text: "Posso aiutarti a capire i concetti chiave, ricordarti dove ti sei fermato e suggerirti il prossimo passo."
      },
      exercises: {
        zone: "eve-zone-exercises",
        title: "Esercizi sotto controllo",
        text: "Sono qui mentre ti eserciti: posso ricordarti cosa salvare e quali passaggi ripassare."
      },
      quiz: {
        zone: "eve-zone-quiz",
        title: "Ti aiuto nel quiz",
        text: "Posso richiamare i concetti più importanti, evidenziare gli errori e guidarti verso la risposta giusta."
      },
      project: {
        zone: "eve-zone-project",
        title: "Supporto nel progetto",
        text: "Mentre costruisci il progetto finale posso aiutarti a mantenere ordine, obiettivi e casi limite."
      },
      glossary: {
        zone: "eve-zone-glossary",
        title: "Glossario assistito",
        text: "Quando studi i termini, Eve resta vicina per facilitare memoria, definizioni e collegamenti."
      },
      corsi: {
        zone: "eve-zone-corsi",
        title: "Organizziamo i corsi",
        text: "Posso aiutarti a scegliere il percorso giusto e tenere il catalogo dell'aula più ordinato."
      },
      materiali: {
        zone: "eve-zone-materiali",
        title: "Gestione materiali",
        text: "Ti seguo mentre apri materiali, PDF, video e lezioni, così tutto resta dentro il workspace."
      },
      checklist: {
        zone: "eve-zone-checklist",
        title: "Checklist sempre con te",
        text: "Spunto vicino alle attività da completare per ricordarti cosa fare e in quale ordine."
      },
      progressi: {
        zone: "eve-zone-progressi",
        title: "Leggo i tuoi progressi",
        text: "Posso mostrarti dove stai migliorando e quali attività conviene riprendere prima."
      },
      appunti: {
        zone: "eve-zone-appunti",
        title: "Appunti e idee",
        text: "Resto vicina agli appunti per aiutarti a non perdere intuizioni, ma senza invadere il privato."
      },
      partecipanti: {
        zone: "eve-zone-partecipanti",
        title: "Studio condiviso",
        text: "Posso coordinare la presenza e dare contesto su chi sta leggendo o svolgendo attività."
      },
      attivita: {
        zone: "eve-zone-attivita",
        title: "Attività recente",
        text: "Appaio accanto agli eventi utili per spiegarti subito cosa è successo nella stanza."
      },
      audio: {
        zone: "eve-zone-audio",
        title: "Sto leggendo con te",
        text: "Durante l'audio-lezione resto vicina al player e accompagno la riproduzione passo dopo passo."
      }
    };

    const eveZoneClasses = Object.values(eveContexts).map((context) => context.zone);

    function setEveContext(key) {
      if (!eveMascotAvailable) return;
      const context = eveContexts[key] || eveContexts.lesson;
      eveAssistant.classList.remove(...eveZoneClasses);
      eveAssistant.classList.add(context.zone);
      eveHelperTitle.textContent = context.title;
      eveHelperText.textContent = context.text;
      eveAssistant.dataset.context = key;
      eveAssistant.classList.toggle("wink", key === "quiz" || key === "progressi");
    }

    function toggleEveAssistant() {
      if (!eveMascotAvailable) return;
      eveAssistant.classList.toggle("collapsed");
      if (!eveAssistant.classList.contains("collapsed")) {
        showToast("Eve è pronta ad aiutarti");
      }
    }

    function askEveContextualHelp() {
      if (!eveMascotAvailable) return;
      const context = eveAssistant.dataset.context || state.currentView || "lesson";
      const messages = {
        lesson: "Eve: inizia dai concetti principali e segna come comprese le sezioni che sai spiegare.",
        exercises: "Eve: completa una risposta per volta e salva l'esercizio appena hai finito.",
        quiz: "Eve: rileggi la differenza tra algoritmo e programma prima di rispondere.",
        project: "Eve: prova a dividere il progetto in input, elaborazione, output e casi limite.",
        glossary: "Eve: collega ogni definizione a un esempio pratico, così la memorizzi meglio.",
        checklist: "Eve: completa prima la lettura, poi esercizi, quiz e progetto.",
        progressi: "Eve: stai già avanzando. Guarda cosa manca per arrivare al completamento della lezione.",
        appunti: "Eve: salva subito le intuizioni utili, così potrai riprenderle dopo.",
        materiali: "Eve: apri tutto nel workspace per non perdere il contesto di studio.",
        corsi: "Eve: scegli un percorso chiaro e non aggiungere troppi corsi insieme.",
        partecipanti: "Eve: osserva cosa stanno facendo gli altri per allineare meglio il ritmo di studio.",
        attivita: "Eve: controlla gli eventi recenti per capire cosa è cambiato nella stanza.",
        audio: "Eve: con l'audio-lezione puoi ascoltare e seguire il passaggio evidenziato nello stesso momento."
      };
      showToast(messages[context] || messages.lesson);
    }


    function setMascotSpeechContent(block) {
      if (!eveMascotAvailable || !block) return;
      eveAssistant.dataset.audioFocus = block.focus || "standard";
      eveAssistant.dataset.context = "audio";
    }

    function hideDetachedReadingMascot(clearActive = false) {
      if (!eveMascotAvailable) return;
      if (audioLessonState.mascotPositionFrame) {
        window.cancelAnimationFrame(audioLessonState.mascotPositionFrame);
        audioLessonState.mascotPositionFrame = null;
      }
      eveAssistant.classList.remove(
        "eve-follow-reading",
        "eve-place-left",
        "eve-paused",
        "eve-detached-active"
      );
      eveAssistant.style.removeProperty("--eve-follow-left");
      eveAssistant.style.removeProperty("--eve-follow-top");
      eveAssistant.style.removeProperty("--eve-follow-viewport-top");
      if (clearActive) {
        audioLessonState.activeElement = null;
        audioLessonState.activeBlock = null;
        eveAssistant.removeAttribute("data-audio-focus");
      }
      syncRestingEvePresence();
    }

    function visibleRightSideObstacles(mascotLeft, mascotRight) {
      const candidates = [
        document.getElementById("timerPanel"),
        document.getElementById("chatPanel"),
        state.evePanelCollapsed ? evePanelToggle : null
      ].filter(Boolean);

      return candidates
        .filter((node) => !node.classList.contains("hidden"))
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0 && rect.right >= mascotLeft && rect.left <= mascotRight)
        .map((rect) => ({ top: rect.top - 10, bottom: rect.bottom + 10 }))
        .sort((a, b) => a.top - b.top);
    }

    function safestMascotTop(desiredTop, mascotHeight, obstacles) {
      const viewportTop = 86;
      const viewportBottom = window.innerHeight - 14;
      const intervals = [];
      let cursor = viewportTop;

      obstacles.forEach((obstacle) => {
        const end = Math.min(viewportBottom, obstacle.top);
        if (end - cursor >= mascotHeight) intervals.push([cursor, end - mascotHeight]);
        cursor = Math.max(cursor, obstacle.bottom);
      });
      if (viewportBottom - cursor >= mascotHeight) intervals.push([cursor, viewportBottom - mascotHeight]);

      if (!intervals.length) return Math.max(viewportTop, Math.min(viewportBottom - mascotHeight, desiredTop));

      let best = intervals[0][0];
      let bestDistance = Infinity;
      intervals.forEach(([min, max]) => {
        const candidate = Math.max(min, Math.min(max, desiredTop));
        const distance = Math.abs(candidate - desiredTop);
        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      });
      return best;
    }

    function positionEveBesideReading(element, block) {
      if (!eveMascotAvailable || !element) return;
      if (eveAssistant.parentElement !== document.body) {
        document.body.appendChild(eveAssistant);
      }
      audioLessonState.activeElement = element;
      audioLessonState.activeBlock = block || null;
      setMascotSpeechContent(block);

      if (!shouldDetachEveToReading()) {
        hideDetachedReadingMascot(false);
        return;
      }

      eveAssistant.classList.add("eve-follow-reading", "eve-detached-active");
      eveAssistant.classList.remove("collapsed", "eve-place-left");

      if (audioLessonState.mascotPositionFrame) {
        window.cancelAnimationFrame(audioLessonState.mascotPositionFrame);
      }

      audioLessonState.mascotPositionFrame = window.requestAnimationFrame(() => {
        const targetRect = element.getBoundingClientRect();
        const assistantRect = eveAssistant.getBoundingClientRect();
        const mascotWidth = assistantRect.width || (window.innerWidth <= 760 ? 62 : 76);
        const mascotHeight = assistantRect.height || (window.innerWidth <= 760 ? 62 : 76);
        const right = window.innerWidth <= 760 ? 7 : 12;
        const mascotLeft = window.innerWidth - right - mascotWidth;
        const mascotRight = window.innerWidth - right;
        const desiredTop = targetRect.top + (targetRect.height - mascotHeight) / 2;
        const obstacles = visibleRightSideObstacles(mascotLeft, mascotRight);
        const top = safestMascotTop(desiredTop, mascotHeight, obstacles);
        eveAssistant.style.setProperty("--eve-follow-viewport-top", `${Math.round(top)}px`);
        syncRestingEvePresence();
      });
    }

    function refreshReadingMascotPosition() {
      if (!(audioLessonState.speaking || exerciseSpeechState.speaking) || !audioLessonState.activeElement) {
        hideDetachedReadingMascot(false);
        return;
      }
      positionEveBesideReading(audioLessonState.activeElement, audioLessonState.activeBlock);
    }

    function resetReadingMascot() {
      hideDetachedReadingMascot(true);
    }



    function updateThemeCursorMode() {
      document.body.classList.add("native-cursor-enabled");
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
    }

    updateThemeCursorMode();

    function hideThemeCursor() {
      /* Il cursore personalizzato è disattivato in tutte le modalità. */
    }

















    /* ==========================================================
       MATERIALI — SELETTORE E WORKSPACE LOCALE
       ========================================================== */

    const aulaMaterialsPanelStorageKey = "aula-demo-materials-panel-v1";

    const aulaMaterialsPanelData = [
      {
        id: "native-programming-lesson",
        title: "Che cosa significa programmare?",
        description: "Lezione nativa completa del percorso Programmazione da Zero.",
        course: "Programmazione da Zero",
        kind: "lesson",
        kindLabel: "Lezione nativa",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 36,
        progressLabel: "4 di 11 sezioni",
        icon: "▣",
        viewerReady: true
      },
      {
        id: "python-introduction-txt",
        title: "Introduzione a Python · appunti TXT",
        description: "Testo condiviso con definizioni, esempi e riferimenti alla prima esercitazione.",
        course: "Programmazione da Zero",
        kind: "text",
        kindLabel: "Testo",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 42,
        progressLabel: "Ripresa disponibile",
        icon: "T",
        viewerReady: false
      },
      {
        id: "chapter-one-exercises-pdf",
        title: "Esercizi · Capitolo 1",
        description: "PDF condiviso con esercizi progressivi e casi limite da verificare.",
        course: "Programmazione da Zero",
        kind: "pdf",
        kindLabel: "PDF",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 67,
        progressLabel: "Pagina 8 di 12",
        icon: "P",
        viewerReady: false
      },
      {
        id: "study-guide-docx",
        title: "Guida al ripasso delle funzioni",
        description: "Documento DOCX estratto come testo sicuro, collegato al corso principale.",
        course: "Programmazione da Zero",
        kind: "document",
        kindLabel: "DOCX",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "partial",
        monitoringLabel: "Monitoraggio parziale",
        progress: 18,
        progressLabel: "Lettura iniziata",
        icon: "D",
        viewerReady: false
      },
      {
        id: "algorithm-slides-pptx",
        title: "Algoritmi e pseudocodice",
        description: "Presentazione PPTX disponibile come sequenza di slide testuali.",
        course: "Programmazione da Zero",
        kind: "presentation",
        kindLabel: "PPTX",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "partial",
        monitoringLabel: "Monitoraggio parziale",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "S",
        viewerReady: false
      },
      {
        id: "python-tutor-external",
        title: "Visualizzatore Python",
        description: "Risorsa HTTPS esterna utile per seguire l’esecuzione del codice riga per riga.",
        course: "Risorse libere",
        kind: "link",
        kindLabel: "Link",
        access: "external-unmonitored",
        accessLabel: "Esterno",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Solo apertura",
        icon: "↗",
        viewerReady: false
      }
    ];

    const aulaMaterialsPanelState = {
      initialized: false,
      selectedId: "native-programming-lesson",
      query: "",
      course: "all",
      kind: "all"
    };

    function aulaMaterialsPanelEscape(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function aulaMaterialsPanelLoad() {
      if (aulaMaterialsPanelState.initialized) return;
      aulaMaterialsPanelState.initialized = true;
      try {
        const parsed = JSON.parse(localStorage.getItem(aulaMaterialsPanelStorageKey) || "{}");
        if (parsed && aulaMaterialsPanelData.some((item) => item.id === parsed.selectedId)) {
          aulaMaterialsPanelState.selectedId = parsed.selectedId;
        }
      } catch {
        // La selezione predefinita resta disponibile se il browser blocca lo storage.
      }
    }

    function aulaMaterialsPanelSave() {
      try {
        localStorage.setItem(aulaMaterialsPanelStorageKey, JSON.stringify({ selectedId: aulaMaterialsPanelState.selectedId }));
      } catch {
        // La selezione resta valida per la sessione corrente.
      }
    }

    function aulaMaterialsPanelSelected() {
      return aulaMaterialsPanelData.find((material) => material.id === aulaMaterialsPanelState.selectedId)
        || aulaMaterialsPanelData[0];
    }

    function aulaMaterialsPanelCourses() {
      return [...new Set(aulaMaterialsPanelData.map((material) => material.course))];
    }

    function aulaMaterialsPanelKinds() {
      return [...new Map(aulaMaterialsPanelData.map((material) => [material.kind, material.kindLabel])).entries()];
    }

    function aulaMaterialsPanelFiltered() {
      const query = aulaMaterialsPanelState.query.trim().toLocaleLowerCase("it");
      return aulaMaterialsPanelData.filter((material) => {
        const haystack = `${material.title} ${material.description} ${material.course} ${material.kindLabel}`.toLocaleLowerCase("it");
        return (!query || haystack.includes(query))
          && (aulaMaterialsPanelState.course === "all" || material.course === aulaMaterialsPanelState.course)
          && (aulaMaterialsPanelState.kind === "all" || material.kind === aulaMaterialsPanelState.kind);
      });
    }

    function aulaMaterialAccessLabel(value) {
      return ({
        internal: "Interno",
        embedded: "Incorporato",
        "import-required": "Importazione richiesta",
        "external-unmonitored": "Esterno non monitorato",
        unsupported: "Non supportato"
      })[value] || "Non supportato";
    }

    function aulaMaterialMonitoringLabel(value) {
      return ({
        full: "Monitoraggio completo",
        partial: "Monitoraggio parziale",
        "opened-only": "Solo apertura",
        none: "Non monitorabile"
      })[value] || "Non monitorabile";
    }

    function aulaMaterialOfficialDescriptor(material) {
      const accessModes = new Set(["internal", "embedded", "import-required", "external-unmonitored", "unsupported"]);
      const monitoringLevels = new Set(["full", "partial", "opened-only", "none"]);
      const viewers = new Set(["pdf", "text", "document", "presentation", "video", "web-article", "exercise", "lesson"]);
      const importStatuses = new Set(["ready", "pending", "failed", "not-required"]);
      const providers = new Set(["youtube", "vimeo", "html5-video", "internal", "web", "none"]);
      const ext = aulaMaterialExtension(material.storageName || material.originalName || material.url || material.title);
      const sourceUrl = String(material.url || "");
      const stored = Boolean(material.storageName || material.sourceType === "file");
      const internalSeed = material.access === "internal" && !sourceUrl;
      const type = material.materialType || material.kind;
      const youtube = /^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(sourceUrl);
      const vimeo = /^https:\/\/(?:www\.)?vimeo\.com\//i.test(sourceUrl);
      const directVideo = aulaMaterialSafeHttps(sourceUrl) && ["mp4", "webm", "ogg"].includes(ext);
      let derived;

      if (type === "lesson") {
        derived = { access: "internal", monitoring: "full", viewer: "lesson", importStatus: "ready", provider: "internal", reason: "Lezione nativa del workspace." };
      } else if ((stored || internalSeed) && (type === "text" || ["txt", "md"].includes(ext))) {
        derived = { access: "internal", monitoring: "full", viewer: "text", importStatus: "ready", provider: "internal", reason: "Testo privato pronto nel lettore interno." };
      } else if ((stored || internalSeed) && (type === "pdf" || ext === "pdf")) {
        derived = { access: "internal", monitoring: "partial", viewer: "pdf", importStatus: "ready", provider: "internal", reason: "PDF consultabile nel workspace con posizione salvata." };
      } else if ((stored || internalSeed) && (type === "document" || ["doc", "docx"].includes(ext))) {
        derived = { access: "internal", monitoring: "full", viewer: "document", importStatus: "ready", provider: "internal", reason: "Documento convertito in testo sicuro." };
      } else if ((stored || internalSeed) && (type === "presentation" || ["ppt", "pptx"].includes(ext))) {
        derived = { access: "internal", monitoring: "full", viewer: "presentation", importStatus: "ready", provider: "internal", reason: "Presentazione renderizzata come slide testuali sicure." };
      } else if (youtube) {
        derived = { access: "embedded", monitoring: "full", viewer: "video", importStatus: "not-required", provider: "youtube", reason: "Video YouTube compatibile con il player incorporato." };
      } else if (vimeo) {
        derived = { access: "embedded", monitoring: "full", viewer: "video", importStatus: "not-required", provider: "vimeo", reason: "Video Vimeo compatibile con il player incorporato." };
      } else if (directVideo) {
        derived = { access: "embedded", monitoring: "full", viewer: "video", importStatus: "not-required", provider: "html5-video", reason: "Video HTTPS compatibile con il player HTML5." };
      } else if (sourceUrl && (type === "pdf" || ext === "pdf")) {
        derived = { access: "import-required", monitoring: "none", viewer: "pdf", importStatus: "pending", provider: "web", reason: "Il PDF remoto deve essere importato nello spazio protetto prima del monitoraggio." };
      } else if (type === "exercise" || type === "quiz") {
        derived = { access: "import-required", monitoring: "none", viewer: "exercise", importStatus: "pending", provider: "web", reason: "L’esercizio deve essere importato o ricreato prima del monitoraggio." };
      } else if (sourceUrl && aulaMaterialSafeHttps(sourceUrl)) {
        derived = { access: "import-required", monitoring: "none", viewer: "web-article", importStatus: "pending", provider: "web", reason: "La pagina richiede una copia leggibile autorizzata o un file compatibile." };
      } else {
        derived = { access: "unsupported", monitoring: "none", viewer: null, importStatus: "failed", provider: "none", reason: "La risorsa non dispone di un formato interno sicuro." };
      }

      if (material.explicitClassification === true) {
        if (accessModes.has(material.access)) derived.access = material.access;
        if (monitoringLevels.has(material.monitoring)) derived.monitoring = material.monitoring;
        if (viewers.has(material.viewer)) derived.viewer = material.viewer;
        if (importStatuses.has(material.importStatus)) derived.importStatus = material.importStatus;
        if (providers.has(material.provider)) derived.provider = material.provider;
        if (material.reason) derived.reason = material.reason;
      }
      return derived;
    }

    function aulaMaterialApplyDescriptor(material) {
      const descriptor = aulaMaterialOfficialDescriptor(material);
      material.access = descriptor.access;
      material.accessLabel = aulaMaterialAccessLabel(descriptor.access);
      material.monitoring = descriptor.monitoring;
      material.monitoringLabel = aulaMaterialMonitoringLabel(descriptor.monitoring);
      material.viewer = descriptor.viewer;
      material.importStatus = descriptor.importStatus;
      material.provider = descriptor.provider;
      material.reason = descriptor.reason;
      return material;
    }

    function aulaMaterialClassifyAll() {
      const pythonTutor = aulaMaterialsPanelData.find((item) => item.id === "python-tutor-external");
      if (pythonTutor) Object.assign(pythonTutor, {
        url: "https://pythontutor.com/",
        access: "external-unmonitored",
        monitoring: "opened-only",
        viewer: "web-article",
        importStatus: "not-required",
        provider: "web",
        reason: "Risorsa esterna: la demo registra soltanto l’apertura, senza osservare il contenuto.",
        explicitClassification: true
      });
      aulaMaterialsPanelData.forEach(aulaMaterialApplyDescriptor);
    }

    function aulaMaterialsPanelCard(material) {
      const selected = material.id === aulaMaterialsPanelState.selectedId;
      return `
        <article class="materials-panel-card ${selected ? "is-selected" : ""}" data-material-id="${aulaMaterialsPanelEscape(material.id)}">
          <div class="materials-panel-icon" aria-hidden="true">${aulaMaterialsPanelEscape(material.icon)}</div>
          <div class="materials-panel-copy">
            <h3>${aulaMaterialsPanelEscape(material.title)}</h3>
            <p>${aulaMaterialsPanelEscape(material.description)}</p>
            <small class="materials-panel-reason">${aulaMaterialsPanelEscape(material.reason || "Classificazione locale della demo.")}</small>
            <div class="material-classification-grid">
              <div><span>Access mode</span><strong>${aulaMaterialsPanelEscape(material.access || "unsupported")}</strong></div>
              <div><span>Viewer previsto</span><strong>${aulaMaterialsPanelEscape(material.viewer || "nessuno")}</strong></div>
              <div><span>Provider</span><strong>${aulaMaterialsPanelEscape(material.provider || "none")}</strong></div>
              <div><span>Import status</span><strong>${aulaMaterialsPanelEscape(material.importStatus || "not-required")}</strong></div>
            </div>
            <div class="materials-panel-meta">
              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.course)}</span>
              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.kindLabel)}</span>
              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.accessLabel)}</span>
              <span class="materials-panel-badge monitor-${aulaMaterialsPanelEscape(material.monitoring)}">${aulaMaterialsPanelEscape(material.monitoringLabel)}</span>
            </div>
          </div>
          <div class="materials-panel-card-actions">
            <div class="materials-panel-progress">
              <strong>${material.progress}%</strong>
              <span>${aulaMaterialsPanelEscape(material.progressLabel)}</span>
            </div>
            <button type="button" onclick="aulaMaterialsPanelSelect('${aulaMaterialsPanelEscape(material.id)}')">${selected ? "Selezionato" : "Seleziona"}</button>
            <button class="primary" type="button" onclick="aulaMaterialsPanelOpen('${aulaMaterialsPanelEscape(material.id)}')">Apri</button>
          </div>
        </article>`;
    }

    function buildMaterialsDrawerHtml() {
      aulaMaterialsPanelLoad();
      aulaMaterialClassifyAll();
      const materials = aulaMaterialsPanelFiltered();
      const selected = aulaMaterialsPanelSelected();
      return `
        <div class="materials-panel-shell">
          <section class="materials-panel-intro">
            <strong>Materiale selezionato: ${aulaMaterialsPanelEscape(selected.title)}</strong>
            <span>Scegli cosa aprire nel workspace centrale. Ogni risorsa mostra accesso, viewer previsto, provider, importazione e monitorabilità.</span>
            <div class="materials-panel-taxonomy">
              <strong>Access mode</strong> internal · embedded · import-required · external-unmonitored · unsupported
              <strong>Monitoraggio</strong> completo · parziale · solo apertura · non monitorabile
            </div>
          </section>

          <div class="materials-panel-toolbar">
            <input id="materialsPanelSearch" type="search" value="${aulaMaterialsPanelEscape(aulaMaterialsPanelState.query)}" placeholder="Cerca titolo, corso o formato" aria-label="Cerca materiali" oninput="aulaMaterialsPanelSetQuery(this.value)">
            <select id="materialsPanelCourse" aria-label="Filtra per corso" onchange="aulaMaterialsPanelSetCourse(this.value)">
              <option value="all">Tutti i corsi</option>
              ${aulaMaterialsPanelCourses().map((course) => `<option value="${aulaMaterialsPanelEscape(course)}"${course === aulaMaterialsPanelState.course ? " selected" : ""}>${aulaMaterialsPanelEscape(course)}</option>`).join("")}
            </select>
            <select id="materialsPanelKind" aria-label="Filtra per formato" onchange="aulaMaterialsPanelSetKind(this.value)">
              <option value="all">Tutti i formati</option>
              ${aulaMaterialsPanelKinds().map(([kind, label]) => `<option value="${aulaMaterialsPanelEscape(kind)}"${kind === aulaMaterialsPanelState.kind ? " selected" : ""}>${aulaMaterialsPanelEscape(label)}</option>`).join("")}
            </select>
          </div>

          <div class="materials-panel-summary">
            <strong>${materials.length} ${materials.length === 1 ? "materiale" : "materiali"}</strong>
            <span>${aulaMaterialsPanelData.length} disponibili nella stanza</span>
          </div>

          <div class="materials-panel-list" id="materialsPanelList">
            ${materials.length ? materials.map(aulaMaterialsPanelCard).join("") : `<div class="materials-panel-empty">Nessun materiale corrisponde ai filtri. Azzera la ricerca oppure scegli un altro corso.</div>`}
          </div>

          <div class="materials-panel-footer">
            <span>La demo salva soltanto metadati nel browser. I file reali restano sul dispositivo.</span>
            <div class="materials-panel-footer-actions">
              <button class="primary" type="button" onclick="aulaMaterialAddOpen(this)">＋ Aggiungi materiale</button>
              <button type="button" onclick="portalDashboardOpenCatalogForRoom('python-room'); closeDrawer()">Apri Catalogo</button>
            </div>
          </div>
        </div>`;
    }

    function aulaMaterialsPanelRefresh(options = {}) {
      const content = document.getElementById("drawerContent");
      if (!content || document.getElementById("drawerBackdrop")?.classList.contains("hidden")) return;
      content.innerHTML = buildMaterialsDrawerHtml();
      if (options.focusSearch) window.setTimeout(() => document.getElementById("materialsPanelSearch")?.focus(), 20);
    }

    function aulaMaterialsPanelSetQuery(value) {
      aulaMaterialsPanelState.query = String(value || "");
      aulaMaterialsPanelRefresh({ focusSearch: true });
      const input = document.getElementById("materialsPanelSearch");
      if (input) {
        input.value = aulaMaterialsPanelState.query;
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    function aulaMaterialsPanelSetCourse(value) {
      aulaMaterialsPanelState.course = String(value || "all");
      aulaMaterialsPanelRefresh();
    }

    function aulaMaterialsPanelSetKind(value) {
      aulaMaterialsPanelState.kind = String(value || "all");
      aulaMaterialsPanelRefresh();
    }

    function aulaMaterialsPanelSelect(id) {
      if (!aulaMaterialsPanelData.some((material) => material.id === id)) return;
      aulaMaterialsPanelState.selectedId = id;
      aulaMaterialsPanelSave();
      aulaMaterialsPanelRefresh();
      const material = aulaMaterialsPanelSelected();
      showToast(`Materiale selezionato: ${material.title}`);
    }

    function aulaMaterialsPanelWorkspaceHtml(material) {
      const availability = material.viewerReady
        ? "Viewer nativo già disponibile nella demo."
        : material.access === "embedded"
          ? `Il provider ${material.provider} è compatibile con un player incorporato; il viewer completo arriva nella sottofase dedicata.`
          : material.access === "import-required"
            ? "La risorsa deve essere importata o convertita prima di poter attribuire progresso."
            : material.access === "external-unmonitored"
              ? "La risorsa si apre esternamente e la demo registra soltanto l’apertura."
              : material.access === "unsupported"
                ? "Il formato non dispone ancora di un percorso sicuro nella demo."
                : `Viewer interno previsto: ${material.viewer || "nessuno"}.`;
      return `
        <section class="material-workspace-placeholder" data-material-workspace-kind="${aulaMaterialsPanelEscape(material.kind)}">
          <div class="document-section-label">Materiale della stanza · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-workspace-placeholder-head">
            <div class="material-workspace-placeholder-icon" aria-hidden="true">${aulaMaterialsPanelEscape(material.icon)}</div>
            <div>
              <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
              <p>${aulaMaterialsPanelEscape(material.description)}</p>
            </div>
          </div>
          <div class="material-workspace-facts">
            <div class="material-workspace-fact"><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Access mode</span><strong>${aulaMaterialsPanelEscape(material.access)}</strong></div>
            <div class="material-workspace-fact"><span>Viewer previsto</span><strong>${aulaMaterialsPanelEscape(material.viewer || "nessuno")}</strong></div>
            <div class="material-workspace-fact"><span>Provider</span><strong>${aulaMaterialsPanelEscape(material.provider || "none")}</strong></div>
            <div class="material-workspace-fact"><span>Import status</span><strong>${aulaMaterialsPanelEscape(material.importStatus || "not-required")}</strong></div>
            <div class="material-workspace-fact"><span>Monitorabilità</span><strong>${aulaMaterialsPanelEscape(material.monitoringLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Avanzamento</span><strong>${material.progress}% · ${aulaMaterialsPanelEscape(material.progressLabel)}</strong></div>
          </div>
          <div class="material-workspace-honesty"><strong>Stato reale della demo.</strong> ${aulaMaterialsPanelEscape(availability)}</div>
        </section>`;
    }

    function aulaMaterialsPanelOpen(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material) return;
      aulaMaterialsPanelState.selectedId = id;
      aulaMaterialsPanelSave();
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      if (material.viewerReady) {
        state.currentSection = 0;
        activateLessonTab();
      } else if (documentContent) {
        if (audioLessonState.speaking) stopAudioLesson(false);
        if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
        document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
        documentContent.innerHTML = aulaMaterialsPanelWorkspaceHtml(material);
        state.currentView = "material-preview";
        setEveContext("materiali");
        saveState();
      }
      closeDrawer();
      showToast(`Aperto nel workspace: ${material.title}`);
    }




    /* ==========================================================
       MATERIALI — UPLOAD E LINK LOCALI
       ========================================================== */
    const aulaMaterialCustomStorageKey="aula-demo-materials-custom-v1";let aulaMaterialAddMode="link",aulaMaterialAddPreviousFocus=null,aulaMaterialAddBusy=false;const aulaMaterialAllowedExtensions=new Set(["pdf","txt","md","doc","docx","ppt","pptx"]),aulaMaterialMaxBytes=10*1024*1024;
    function aulaMaterialExtension(value){return String(value||"").split(/[?#]/,1)[0].toLowerCase().match(/\.([a-z0-9]{2,8})$/)?.[1]||""}
    function aulaMaterialSafeHttps(value){try{const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password)return false;const host=url.hostname.toLowerCase();if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local"))return false;const p=host.split(".").map(Number);if(p.length===4&&p.every(n=>Number.isInteger(n))){const[a,b]=p;if(a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||a>=224)return false}return true}catch{return false}}
    function aulaMaterialBasicKind(ext){return ext==="pdf"?"pdf":["txt","md"].includes(ext)?"text":["doc","docx"].includes(ext)?"document":["ppt","pptx"].includes(ext)?"presentation":"link"}
    function aulaMaterialKindLabel(kind){return({pdf:"PDF",text:"Testo",document:"DOCX",presentation:"PPTX",video:"Video",link:"Link",lesson:"Lezione nativa"})[kind]||"Risorsa"}
    function aulaMaterialSecureName(file){const ext=aulaMaterialExtension(file?.name);const base=String(file?.name||"materiale").replace(/\.[^.]+$/,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"materiale";return `${base}-${Date.now().toString(36)}.${ext}`}
    function aulaMaterialLoadCustom(){let items=[];try{items=JSON.parse(localStorage.getItem(aulaMaterialCustomStorageKey)||"[]")}catch{items=[]}if(!Array.isArray(items))return;items.forEach(item=>{if(item?.id&&!aulaMaterialsPanelData.some(current=>current.id===item.id))aulaMaterialsPanelData.push({...item,custom:true})})}
    function aulaMaterialSaveCustom(){try{localStorage.setItem(aulaMaterialCustomStorageKey,JSON.stringify(aulaMaterialsPanelData.filter(item=>item.custom)))}catch{showToast("Il browser non consente di salvare i nuovi materiali")}}
    const aulaMaterialsPanelLoadBeforeCustom=window.aulaMaterialsPanelLoad;window.aulaMaterialsPanelLoad=function(){aulaMaterialsPanelLoadBeforeCustom();aulaMaterialLoadCustom()};
    function aulaMaterialAddStatus(message="",tone=""){const node=document.getElementById("materialAddStatus");if(!node)return;node.textContent=message;tone?node.dataset.tone=tone:node.removeAttribute("data-tone")}
    function aulaMaterialAddOpen(trigger){aulaMaterialAddPreviousFocus=trigger||document.activeElement;aulaMaterialAddBusy=false;aulaMaterialAddStatus();aulaMaterialAddSetMode("link");const dialog=document.getElementById("materialAddDialog");if(dialog)dialog.hidden=false;window.setTimeout(()=>document.getElementById("materialAddName")?.focus(),20)}
    function aulaMaterialAddClose(){if(aulaMaterialAddBusy)return;const dialog=document.getElementById("materialAddDialog");if(dialog)dialog.hidden=true;["materialAddName","materialAddUrl","materialAddFile"].forEach(id=>{const node=document.getElementById(id);if(node)node.value=""});aulaMaterialUpdateClassificationPreview();aulaMaterialAddPreviousFocus?.focus?.();aulaMaterialAddPreviousFocus=null}
    function aulaMaterialAddBackdrop(event){if(event.target?.id==="materialAddDialog")aulaMaterialAddClose()}
    function aulaMaterialAddSetMode(mode){aulaMaterialAddMode=mode==="file"?"file":"link";const link=document.getElementById("materialAddLinkFields"),file=document.getElementById("materialAddFileFields"),linkTab=document.getElementById("materialAddLinkTab"),fileTab=document.getElementById("materialAddFileTab");if(link)link.hidden=aulaMaterialAddMode!=="link";if(file)file.hidden=aulaMaterialAddMode!=="file";linkTab?.classList.toggle("active",aulaMaterialAddMode==="link");fileTab?.classList.toggle("active",aulaMaterialAddMode==="file");linkTab?.setAttribute("aria-selected",String(aulaMaterialAddMode==="link"));fileTab?.setAttribute("aria-selected",String(aulaMaterialAddMode==="file"));aulaMaterialUpdateClassificationPreview()}
    function aulaMaterialPreliminary(){const url=String(document.getElementById("materialAddUrl")?.value||"").trim(),file=document.getElementById("materialAddFile")?.files?.[0]||null,ext=aulaMaterialAddMode==="file"?aulaMaterialExtension(file?.name):aulaMaterialExtension(url),kind=aulaMaterialBasicKind(ext),draft={title:file?.name||url||"Materiale",kind,url:aulaMaterialAddMode==="link"?url:null,sourceType:aulaMaterialAddMode,storageName:aulaMaterialAddMode==="file"?file?.name:null,originalName:aulaMaterialAddMode==="file"?file?.name:null};return{url,file,ext,kind,kindLabel:aulaMaterialKindLabel(kind),descriptor:aulaMaterialOfficialDescriptor(draft)}}
    function aulaMaterialUpdateClassificationPreview(){const data=aulaMaterialPreliminary(),node=document.getElementById("materialAddClassification");if(!node)return;if(aulaMaterialAddMode==="file"&&!data.file){node.innerHTML="<strong>Classificazione preliminare</strong><br>Seleziona un file compatibile.";return}if(aulaMaterialAddMode==="link"&&!data.url){node.innerHTML="<strong>Classificazione preliminare</strong><br>Inserisci un URL HTTPS pubblico.";return}const d=data.descriptor;node.innerHTML=`<strong>${aulaMaterialsPanelEscape(data.kindLabel)}</strong><br>Access mode: ${aulaMaterialsPanelEscape(d.access)} · Viewer: ${aulaMaterialsPanelEscape(d.viewer||"nessuno")} · Provider: ${aulaMaterialsPanelEscape(d.provider)} · Import: ${aulaMaterialsPanelEscape(d.importStatus)} · Monitoraggio: ${aulaMaterialsPanelEscape(d.monitoring)}`}
    async function aulaMaterialAddSubmit(){if(aulaMaterialAddBusy)return;const title=String(document.getElementById("materialAddName")?.value||"").trim().replace(/\s+/g," "),course=String(document.getElementById("materialAddCourse")?.value||"Risorse libere"),data=aulaMaterialPreliminary();aulaMaterialAddStatus();if(title.length<3){aulaMaterialAddStatus("Inserisci un titolo di almeno 3 caratteri.","error");document.getElementById("materialAddName")?.focus();return}if(aulaMaterialAddMode==="link"&&!aulaMaterialSafeHttps(data.url)){aulaMaterialAddStatus("Usa un URL HTTPS pubblico, senza credenziali o indirizzi locali.","error");document.getElementById("materialAddUrl")?.focus();return}if(aulaMaterialAddMode==="file"){if(!data.file){aulaMaterialAddStatus("Seleziona un file.","error");return}if(data.file.size>aulaMaterialMaxBytes){aulaMaterialAddStatus("Il file supera il limite di 10 MB.","error");return}if(!aulaMaterialAllowedExtensions.has(data.ext)){aulaMaterialAddStatus("Formato non ammesso. Usa PDF, TXT, Markdown, DOC/DOCX o PPT/PPTX.","error");return}}aulaMaterialAddBusy=true;document.getElementById("materialAddSubmit").disabled=true;aulaMaterialAddStatus(aulaMaterialAddMode==="file"?"Preparazione sicura del file…":"Verifica del collegamento…");await new Promise(resolve=>setTimeout(resolve,430));const id=`custom-${Date.now().toString(36)}`,stored=aulaMaterialAddMode==="file",material={id,title,description:stored?`File locale ${data.file.name} · ${Math.max(1,Math.round(data.file.size/1024))} KB`:`Collegamento aggiunto manualmente: ${data.url}`,course,kind:data.kind,kindLabel:data.kindLabel,access:stored?"internal":"import-required",accessLabel:stored?"Interno":"Importazione richiesta",monitoring:stored?"full":"none",monitoringLabel:stored?"Monitoraggio completo":"Non monitorabile",progress:0,progressLabel:"Non iniziato",icon:({pdf:"P",text:"T",document:"D",presentation:"S"})[data.kind]||"↗",viewerReady:false,custom:true,sourceType:aulaMaterialAddMode,url:stored?null:data.url,originalName:stored?data.file.name:null,storageName:stored?aulaMaterialSecureName(data.file):null,fileSize:stored?data.file.size:null,importStatus:stored?"ready":"pending"};aulaMaterialsPanelData.unshift(material);aulaMaterialSaveCustom();aulaMaterialsPanelState.selectedId=id;aulaMaterialsPanelSave();aulaMaterialAddBusy=false;document.getElementById("materialAddSubmit").disabled=false;aulaMaterialAddClose();aulaMaterialsPanelRefresh();showToast(`Materiale aggiunto: ${title}`)}
    window.addEventListener("keydown",event=>{const dialog=document.getElementById("materialAddDialog");if(event.key==="Escape"&&dialog&&!dialog.hidden&&!aulaMaterialAddBusy){event.preventDefault();aulaMaterialAddClose()}});


    /* ==========================================================
       MATERIALI — VIEWER PDF LOCALE
       ========================================================== */
    const aulaPdfPages = [
      { title: "Esercizi · Capitolo 1", body: "Obiettivo del fascicolo: trasformare le nozioni iniziali in procedure verificabili. Ogni esercizio richiede input, elaborazione, output e almeno un caso limite.", items: ["Leggere con attenzione la consegna", "Scrivere un esempio valido", "Individuare un errore possibile"] },
      { title: "1. Sequenza di istruzioni", body: "Descrivi un algoritmo quotidiano usando passaggi ordinati. Spiega perché cambiare l’ordine può modificare il risultato.", items: ["Passaggi numerati", "Condizione iniziale", "Risultato atteso"] },
      { title: "2. Input e output", body: "Immagina un programma che chiede il nome e restituisce un saluto. Distingui chiaramente ciò che entra da ciò che esce.", items: ["Input: nome", "Elaborazione: costruzione frase", "Output: saluto"] },
      { title: "3. Tipi di dato", body: "Classifica età, prezzo, nome e risposta vero/falso. Motiva la scelta del tipo più adatto.", items: ["Intero", "Numero decimale", "Stringa", "Booleano"] },
      { title: "4. Casi limite", body: "Un programma calcola la media di una lista. Cosa accade con una lista vuota? Definisci il comportamento corretto prima di scrivere codice.", items: ["Lista vuota", "Valori non numerici", "Un solo valore"] },
      { title: "5. Errori di sintassi", body: "Osserva una riga incompleta e spiega quale parte impedisce al linguaggio di interpretarla.", items: ["Parentesi", "Virgolette", "Indentazione"] },
      { title: "6. Errori logici", body: "Il programma viene eseguito ma produce un risultato sbagliato. Descrivi come useresti esempi piccoli per trovare il passaggio errato.", items: ["Valore atteso", "Valore ottenuto", "Prima divergenza"] },
      { title: "7. Pseudocodice", body: "Scrivi lo pseudocodice di un controllo che stabilisce se una persona è maggiorenne.", items: ["Leggi età", "Confronta con 18", "Mostra il risultato"] },
      { title: "8. Verifica", body: "Prepara tre test: un caso normale, un caso al limite e un caso non valido.", items: ["Età 25", "Età 18", "Testo al posto del numero"] },
      { title: "9. Scomposizione", body: "Dividi un problema più grande in funzioni o sottoproblemi con responsabilità distinte.", items: ["Acquisizione dati", "Validazione", "Calcolo", "Presentazione"] },
      { title: "10. Riflessione", body: "Spiega con parole tue la differenza tra algoritmo e programma, includendo un controesempio.", items: ["Definizione intuitiva", "Definizione tecnica", "Controesempio"] },
      { title: "Soluzioni guidate", body: "Confronta il tuo ragionamento con i criteri: chiarezza, ordine, gestione degli errori e verificabilità.", items: ["Non copiare soltanto il risultato", "Controlla i casi limite", "Spiega le scelte"] }
    ];
    const aulaPdfState = { materialId: null, page: 1 };

    function aulaPdfMaterial(id) {
      return aulaMaterialsPanelData.find((item) => item.id === id) || null;
    }

    function aulaPdfTotalPages() {
      return aulaPdfPages.length;
    }

    function aulaPdfRender() {
      const material = aulaPdfMaterial(aulaPdfState.materialId);
      const total = aulaPdfTotalPages();
      const page = aulaPdfPages[aulaPdfState.page - 1] || aulaPdfPages[0];
      const percent = Math.round((aulaPdfState.page / total) * 100);
      if (!material || !documentContent) return;
      documentContent.innerHTML = `
        <section class="material-pdf-viewer" aria-label="Viewer PDF ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">PDF interno · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-viewer-toolbar">
            <button type="button" onclick="aulaPdfMove(-1)" ${aulaPdfState.page <= 1 ? "disabled" : ""}>← Pagina precedente</button>
            <div aria-live="polite"><strong>Pagina ${aulaPdfState.page} di ${total}</strong><br><span>${percent}% del documento</span></div>
            <button type="button" onclick="aulaPdfMove(1)" ${aulaPdfState.page >= total ? "disabled" : ""}>Pagina successiva →</button>
          </div>
          <div class="material-viewer-progress" role="progressbar" aria-label="Avanzamento PDF" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
          <article class="material-pdf-sheet" tabindex="0">
            <small>Pagina ${aulaPdfState.page}</small>
            <h1>${aulaMaterialsPanelEscape(page.title)}</h1>
            <p>${aulaMaterialsPanelEscape(page.body)}</p>
            <ul>${page.items.map((item) => `<li>${aulaMaterialsPanelEscape(item)}</li>`).join("")}</ul>
          </article>
          <div class="material-pdf-status"><strong>Stato reale della demo.</strong> Il PDF è rappresentato con pagine locali deterministiche; nessun documento remoto viene caricato.</div>
        </section>`;
      material.progress = percent;
      material.progressLabel = `Pagina ${aulaPdfState.page} di ${total}`;
      state.currentView = "material-pdf";
      setEveContext("materiali");
      saveState();
    }

    function aulaPdfMove(direction) {
      const total = aulaPdfTotalPages();
      aulaPdfState.page = Math.max(1, Math.min(total, aulaPdfState.page + Number(direction || 0)));
      aulaPdfRender();
      pageScroll?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }

    function aulaPdfOpen(material) {
      if (!material) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const total = aulaPdfTotalPages();
      aulaPdfState.materialId = material.id;
      aulaPdfState.page = Math.max(1, Math.min(total, Math.round(((material.progress || 1) / 100) * total)));
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaPdfRender();
      closeDrawer();
      showToast(`PDF aperto: ${material.title}`);
    }

    const aulaMaterialsOpenBeforePdf = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.viewer === "pdf" && descriptor.access === "internal") return aulaPdfOpen(material);
      return aulaMaterialsOpenBeforePdf(id);
    };

    window.addEventListener("keydown", (event) => {
      if (state.currentView !== "material-pdf" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        aulaPdfMove(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        aulaPdfMove(1);
      }
    });


    /* ==========================================================
       MATERIALI — DOCX E PPTX SICURI
       ========================================================== */
    Object.assign(aulaMaterialsPanelData.find((item) => item.id === "study-guide-docx") || {}, {
      documentSections: [
        { title: "Perché usare le funzioni", paragraphs: ["Una funzione raccoglie istruzioni che svolgono un compito riconoscibile.", "Dare un nome chiaro alla funzione rende il programma più leggibile e permette di riutilizzare la stessa logica."] },
        { title: "Parametri e risultato", paragraphs: ["I parametri rappresentano i dati ricevuti dalla funzione.", "Il valore restituito è il risultato che la funzione consegna al resto del programma."] },
        { title: "Controlli finali", paragraphs: ["Verifica input validi, casi limite e nomi comprensibili.", "Una funzione troppo lunga spesso contiene più responsabilità e dovrebbe essere divisa."] }
      ]
    });

    Object.assign(aulaMaterialsPanelData.find((item) => item.id === "algorithm-slides-pptx") || {}, {
      slides: [
        { title: "Algoritmi", subtitle: "Dal problema a una procedura verificabile", points: ["Sequenza finita di passaggi", "Ordine non ambiguo", "Risultato verificabile"] },
        { title: "Pseudocodice", subtitle: "Descrivere prima di programmare", points: ["Indipendente dal linguaggio", "Descrive decisioni e ripetizioni", "Prepara la scrittura del programma"] },
        { title: "Test", subtitle: "Controllare il comportamento", points: ["Caso normale", "Caso al limite", "Input non valido"] },
        { title: "Dalla soluzione al codice", subtitle: "Procedere un passo per volta", points: ["Scomponi il problema", "Implementa un pezzo per volta", "Confronta output atteso e ottenuto"] }
      ]
    });

    const aulaPresentationState = { materialId: null, slide: 1 };

    function aulaDocumentSections(material) {
      if (Array.isArray(material?.documentSections) && material.documentSections.length) return material.documentSections;
      return [
        { title: "Anteprima sicura del documento", paragraphs: ["Il file è stato classificato come documento interno compatibile.", "Questa demo non analizza il contenuto binario reale: mostra una rappresentazione testuale deterministica del flusso previsto."] },
        { title: "Metadati disponibili", paragraphs: [`Nome originale: ${material?.originalName || material?.title || "Documento"}.`, "Macro, oggetti incorporati e contenuti eseguibili non vengono avviati nel workspace."] },
        { title: "Integrazione ufficiale", paragraphs: ["Nell’app reale il documento viene convertito sul server in testo sicuro prima della consultazione.", "Il viewer conserva una superficie leggibile senza eseguire il file originale nel browser."] }
      ];
    }

    function aulaPresentationSlides(material) {
      if (Array.isArray(material?.slides) && material.slides.length) return material.slides;
      return [
        { title: material?.title || "Presentazione", subtitle: "Anteprima testuale sicura", points: ["File classificato come presentazione interna", "Nessun elemento attivo viene eseguito", "Le slide reali richiedono conversione protetta"] },
        { title: "Contenuto non analizzato", subtitle: "Limite dichiarato della demo", points: ["Il file binario resta sul dispositivo", "La demo usa dati deterministici", "Nessuna immagine o macro viene estratta"] },
        { title: "Comportamento dell’app", subtitle: "Percorso previsto", points: ["Conversione server-side", "Slide testuali sicure", "Posizione e avanzamento salvabili"] }
      ];
    }

    function aulaDocumentOpen(material) {
      if (!material || !documentContent) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const sections = aulaDocumentSections(material);
      const paragraphs = sections.reduce((total, section) => total + (section.paragraphs?.length || 0), 0);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      documentContent.innerHTML = `
        <section class="material-document-viewer" aria-label="Documento ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Documento convertito · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-document-summary">
            <div><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div><span>Sezioni</span><strong>${sections.length}</strong></div>
            <div><span>Paragrafi</span><strong>${paragraphs}</strong></div>
          </div>
          <article class="material-document-page" tabindex="0">
            <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
            ${sections.map((section) => `<section><h2>${aulaMaterialsPanelEscape(section.title)}</h2>${(section.paragraphs || []).map((text) => `<p>${aulaMaterialsPanelEscape(text)}</p>`).join("")}</section>`).join("")}
          </article>
          <div class="material-safe-note"><strong>Visualizzazione sicura.</strong> La demo mostra esclusivamente testo locale controllato e non esegue macro, oggetti incorporati o il documento originale.</div>
        </section>`;
      state.currentView = "material-document";
      setEveContext("materiali");
      saveState();
      closeDrawer();
      showToast(`Documento aperto: ${material.title}`);
    }

    function aulaPresentationMaterial() {
      return aulaMaterialsPanelData.find((item) => item.id === aulaPresentationState.materialId) || null;
    }

    function aulaPresentationRender() {
      const material = aulaPresentationMaterial();
      const slides = aulaPresentationSlides(material);
      const slide = slides[aulaPresentationState.slide - 1];
      if (!material || !slide || !documentContent) return;
      const percent = Math.round((aulaPresentationState.slide / slides.length) * 100);
      documentContent.innerHTML = `
        <section class="material-presentation-viewer" aria-label="Presentazione ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Presentazione testuale · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-viewer-toolbar">
            <button type="button" onclick="aulaPresentationMove(-1)" ${aulaPresentationState.slide <= 1 ? "disabled" : ""}>← Slide precedente</button>
            <div aria-live="polite"><strong>Slide ${aulaPresentationState.slide} di ${slides.length}</strong><br><span>${percent}% della presentazione</span></div>
            <button type="button" onclick="aulaPresentationMove(1)" ${aulaPresentationState.slide >= slides.length ? "disabled" : ""}>Slide successiva →</button>
          </div>
          <div class="material-viewer-progress" role="progressbar" aria-label="Avanzamento presentazione" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
          <div class="material-slide-stage">
            <article class="material-slide" tabindex="0">
              <small>Slide ${aulaPresentationState.slide}</small>
              <h1>${aulaMaterialsPanelEscape(slide.title)}</h1>
              <p>${aulaMaterialsPanelEscape(slide.subtitle || "")}</p>
              <ul>${(slide.points || []).map((point) => `<li>${aulaMaterialsPanelEscape(point)}</li>`).join("")}</ul>
            </article>
          </div>
          <div class="material-safe-note"><strong>Presentazione sicura.</strong> Le slide sono testo locale controllato; immagini, animazioni, macro e contenuti incorporati non vengono eseguiti.</div>
        </section>`;
      material.progress = percent;
      material.progressLabel = `Slide ${aulaPresentationState.slide} di ${slides.length}`;
      state.currentView = "material-presentation";
      setEveContext("materiali");
      saveState();
    }

    function aulaPresentationMove(direction) {
      const material = aulaPresentationMaterial();
      const total = aulaPresentationSlides(material).length || 1;
      aulaPresentationState.slide = Math.max(1, Math.min(total, aulaPresentationState.slide + Number(direction || 0)));
      aulaPresentationRender();
      pageScroll?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }

    function aulaPresentationOpen(material) {
      if (!material) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const slides = aulaPresentationSlides(material);
      aulaPresentationState.materialId = material.id;
      aulaPresentationState.slide = Math.max(1, Math.min(slides.length, Math.round(((material.progress || 1) / 100) * slides.length)));
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaPresentationRender();
      closeDrawer();
      showToast(`Presentazione aperta: ${material.title}`);
    }

    const aulaMaterialsOpenBeforeDocuments = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.access === "internal" && descriptor.viewer === "document") return aulaDocumentOpen(material);
      if (material && descriptor?.access === "internal" && descriptor.viewer === "presentation") return aulaPresentationOpen(material);
      return aulaMaterialsOpenBeforeDocuments(id);
    };

    window.addEventListener("keydown", (event) => {
      if (state.currentView !== "material-presentation" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        aulaPresentationMove(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        aulaPresentationMove(1);
      }
    });


    /* ==========================================================
       MATERIALI — PLAYER VIDEO SIMULATO
       ========================================================== */
    [
      {
        id: "video-youtube-python",
        title: "Python: primo programma",
        description: "Video YouTube rappresentato con un player locale controllabile.",
        course: "Programmazione da Zero",
        kind: "video",
        kindLabel: "Video",
        url: "https://www.youtube.com/watch?v=demoPython01",
        access: "embedded",
        accessLabel: "Incorporato",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "▶",
        viewerReady: true,
        provider: "youtube",
        duration: 245,
        explicitClassification: true,
        viewer: "video",
        importStatus: "not-required",
        reason: "Video YouTube compatibile con il player incorporato."
      },
      {
        id: "video-vimeo-algorithms",
        title: "Algoritmi visuali",
        description: "Video Vimeo simulato senza caricare contenuti remoti.",
        course: "Programmazione da Zero",
        kind: "video",
        kindLabel: "Video",
        url: "https://vimeo.com/123456789",
        access: "embedded",
        accessLabel: "Incorporato",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "▶",
        viewerReady: true,
        provider: "vimeo",
        duration: 310,
        explicitClassification: true,
        viewer: "video",
        importStatus: "not-required",
        reason: "Video Vimeo compatibile con il player incorporato."
      },
      {
        id: "video-https-debug",
        title: "Debug passo per passo",
        description: "File MP4 HTTPS rappresentato dal player HTML5 locale della demo.",
        course: "Risorse libere",
        kind: "video",
        kindLabel: "Video",
        url: "https://example.org/didattica/debug.mp4",
        access: "embedded",
        accessLabel: "Incorporato",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "▶",
        viewerReady: true,
        provider: "html5-video",
        duration: 180,
        explicitClassification: true,
        viewer: "video",
        importStatus: "not-required",
        reason: "Video HTTPS compatibile con il player HTML5."
      }
    ].forEach((item) => {
      if (!aulaMaterialsPanelData.some((current) => current.id === item.id)) aulaMaterialsPanelData.push(item);
    });

    const aulaVideoState = {
      materialId: null,
      current: 0,
      duration: 1,
      playing: false,
      ranges: [],
      timer: null
    };

    function aulaFormatVideoTime(value) {
      const seconds = Math.max(0, Math.floor(Number(value) || 0));
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }

    function aulaMergeRanges(ranges) {
      const sorted = (Array.isArray(ranges) ? ranges : [])
        .filter((range) => Number(range.end) > Number(range.start))
        .map((range) => ({ start: Number(range.start), end: Number(range.end) }))
        .sort((a, b) => a.start - b.start);
      const merged = [];
      sorted.forEach((range) => {
        const last = merged[merged.length - 1];
        if (last && range.start <= last.end + 1) last.end = Math.max(last.end, range.end);
        else merged.push({ ...range });
      });
      return merged;
    }

    function aulaVideoWatchedSeconds() {
      return aulaMergeRanges(aulaVideoState.ranges).reduce((sum, range) => sum + range.end - range.start, 0);
    }

    function aulaVideoRangesHtml() {
      const ranges = aulaMergeRanges(aulaVideoState.ranges);
      if (!ranges.length) return '<span class="material-video-ranges-empty">Nessun intervallo ancora riprodotto</span>';
      return ranges.slice(-6).map((range) => `<span>${aulaFormatVideoTime(range.start)}–${aulaFormatVideoTime(range.end)}</span>`).join("");
    }

    function aulaVideoRender() {
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaVideoState.materialId);
      if (!material || !documentContent) return;
      const watchedSeconds = aulaVideoWatchedSeconds();
      const coverage = Math.min(100, Math.round((watchedSeconds / aulaVideoState.duration) * 100));
      const completed = coverage >= 90;
      material.progress = coverage;
      material.progressLabel = completed ? "Completato" : `${coverage}% realmente visto`;
      documentContent.innerHTML = `
        <section class="material-video-viewer" aria-label="Player video ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Player locale · nessun iframe remoto</div>
          <div class="material-video-stage" data-playing="${String(aulaVideoState.playing)}">
            <span class="material-video-provider">${aulaMaterialsPanelEscape(material.provider)}</span>
            <div class="material-video-symbol" aria-hidden="true">${aulaVideoState.playing ? "Ⅱ" : "▶"}</div>
            <div class="material-video-title">${aulaMaterialsPanelEscape(material.title)}</div>
          </div>
          <div class="material-video-controls">
            <button type="button" onclick="aulaVideoToggle()" aria-label="${aulaVideoState.playing ? "Pausa" : "Riproduci"}">${aulaVideoState.playing ? "Ⅱ" : "▶"}</button>
            <input type="range" min="0" max="${aulaVideoState.duration}" value="${Math.floor(aulaVideoState.current)}" oninput="aulaVideoSeek(this.value)" aria-label="Posizione video">
            <span>${aulaFormatVideoTime(aulaVideoState.current)} / ${aulaFormatVideoTime(aulaVideoState.duration)}</span>
          </div>
          <div class="material-viewer-progress" role="progressbar" aria-label="Copertura video realmente vista" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${coverage}"><span style="width:${coverage}%"></span></div>
          <div class="material-video-stats">
            <div><span>Copertura reale</span><strong>${coverage}%</strong></div>
            <div><span>Secondi unici</span><strong>${Math.round(watchedSeconds)}</strong></div>
            <div><span>Completamento</span><strong>${completed ? "Raggiunto" : "Richiede almeno 90%"}</strong></div>
          </div>
          <div class="material-video-ranges" aria-label="Intervalli riprodotti">${aulaVideoRangesHtml()}</div>
          <div class="material-workspace-honesty"><strong>Demo locale.</strong> Il player simula play, pausa e seek; non scarica né incorpora il video remoto. Gli spostamenti sul cursore non vengono conteggiati come tempo visto.</div>
        </section>`;
      state.currentView = "material-video";
      setEveContext("materiali");
      saveState();
    }

    function aulaVideoTick() {
      if (!aulaVideoState.playing) return;
      const before = aulaVideoState.current;
      aulaVideoState.current = Math.min(aulaVideoState.duration, aulaVideoState.current + 1);
      aulaVideoState.ranges.push({ start: before, end: aulaVideoState.current });
      if (aulaVideoState.current >= aulaVideoState.duration) {
        aulaVideoState.playing = false;
        if (aulaVideoState.timer) clearInterval(aulaVideoState.timer);
        aulaVideoState.timer = null;
      }
      aulaVideoRender();
    }

    function aulaVideoToggle() {
      aulaVideoState.playing = !aulaVideoState.playing;
      if (aulaVideoState.playing && !aulaVideoState.timer) aulaVideoState.timer = setInterval(aulaVideoTick, 1000);
      if (!aulaVideoState.playing && aulaVideoState.timer) {
        clearInterval(aulaVideoState.timer);
        aulaVideoState.timer = null;
      }
      aulaVideoRender();
    }

    function aulaVideoSeek(value) {
      aulaVideoState.current = Math.max(0, Math.min(aulaVideoState.duration, Number(value) || 0));
      aulaVideoRender();
    }

    function aulaVideoStop() {
      aulaVideoState.playing = false;
      if (aulaVideoState.timer) clearInterval(aulaVideoState.timer);
      aulaVideoState.timer = null;
    }

    function aulaVideoOpen(material) {
      if (!material) return;
      aulaVideoStop();
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaVideoState.materialId = material.id;
      aulaVideoState.duration = Math.max(1, Number(material.duration) || 180);
      aulaVideoState.current = 0;
      aulaVideoState.ranges = [];
      aulaVideoRender();
      closeDrawer();
      showToast(`Video aperto: ${material.title}`);
    }

    const aulaMaterialsOpenBeforeVideo = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.viewer === "video" && descriptor.access === "embedded") return aulaVideoOpen(material);
      aulaVideoStop();
      return aulaMaterialsOpenBeforeVideo(id);
    };

    window.addEventListener("keydown", (event) => {
      if (state.currentView !== "material-video" || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        aulaVideoToggle();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        aulaVideoSeek(aulaVideoState.current - 5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        aulaVideoSeek(aulaVideoState.current + 5);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && aulaVideoState.playing) aulaVideoToggle();
    });


    /* ==========================================================
       MATERIALI — IMPORTAZIONE RICHIESTA
       ========================================================== */
    [
      {
        id: "import-web-functions",
        title: "Articolo web sulle funzioni",
        description: "Pagina HTTPS da trasformare in copia leggibile autorizzata.",
        course: "Programmazione da Zero",
        kind: "link",
        kindLabel: "Pagina web",
        url: "https://example.org/didattica/funzioni",
        access: "import-required",
        accessLabel: "Importazione richiesta",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Importazione necessaria",
        icon: "⇩",
        viewerReady: false,
        importStatus: "pending",
        explicitClassification: true,
        viewer: "web-article",
        provider: "web",
        reason: "La pagina richiede una copia leggibile autorizzata."
      },
      {
        id: "import-external-pdf",
        title: "Scheda esterna sui tipi di dato",
        description: "PDF remoto che richiede importazione nello spazio protetto.",
        course: "Programmazione da Zero",
        kind: "pdf",
        kindLabel: "PDF",
        url: "https://example.org/didattica/tipi-dato.pdf",
        access: "import-required",
        accessLabel: "Importazione richiesta",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Importazione necessaria",
        icon: "⇩",
        viewerReady: false,
        importStatus: "pending",
        explicitClassification: true,
        viewer: "pdf",
        provider: "web",
        reason: "Il PDF deve essere importato prima del monitoraggio."
      }
    ].forEach((item) => {
      if (!aulaMaterialsPanelData.some((current) => current.id === item.id)) aulaMaterialsPanelData.push(item);
    });

    const aulaMaterialImportedStorageKey = "aula-demo-material-imports-v1";
    const aulaMaterialImportPhase = {};
    let aulaMaterialImportBusy = false;

    function aulaMaterialImportedIds() {
      try {
        const parsed = JSON.parse(localStorage.getItem(aulaMaterialImportedStorageKey) || "[]");
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch {
        return new Set();
      }
    }

    function aulaMaterialSaveImported(set) {
      try {
        localStorage.setItem(aulaMaterialImportedStorageKey, JSON.stringify([...set]));
      } catch {
        showToast("Il browser non consente di ricordare l’importazione");
      }
    }

    function aulaMaterialApplyImported(material) {
      if (!material || !aulaMaterialImportedIds().has(material.id)) return material;
      const isPdf = material.id === "import-external-pdf";
      material.sourceType = "file";
      material.storageName = isPdf ? `${material.id}.pdf` : `${material.id}.docx`;
      material.originalName = isPdf ? "tipi-dato.pdf" : "funzioni-copia-leggibile.docx";
      material.access = "internal";
      material.monitoring = isPdf ? "partial" : "full";
      material.importStatus = "ready";
      material.provider = "internal";
      material.viewerReady = true;
      material.explicitClassification = false;
      if (!isPdf) {
        material.kind = "document";
        material.kindLabel = "Documento";
        material.documentSections = [
          {
            title: "Copia leggibile autorizzata",
            paragraphs: [
              "Le funzioni permettono di assegnare un nome a un comportamento riutilizzabile.",
              "Parametri e valori restituiti definiscono il confine tra la funzione e il resto del programma."
            ]
          },
          {
            title: "Origine e privacy",
            paragraphs: [
              "Questa è una copia locale deterministica usata esclusivamente per rappresentare il flusso di importazione.",
              "La demo non ha scaricato né analizzato la pagina remota indicata nel materiale."
            ]
          }
        ];
      }
      aulaMaterialApplyDescriptor(material);
      material.progressLabel = material.progress > 0 ? material.progressLabel : "Pronto da aprire";
      return material;
    }

    aulaMaterialsPanelData.forEach(aulaMaterialApplyImported);

    function aulaMaterialImportStepState(material, step) {
      const imported = aulaMaterialImportedIds().has(material.id);
      if (imported) return ["done", "done", "done"];
      if (step <= 0) return ["", "", ""];
      if (step === 1) return ["active", "", ""];
      if (step === 2) return ["done", "active", ""];
      if (step === 3) return ["done", "done", "active"];
      return ["done", "done", "done"];
    }

    function aulaMaterialImportRender(material, status = "") {
      if (!material || !documentContent) return;
      const imported = aulaMaterialImportedIds().has(material.id);
      const phase = Number(aulaMaterialImportPhase[material.id] || 0);
      const states = aulaMaterialImportStepState(material, phase);
      documentContent.innerHTML = `
        <section class="material-import-state" aria-label="Importazione richiesta per ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Importazione richiesta</div>
          <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
          <p>${aulaMaterialsPanelEscape(material.reason || "Questa risorsa deve essere importata prima dell’uso interno.")}</p>
          <div class="material-import-meta">
            <div><span>Sorgente</span><strong>HTTPS pubblico</strong></div>
            <div><span>Provider</span><strong>${aulaMaterialsPanelEscape(material.provider || "web")}</strong></div>
            <div><span>Viewer previsto</span><strong>${aulaMaterialsPanelEscape(material.viewer || "nessuno")}</strong></div>
            <div><span>Stato</span><strong>${imported ? "Copia interna pronta" : "Importazione necessaria"}</strong></div>
          </div>
          <div class="material-import-steps" aria-live="polite">
            <div data-state="${states[0]}">Verifica della sorgente HTTPS</div>
            <div data-state="${states[1]}">Creazione della copia protetta</div>
            <div data-state="${states[2]}">Classificazione e monitorabilità</div>
          </div>
          <div class="material-import-actions">
            <button class="primary" type="button" onclick="aulaMaterialImport('${aulaMaterialsPanelEscape(material.id)}')" ${aulaMaterialImportBusy ? "disabled" : ""}>${imported ? "Apri copia importata" : "Importa copia autorizzata"}</button>
            <button type="button" onclick="openDrawer('materiali')" ${aulaMaterialImportBusy ? "disabled" : ""}>Scegli un altro materiale</button>
          </div>
          <div class="material-import-status" id="materialImportStatus" role="status" aria-live="polite">${aulaMaterialsPanelEscape(status)}</div>
          <div class="material-import-idempotent"><strong>Operazione idempotente.</strong> Se la stessa risorsa risulta già importata, la demo riutilizza la copia interna e non crea duplicati.</div>
          <div class="material-workspace-honesty"><strong>Demo locale.</strong> Nessun contenuto remoto viene scaricato; la procedura rappresenta soltanto gli stati dell’app ufficiale.</div>
        </section>`;
      state.currentView = "material-import";
      setEveContext("materiali");
      saveState();
    }

    function aulaMaterialImportOpen(material) {
      if (!material) return;
      aulaVideoStop();
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaMaterialImportRender(material);
      closeDrawer();
    }

    async function aulaMaterialImport(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material || aulaMaterialImportBusy) return;
      const imported = aulaMaterialImportedIds();
      if (imported.has(id)) {
        aulaMaterialApplyImported(material);
        showToast("Copia interna già presente: nessun duplicato creato");
        return window.aulaMaterialsPanelOpen(id);
      }

      aulaMaterialImportBusy = true;
      aulaMaterialImportPhase[id] = 1;
      aulaMaterialImportRender(material, "Verifica della sorgente HTTPS…");
      await new Promise((resolve) => setTimeout(resolve, 420));

      aulaMaterialImportPhase[id] = 2;
      aulaMaterialImportRender(material, "Creazione della copia protetta…");
      await new Promise((resolve) => setTimeout(resolve, 460));

      aulaMaterialImportPhase[id] = 3;
      aulaMaterialImportRender(material, "Classificazione del viewer e del monitoraggio…");
      await new Promise((resolve) => setTimeout(resolve, 420));

      imported.add(id);
      aulaMaterialSaveImported(imported);
      aulaMaterialApplyImported(material);
      aulaMaterialImportPhase[id] = 4;
      aulaMaterialImportBusy = false;
      aulaMaterialsPanelState.selectedId = id;
      aulaMaterialsPanelSave();
      aulaMaterialImportRender(material, "Importazione completata. Apertura della copia interna…");
      showToast("Importazione completata senza duplicati");
      await new Promise((resolve) => setTimeout(resolve, 260));
      window.aulaMaterialsPanelOpen(id);
    }

    const aulaMaterialsOpenBeforeImport = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material) return aulaMaterialsOpenBeforeImport(id);
      aulaMaterialApplyImported(material);
      const descriptor = aulaMaterialOfficialDescriptor(material);
      if (descriptor.access === "import-required" && !aulaMaterialImportedIds().has(id)) return aulaMaterialImportOpen(material);
      return aulaMaterialsOpenBeforeImport(id);
    };


    /* ==========================================================
       MATERIALI — TRACKING, AUTOSALVATAGGIO E RIPRESA
       ========================================================== */
    const aulaMaterialProgressStorageKey = "aula-demo-material-progress-v2";
    const aulaMaterialTracking = {
      currentId: null,
      openedAt: 0,
      lastInteraction: 0,
      activeSeconds: 0,
      timer: null,
      scrollTimer: null,
      resumed: false
    };

    function aulaMaterialProgressAll() {
      try {
        const parsed = JSON.parse(localStorage.getItem(aulaMaterialProgressStorageKey) || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    }

    function aulaMaterialProgressGet(id) {
      return id ? aulaMaterialProgressAll()[id] || null : null;
    }

    function aulaMaterialProgressWrite(all) {
      try {
        localStorage.setItem(aulaMaterialProgressStorageKey, JSON.stringify(all));
        return true;
      } catch {
        return false;
      }
    }

    function aulaMaterialTrackableView() {
      return ["material-pdf", "material-presentation", "material-video", "material-document", "material-text"].includes(state.currentView);
    }

    function aulaMaterialCurrentDescriptor() {
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaMaterialTracking.currentId);
      return material ? aulaMaterialOfficialDescriptor(material) : null;
    }

    function aulaMaterialPresentationTotal(material) {
      try {
        return typeof aulaPresentationSlides === "function" ? Math.max(1, aulaPresentationSlides(material).length) : Math.max(1, material?.slides?.length || 1);
      } catch {
        return Math.max(1, material?.slides?.length || 1);
      }
    }

    function aulaMaterialPosition() {
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaMaterialTracking.currentId);
      const viewer = material ? aulaMaterialOfficialDescriptor(material).viewer : null;
      if (viewer === "pdf") {
        const total = Math.max(1, aulaPdfPages.length);
        return { page: aulaPdfState.page, completion: Math.round((aulaPdfState.page / total) * 100) };
      }
      if (viewer === "presentation") {
        const total = aulaMaterialPresentationTotal(material);
        return { slide: aulaPresentationState.slide, completion: Math.round((aulaPresentationState.slide / total) * 100) };
      }
      if (viewer === "video") {
        const ranges = aulaMergeRanges(aulaVideoState.ranges);
        return {
          videoTime: aulaVideoState.current,
          videoRanges: ranges,
          completion: Math.min(100, Math.round((aulaVideoWatchedSeconds() / Math.max(1, aulaVideoState.duration)) * 100))
        };
      }
      if (viewer === "document" || viewer === "text") {
        const scrollHeight = Math.max(1, pageScroll?.scrollHeight || 1);
        const viewport = Math.max(0, pageScroll?.clientHeight || 0);
        const scrollTop = Math.max(0, pageScroll?.scrollTop || 0);
        const ratio = Math.min(1, (scrollTop + viewport) / scrollHeight);
        return { scrollTop, scrollRatio: ratio, completion: Math.round(ratio * 100) };
      }
      return { completion: Number(material?.progress || 0) };
    }

    function aulaMaterialProgressLabel(material, viewer, completion) {
      if (viewer === "video") return completion >= 90 ? "Completato" : `${completion}% realmente visto`;
      if (viewer === "pdf") return `Pagina ${aulaPdfState.page} di ${Math.max(1, aulaPdfPages.length)}`;
      if (viewer === "presentation") return `Slide ${aulaPresentationState.slide} di ${aulaMaterialPresentationTotal(material)}`;
      if (completion >= 95) return "Completato";
      return completion > 0 ? "Ripresa disponibile" : "Non iniziato";
    }

    function aulaMaterialTrackingStatus(text) {
      const node = document.getElementById("materialTrackingStatus");
      if (node) node.textContent = text;
    }

    function aulaMaterialTrackingSave(eventType = null) {
      if (!aulaMaterialTracking.currentId || !aulaMaterialTrackableView()) return;
      const all = aulaMaterialProgressAll();
      const previous = all[aulaMaterialTracking.currentId] || {};
      const position = aulaMaterialPosition();
      const events = Array.isArray(previous.events) ? [...previous.events] : [];
      if (eventType) events.push({ type: eventType, at: new Date().toISOString() });
      all[aulaMaterialTracking.currentId] = {
        ...previous,
        ...position,
        activeSeconds: aulaMaterialTracking.activeSeconds,
        updatedAt: new Date().toISOString(),
        events: events.slice(-10)
      };
      const saved = aulaMaterialProgressWrite(all);
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaMaterialTracking.currentId);
      const viewer = material ? aulaMaterialOfficialDescriptor(material).viewer : null;
      if (material && Number.isFinite(position.completion)) {
        material.progress = position.completion;
        material.progressLabel = aulaMaterialProgressLabel(material, viewer, position.completion);
        saveState();
      }
      aulaMaterialTrackingStatus(saved ? "Salvato automaticamente" : "Salvataggio locale non disponibile");
    }

    function aulaMaterialTrackingStop(eventType = "material_closed") {
      if (aulaMaterialTracking.scrollTimer) clearTimeout(aulaMaterialTracking.scrollTimer);
      aulaMaterialTracking.scrollTimer = null;
      if (aulaMaterialTracking.timer) clearInterval(aulaMaterialTracking.timer);
      aulaMaterialTracking.timer = null;
      if (aulaMaterialTracking.currentId && aulaMaterialTrackableView()) aulaMaterialTrackingSave(eventType);
      aulaMaterialTracking.currentId = null;
    }

    function aulaMaterialTrackingStart(id, saved) {
      aulaMaterialTracking.currentId = id;
      aulaMaterialTracking.openedAt = Date.now();
      aulaMaterialTracking.lastInteraction = Date.now();
      aulaMaterialTracking.activeSeconds = Number(saved?.activeSeconds || 0);
      aulaMaterialTracking.resumed = Boolean(saved);
      aulaMaterialTracking.timer = setInterval(() => {
        const visible = document.visibilityState === "visible";
        const recent = Date.now() - aulaMaterialTracking.lastInteraction < 30000;
        const videoActive = aulaVideoState.materialId === id && aulaVideoState.playing;
        if (visible && (recent || videoActive)) {
          aulaMaterialTracking.activeSeconds += 1;
          if (aulaMaterialTracking.activeSeconds % 5 === 0) aulaMaterialTrackingSave();
        }
      }, 1000);
    }

    function aulaMaterialEventLabel(type) {
      return ({
        material_opened: "Aperto",
        material_resumed: "Ripreso",
        material_closed: "Chiuso",
        position_changed: "Posizione salvata"
      })[type] || type;
    }

    function aulaMaterialSavedPositionText(saved, viewer) {
      if (!saved) return "Nessuna posizione precedente.";
      if (viewer === "pdf" && saved.page) return `Pagina ${saved.page}`;
      if (viewer === "presentation" && saved.slide) return `Slide ${saved.slide}`;
      if (viewer === "video") return `${aulaFormatVideoTime(saved.videoTime || 0)} · ${Math.round(saved.completion || 0)}% visto`;
      if ((viewer === "document" || viewer === "text") && Number.isFinite(saved.scrollRatio)) return `${Math.round(saved.scrollRatio * 100)}% del testo`;
      return `${Math.round(saved.completion || 0)}%`;
    }

    function aulaMaterialTrackingBanner(id, saved) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material || !documentContent || !aulaMaterialTrackableView()) return;
      const viewer = aulaMaterialOfficialDescriptor(material).viewer;
      const history = (saved?.events || []).slice(-4).map((event) => `<span>${aulaMaterialsPanelEscape(aulaMaterialEventLabel(event.type))}</span>`).join("");
      const banner = document.createElement("div");
      banner.className = "material-tracking-banner";
      banner.innerHTML = `
        <div class="material-tracking-icon">↺</div>
        <div class="material-tracking-copy">
          <strong>${saved ? "Materiale ripreso" : "Nuovo materiale aperto"}</strong>
          <span>${saved ? `Posizione e ${Math.round(Number(saved.activeSeconds || 0) / 60)} minuti attivi ripristinati.` : "La posizione e il tempo attivo verranno salvati automaticamente in questo browser."}</span>
          <div class="material-tracking-details"><span>${aulaMaterialsPanelEscape(aulaMaterialSavedPositionText(saved, viewer))}</span><span>Salvataggio ogni 5 secondi attivi</span></div>
          <div class="material-tracking-history">${history}</div>
        </div>
        <div class="material-tracking-status" id="materialTrackingStatus">Salvato automaticamente</div>`;
      documentContent.prepend(banner);
    }

    function aulaMaterialRestoreAfterOpen(id, saved) {
      if (!saved) return;
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const viewer = material ? aulaMaterialOfficialDescriptor(material).viewer : null;
      if (viewer === "pdf" && Number.isFinite(saved.page)) {
        aulaPdfState.page = Math.max(1, Math.min(aulaPdfPages.length, Number(saved.page)));
        aulaPdfRender();
      } else if (viewer === "presentation" && Number.isFinite(saved.slide)) {
        const total = aulaMaterialPresentationTotal(material);
        aulaPresentationState.slide = Math.max(1, Math.min(total, Number(saved.slide)));
        aulaPresentationRender();
      } else if (viewer === "video") {
        aulaVideoState.current = Math.max(0, Math.min(aulaVideoState.duration, Number(saved.videoTime || 0)));
        aulaVideoState.ranges = Array.isArray(saved.videoRanges) ? aulaMergeRanges(saved.videoRanges) : [];
        aulaVideoRender();
      } else if ((viewer === "document" || viewer === "text") && Number.isFinite(saved.scrollTop)) {
        pageScroll?.scrollTo({ top: Number(saved.scrollTop), behavior: "auto" });
      }
      if (material && Number.isFinite(saved.completion)) material.progress = Number(saved.completion);
    }

    const aulaMaterialsOpenBeforeTracking = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      aulaMaterialTrackingStop();
      const saved = aulaMaterialProgressGet(id);
      const result = aulaMaterialsOpenBeforeTracking(id);
      window.setTimeout(() => {
        if (!aulaMaterialTrackableView()) return;
        aulaMaterialRestoreAfterOpen(id, saved);
        aulaMaterialTrackingBanner(id, saved);
        aulaMaterialTrackingStart(id, saved);
        aulaMaterialTrackingSave(saved ? "material_resumed" : "material_opened");
      }, 40);
      return result;
    };

    const aulaPdfMoveBeforeTracking = window.aulaPdfMove;
    if (typeof aulaPdfMoveBeforeTracking === "function") {
      window.aulaPdfMove = function(direction) {
        const result = aulaPdfMoveBeforeTracking(direction);
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave("position_changed");
        return result;
      };
    }

    const aulaPresentationMoveBeforeTracking = window.aulaPresentationMove;
    if (typeof aulaPresentationMoveBeforeTracking === "function") {
      window.aulaPresentationMove = function(direction) {
        const result = aulaPresentationMoveBeforeTracking(direction);
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave("position_changed");
        return result;
      };
    }

    const aulaVideoSeekBeforeTracking = window.aulaVideoSeek;
    if (typeof aulaVideoSeekBeforeTracking === "function") {
      window.aulaVideoSeek = function(value) {
        const result = aulaVideoSeekBeforeTracking(value);
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave("position_changed");
        return result;
      };
    }

    const aulaVideoToggleBeforeTracking = window.aulaVideoToggle;
    if (typeof aulaVideoToggleBeforeTracking === "function") {
      window.aulaVideoToggle = function() {
        const result = aulaVideoToggleBeforeTracking();
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave();
        return result;
      };
    }

    document.addEventListener("pointerdown", () => {
      if (aulaMaterialTracking.currentId) aulaMaterialTracking.lastInteraction = Date.now();
    }, { passive: true });

    document.addEventListener("keydown", () => {
      if (aulaMaterialTracking.currentId) aulaMaterialTracking.lastInteraction = Date.now();
    }, { passive: true });

    pageScroll?.addEventListener("scroll", () => {
      if (!aulaMaterialTracking.currentId || !aulaMaterialTrackableView()) return;
      aulaMaterialTracking.lastInteraction = Date.now();
      aulaMaterialTrackingStatus("Salvataggio…");
      if (aulaMaterialTracking.scrollTimer) clearTimeout(aulaMaterialTracking.scrollTimer);
      aulaMaterialTracking.scrollTimer = setTimeout(() => aulaMaterialTrackingSave("position_changed"), 350);
    }, { passive: true });

    window.addEventListener("pagehide", () => aulaMaterialTrackingStop());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && aulaMaterialTracking.currentId) aulaMaterialTrackingSave("material_closed");
    });


    /* ==========================================================
       MATERIALI — ERRORI SICURI E ALTERNATIVE
       ========================================================== */
    [
      {
        id: "material-unsupported-zip",
        title: "Archivio esercizi ZIP",
        description: "Formato non supportato dal workspace didattico.",
        course: "Risorse libere",
        kind: "unsupported",
        kindLabel: "ZIP",
        access: "unsupported",
        accessLabel: "Non supportato",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Non disponibile",
        icon: "!",
        viewerReady: false,
        explicitClassification: true,
        viewer: null,
        importStatus: "failed",
        provider: "none",
        reason: "Gli archivi ZIP non vengono aperti nel workspace."
      },
      {
        id: "material-unavailable",
        title: "Dispensa rimossa dal proprietario",
        description: "La voce è ancora nella cronologia, ma il contenuto non è più disponibile.",
        course: "Programmazione da Zero",
        kind: "unavailable",
        kindLabel: "Non disponibile",
        access: "unsupported",
        accessLabel: "Non disponibile",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 24,
        progressLabel: "Cronologia conservata",
        icon: "×",
        viewerReady: false,
        explicitClassification: true,
        viewer: null,
        importStatus: "failed",
        provider: "none",
        reason: "Il file originale è stato rimosso; progressi e cronologia restano separati."
      },
      {
        id: "material-retry-demo",
        title: "Appunti temporaneamente non caricabili",
        description: "Stato demo per verificare errore, retry e recupero idempotente.",
        course: "Programmazione da Zero",
        kind: "text",
        kindLabel: "Testo",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 12,
        progressLabel: "Ripresa sospesa",
        icon: "↻",
        viewerReady: true,
        explicitClassification: true,
        viewer: "text",
        importStatus: "ready",
        provider: "internal",
        reason: "Errore temporaneo di lettura."
      }
    ].forEach((item) => {
      if (!aulaMaterialsPanelData.some((current) => current.id === item.id)) aulaMaterialsPanelData.push(item);
    });

    const aulaMaterialErrorAttempts = {};
    const aulaMaterialErrorBusy = new Set();
    const aulaMaterialErrorSnapshots = {};

    function aulaMaterialAlternatives(excludeId) {
      return aulaMaterialsPanelData
        .filter((item) => {
          if (item.id === excludeId) return false;
          const descriptor = aulaMaterialOfficialDescriptor(item);
          return descriptor.access === "internal" && ["lesson", "pdf", "document", "presentation", "text"].includes(descriptor.viewer || item.kind);
        })
        .slice(0, 3);
    }

    function aulaMaterialErrorDefinition(kind) {
      return ({
        unsupported: {
          title: "Formato non supportato",
          text: "Questo formato non dispone di un viewer interno sicuro. Il file non è stato eseguito né aperto esternamente.",
          code: "unsupported_material",
          tone: "warning",
          retry: false
        },
        unavailable: {
          title: "Materiale non disponibile",
          text: "Il contenuto è stato rimosso o non è più raggiungibile. Progressi e cronologia restano conservati separatamente.",
          code: "material_unavailable",
          tone: "error",
          retry: false
        },
        temporary: {
          title: "Caricamento non riuscito",
          text: "La lettura si è interrotta prima di mostrare il contenuto. Nessun progresso parziale è stato sovrascritto.",
          code: "temporary_load_error",
          tone: "error",
          retry: true
        }
      })[kind];
    }

    function aulaMaterialErrorSnapshot(material) {
      if (!aulaMaterialErrorSnapshots[material.id]) {
        aulaMaterialErrorSnapshots[material.id] = {
          progress: Number(material.progress || 0),
          progressLabel: material.progressLabel || "Non iniziato",
          tracking: typeof aulaMaterialProgressGet === "function" ? aulaMaterialProgressGet(material.id) : null
        };
      }
      return aulaMaterialErrorSnapshots[material.id];
    }

    function aulaMaterialErrorRender(material, kind) {
      if (!material || !documentContent) return;
      const definition = aulaMaterialErrorDefinition(kind);
      const alternatives = aulaMaterialAlternatives(material.id);
      const snapshot = aulaMaterialErrorSnapshot(material);
      const savedMinutes = Math.round(Number(snapshot.tracking?.activeSeconds || 0) / 60);
      documentContent.innerHTML = `
        <section class="material-error-state" data-tone="${definition.tone}" aria-label="${aulaMaterialsPanelEscape(definition.title)}">
          <div class="document-section-label">Stato sicuro del workspace</div>
          <h1>${aulaMaterialsPanelEscape(definition.title)}</h1>
          <p>${aulaMaterialsPanelEscape(definition.text)}</p>
          <div class="material-error-code">${aulaMaterialsPanelEscape(definition.code)} · ${aulaMaterialsPanelEscape(material.id)}</div>
          <div class="material-error-preserved">
            <div><span>Progresso conservato</span><strong>${snapshot.progress}%</strong></div>
            <div><span>Stato precedente</span><strong>${aulaMaterialsPanelEscape(snapshot.progressLabel)}</strong></div>
            <div><span>Tempo locale</span><strong>${savedMinutes} min</strong></div>
          </div>
          <div class="material-error-actions">
            ${definition.retry ? `<button class="primary" type="button" onclick="aulaMaterialRetry('${aulaMaterialsPanelEscape(material.id)}')" ${aulaMaterialErrorBusy.has(material.id) ? "disabled" : ""}>${aulaMaterialErrorBusy.has(material.id) ? "Nuovo tentativo…" : "Riprova caricamento"}</button>` : ""}
            <button type="button" onclick="openDrawer('materiali')" ${aulaMaterialErrorBusy.has(material.id) ? "disabled" : ""}>Torna ai materiali</button>
          </div>
          <div>
            <strong>Alternative interne sicure</strong>
            <div class="material-alternatives">
              ${alternatives.map((item) => `<article class="material-alternative"><strong>${aulaMaterialsPanelEscape(item.title)}</strong><span>${aulaMaterialsPanelEscape(item.kindLabel)} · ${aulaMaterialsPanelEscape(item.monitoringLabel)}</span><button type="button" onclick="aulaMaterialsPanelOpen('${aulaMaterialsPanelEscape(item.id)}')">Apri alternativa</button></article>`).join("")}
            </div>
          </div>
          <div class="material-error-honesty"><strong>Stato deterministico della demo.</strong> Nessun file non supportato viene eseguito. Il retry recuperabile modifica lo stesso materiale, conserva il progresso e non crea duplicati.</div>
        </section>`;
      state.currentView = "material-error";
      setEveContext("materiali");
      saveState();
    }

    function aulaMaterialErrorOpen(material, kind) {
      if (!material) return;
      if (typeof aulaMaterialTrackingStop === "function") aulaMaterialTrackingStop();
      if (typeof aulaVideoStop === "function") aulaVideoStop();
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaMaterialErrorSnapshot(material);
      aulaMaterialErrorRender(material, kind);
      closeDrawer();
    }

    async function aulaMaterialRetry(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material || aulaMaterialErrorBusy.has(id) || aulaMaterialErrorAttempts[id]) return;
      const snapshot = aulaMaterialErrorSnapshot(material);
      aulaMaterialErrorBusy.add(id);
      aulaMaterialErrorRender(material, "temporary");
      await new Promise((resolve) => setTimeout(resolve, 620));

      aulaMaterialErrorAttempts[id] = 1;
      aulaMaterialErrorBusy.delete(id);
      Object.assign(material, {
        kind: "document",
        kindLabel: "Documento recuperato",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        viewer: "document",
        viewerReady: true,
        importStatus: "ready",
        provider: "internal",
        explicitClassification: true,
        reason: "Contenuto recuperato dopo un errore temporaneo.",
        progress: snapshot.progress,
        progressLabel: snapshot.progressLabel,
        documentSections: [
          {
            title: "Contenuto recuperato",
            paragraphs: [
              "Il secondo tentativo ha recuperato una copia coerente del testo.",
              "La posizione precedente non è stata cancellata e il materiale non è stato duplicato."
            ]
          },
          {
            title: "Verifica del recupero",
            paragraphs: [
              `Progresso precedente conservato: ${snapshot.progress}%.`,
              "Il viewer ora usa una rappresentazione testuale interna sicura."
            ]
          }
        ]
      });
      aulaMaterialApplyDescriptor(material);
      showToast("Materiale recuperato al secondo tentativo");
      window.aulaMaterialsPanelOpen(id);
    }

    const aulaMaterialsOpenBeforeErrors = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material) return aulaMaterialsOpenBeforeErrors(id);
      if (id === "material-unsupported-zip") return aulaMaterialErrorOpen(material, "unsupported");
      if (id === "material-unavailable") return aulaMaterialErrorOpen(material, "unavailable");
      if (id === "material-retry-demo" && !aulaMaterialErrorAttempts[id]) return aulaMaterialErrorOpen(material, "temporary");
      return aulaMaterialsOpenBeforeErrors(id);
    };


    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */


    function exerciseDefinitionById(id) {
      return exerciseDefinitions.find((exercise) => exercise.id === id) || exerciseDefinitions[0];
    }

    function normalizedExerciseCompletedIds() {
      const source = Array.isArray(state.exerciseCompletedIds) ? state.exerciseCompletedIds : [];
      return [...new Set(source)].filter((id) => exerciseDefinitions.some((exercise) => exercise.id === id));
    }

    function exerciseCompletionDetails() {
      const completed = normalizedExerciseCompletedIds();
      return {
        completed,
        count: completed.length,
        total: exerciseDefinitions.length,
        percent: Math.round((completed.length / exerciseDefinitions.length) * 100)
      };
    }

    function buildExercisesTemplate() {
      const details = exerciseCompletionDetails();
      const drafts = state.exerciseDrafts && typeof state.exerciseDrafts === "object"
        ? state.exerciseDrafts
        : {};
      const activeId = exerciseDefinitionById(state.activeExerciseId).id;

      return `
        <div class="document-section-label">Lezione 0.1 · Esercizi</div>
        <section class="exercise-page-intro">
          <h1>Esercizi della lezione</h1>
          <p>Lavora un esercizio per volta. Puoi selezionare qualsiasi testo nella consegna o nella tua risposta e farlo leggere da Eve.</p>
          <div class="exercise-workflow-banner">
            <div class="exercise-workflow-icon" aria-hidden="true">✦</div>
            <div>
              <strong>Leggi → prova → confronta</strong>
              <small>Eve legge il testo scelto, offre suggerimenti senza anticipare la risposta e mostra la soluzione soltanto quando concludi l'esercizio.</small>
            </div>
            <div class="exercise-progress-mini">
              <strong id="exerciseProgressText">${details.count}/${details.total}</strong>
              <small>completati</small>
              <div class="exercise-progress-track" aria-hidden="true"><span id="exerciseProgressBar" style="width:${details.percent}%"></span></div>
            </div>
          </div>
        </section>

        <div class="exercise-list">
          ${exerciseDefinitions.map((exercise, index) => {
            const completed = details.completed.includes(exercise.id);
            const active = activeId === exercise.id;
            const draft = String(drafts[exercise.id] || "");
            return `
              <article class="exercise-card ${active ? "is-active" : ""} ${completed ? "is-complete" : ""}" data-exercise-id="${exercise.id}" onclick="activateExercise('${exercise.id}')">
                <header class="exercise-card-head">
                  <div>
                    <div class="exercise-number-line">
                      <span>Esercizio ${index + 1} di ${exerciseDefinitions.length}</span>
                      <span class="exercise-kind-badge">${escapeHtml(exercise.kind)}</span>
                    </div>
                    <h2>${escapeHtml(exercise.title)}</h2>
                  </div>
                  <span class="exercise-state-badge" id="exerciseStatus-${exercise.id}">${completed ? "Completato" : "Da svolgere"}</span>
                </header>

                <div class="exercise-prompt" id="exercisePrompt-${exercise.id}">
                  <p>${escapeHtml(exercise.prompt)}</p>
                </div>
                <div class="exercise-goal"><strong>Obiettivo</strong><span>${escapeHtml(exercise.goal)}</span></div>

                <div class="exercise-answer-area">
                  <div class="exercise-answer-head">
                    <label for="exerciseAnswer-${exercise.id}"><strong>La tua risposta</strong></label>
                    <span class="exercise-char-count" id="exerciseCharCount-${exercise.id}">${draft.length} caratteri</span>
                  </div>
                  <textarea
                    id="exerciseAnswer-${exercise.id}"
                    data-exercise-answer="${exercise.id}"
                    placeholder="${escapeHtml(exercise.placeholder)}"
                    onfocus="activateExercise('${exercise.id}')"
                    oninput="updateExerciseDraft('${exercise.id}', this.value)"
                  >${escapeHtml(draft)}</textarea>

                  <div class="exercise-card-actions">
                    <button type="button" onclick="event.stopPropagation(); speakExercisePrompt('${exercise.id}')">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h4l5-4v14l-5-4H5z"></path><path d="M17 9.5c1.1 1.2 1.1 3.8 0 5"></path></svg>
                      Leggi consegna
                    </button>
                    <button type="button" onclick="event.stopPropagation(); giveExerciseHint('${exercise.id}')">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4"></path><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5c-1 .7-1.8 1.5-1.8 2.5h-4c0-1-.8-1.8-1.8-2.5Z"></path></svg>
                      Suggerimento
                    </button>
                    <button class="finish-exercise-button" type="button" onclick="event.stopPropagation(); finishExercise('${exercise.id}')">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>
                      ${completed ? "Riascolta la soluzione" : "Concludi e ascolta la soluzione"}
                    </button>
                  </div>
                </div>

                <div class="exercise-inline-hint" id="exerciseHint-${exercise.id}"></div>

                <section class="exercise-solution ${completed ? "is-visible" : ""}" id="exerciseSolution-${exercise.id}" aria-live="polite">
                  <div class="exercise-solution-head">
                    <div>
                      <div class="exercise-solution-label">Soluzione corretta · modello di riferimento</div>
                      <strong>Confronta struttura, precisione e casi limite</strong>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); speakExerciseSolution('${exercise.id}')" aria-label="Riascolta la soluzione">🔊</button>
                  </div>
                  ${exercise.solutionHtml}
                </section>
              </article>
            `;
          }).join("")}
        </div>
      `;
    }

    function renderExercisesView(options = {}) {
      const preserveScroll = Boolean(options.preserveScroll);
      const previousScroll = pageScroll ? pageScroll.scrollTop : 0;
      documentContent.innerHTML = buildExercisesTemplate();
      state.currentView = "exercises";
      activateExercise(state.activeExerciseId || exerciseDefinitions[0].id, { scroll: false, save: false });
      updateExerciseProgressUI();
      updateEveVoiceActivity("exercises");
      if (preserveScroll && pageScroll) pageScroll.scrollTop = previousScroll;
    }

    function updateExerciseProgressUI() {
      const details = exerciseCompletionDetails();
      const text = document.getElementById("exerciseProgressText");
      const bar = document.getElementById("exerciseProgressBar");
      if (text) text.textContent = `${details.count}/${details.total}`;
      if (bar) bar.style.width = `${details.percent}%`;
    }

    let exerciseDraftSaveTimer = null;

    function updateExerciseDraft(id, value) {
      const exercise = exerciseDefinitionById(id);
      state.exerciseDrafts = state.exerciseDrafts && typeof state.exerciseDrafts === "object"
        ? state.exerciseDrafts
        : {};
      state.exerciseDrafts[exercise.id] = value;
      const count = document.getElementById(`exerciseCharCount-${exercise.id}`);
      if (count) count.textContent = `${value.length} caratteri`;
      window.clearTimeout(exerciseDraftSaveTimer);
      exerciseDraftSaveTimer = window.setTimeout(() => {
        saveState();
        if (autosaveLabel) autosaveLabel.textContent = "Salvato automaticamente";
      }, 420);
      if (autosaveLabel) autosaveLabel.textContent = "Salvataggio...";
    }

    function activateExercise(id, options = {}) {
      const exercise = exerciseDefinitionById(id);
      state.activeExerciseId = exercise.id;
      documentContent.querySelectorAll(".exercise-card").forEach((card) => {
        card.classList.toggle("is-active", card.dataset.exerciseId === exercise.id);
      });
      updateExerciseVoicePanel();
      if (options.scroll) {
        document.querySelector(`[data-exercise-id="${exercise.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (options.save !== false) saveState();
    }

    function updateExerciseVoicePanel() {
      if (!exerciseVoiceMode) return;
      const exercise = exerciseDefinitionById(state.activeExerciseId);
      const index = exerciseDefinitions.findIndex((item) => item.id === exercise.id);
      const completed = normalizedExerciseCompletedIds().includes(exercise.id);
      if (exerciseVoiceCounter) exerciseVoiceCounter.textContent = `Esercizio ${index + 1} di ${exerciseDefinitions.length}`;
      if (exerciseVoiceCurrentTitle) exerciseVoiceCurrentTitle.textContent = exercise.title;
      if (exerciseVoiceCurrentStatus) exerciseVoiceCurrentStatus.textContent = completed ? "Completato" : "Da svolgere";
      if (exerciseFinishVoiceLabel) exerciseFinishVoiceLabel.textContent = completed ? "Riascolta soluzione" : "Concludi";
      if (exerciseFinishVoiceButton) exerciseFinishVoiceButton.title = completed ? "Riascolta la soluzione corretta" : "Concludi e ascolta la soluzione";
      updateExerciseSelectionPreview();
    }

    function updateEveVoiceActivity(view = state.currentView) {
      if (!eveVoiceConsole || !exerciseVoiceMode) return;
      const exerciseMode = view === "exercises";
      eveVoiceConsole.dataset.activity = exerciseMode ? "exercises" : "lesson";
      exerciseVoiceMode.hidden = !exerciseMode;
      if (eveVoiceTitle) eveVoiceTitle.textContent = exerciseMode ? "Assistente esercizi" : "Audio-lezione";

      if (exerciseMode) {
        if (!exerciseSpeechState.speaking) {
          audioLessonStatus.textContent = "Seleziona un testo oppure scegli un esercizio: Eve può leggerlo, suggerire il prossimo passo e spiegare la soluzione finale.";
          audioLessonProgress.style.width = "0%";
        }
        if (eveFrequencyTopic && !exerciseSpeechState.speaking) {
          eveFrequencyTopic.innerHTML = "<strong>Ciano</strong> · La frequenza seguirà consegna, suggerimento, testo selezionato o soluzione.";
        }
        updateExerciseVoicePanel();
      } else if (!audioLessonState.speaking) {
        audioLessonStatus.textContent = "Eve è pronta a leggere e spiegare la sezione corrente.";
      }
    }

    function exerciseTextElement(id, kind = "prompt") {
      if (kind === "solution") return document.getElementById(`exerciseSolution-${id}`);
      if (kind === "answer") return document.getElementById(`exerciseAnswer-${id}`);
      return document.getElementById(`exercisePrompt-${id}`);
    }

    function makeExerciseSpeechBlock(text, element, kind = "prompt") {
      const source = element || document.createElement("p");
      const attention = kind === "solution"
        ? { focus: "example", importance: 3, label: "Soluzione corretta", colorName: "Verde-ciano" }
        : kind === "hint"
          ? { focus: "key", importance: 2, label: "Suggerimento", colorName: "Violetto" }
          : classifySpeechImportance(source, text);
      return {
        text,
        focus: attention.focus,
        importance: attention.importance,
        importanceLabel: attention.label,
        colorName: attention.colorName
      };
    }

    function clearExerciseAudioHighlight() {
      documentContent.querySelectorAll(".exercise-audio-reading").forEach((element) => {
        element.classList.remove("exercise-audio-reading", "audio-reading");
        element.removeAttribute("data-audio-focus");
      });
    }

    function setExercisePlayState(stateName = "play") {
      if (!exerciseVoicePlayButton) return;
      const paused = stateName === "pause";
      exerciseVoicePlayButton.dataset.state = paused ? "pause" : "play";
      if (exerciseVoicePlayLabel) {
        exerciseVoicePlayLabel.textContent = paused ? "Pausa" : (exerciseSpeechState.selectedText ? "Leggi selezione" : "Leggi consegna");
      }
    }

    function speakExerciseText(text, options = {}) {
      const normalized = normalizeSpeechText(text || "");
      if (!normalized) {
        showToast("Nessun testo disponibile da leggere");
        return;
      }
      if (!speechIsSupported()) {
        showToast("Sintesi vocale non disponibile in questo browser");
        return;
      }

      if (audioLessonState.speaking) stopAudioLesson(false);
      stopExerciseSpeech(false);
      window.speechSynthesis.cancel();

      const exercise = exerciseDefinitionById(options.exerciseId || state.activeExerciseId);
      const element = options.element || exerciseTextElement(exercise.id, options.kind);
      const block = makeExerciseSpeechBlock(normalized, element, options.kind || "prompt");
      const utterance = new SpeechSynthesisUtterance(normalized);
      const voice = selectedSpeechVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || "it-IT";
      utterance.rate = Number(state.audioRate || 1);
      utterance.pitch = options.kind === "solution" ? 1.02 : 1;

      exerciseSpeechState.speaking = true;
      exerciseSpeechState.paused = false;
      exerciseSpeechState.utterance = utterance;
      exerciseSpeechState.currentText = normalized;
      exerciseSpeechState.currentLabel = options.label || "testo selezionato";
      exerciseSpeechState.currentKind = options.kind || "selection";
      exerciseSpeechState.activeExerciseId = exercise.id;
      exerciseSpeechState.activeElement = element;
      exerciseSpeechState.block = block;
      state.activeExerciseId = exercise.id;

      clearExerciseAudioHighlight();
      if (element?.classList) {
        element.classList.add("exercise-audio-reading", "audio-reading");
        element.dataset.audioFocus = block.focus;
        element.scrollIntoView?.({ behavior: "smooth", block: "center" });
      }

      audioLessonState.activeElement = element;
      audioLessonState.activeBlock = block;
      setEveContext("exercises");
      if (eveMascotAvailable) {
        eveAssistant.classList.add("eve-speaking");
        eveAssistant.classList.remove("eve-paused");
        positionEveBesideReading(element, block);
      }
      setExercisePlayState("pause");
      startFrequencyAnimation(block);
      audioLessonProgress.style.width = "2%";
      audioLessonStatus.textContent = `Eve legge ${options.label || "il testo selezionato"} · ${exercise.title}`;
      updateExerciseVoicePanel();

      utterance.onboundary = (event) => {
        if (typeof event.charIndex !== "number") return;
        const value = Math.max(2, Math.min(96, Math.round((event.charIndex / normalized.length) * 100)));
        audioLessonProgress.style.width = `${value}%`;
      };

      utterance.onend = () => {
        if (!exerciseSpeechState.speaking) return;
        exerciseSpeechState.speaking = false;
        exerciseSpeechState.paused = false;
        setExercisePlayState("play");
        audioLessonProgress.style.width = "100%";
        stopFrequencyAnimation(false);
        clearExerciseAudioHighlight();
        if (eveMascotAvailable) eveAssistant.classList.remove("eve-speaking", "eve-paused");
        resetReadingMascot();

        if (options.kind === "solution") {
          const nextId = nextIncompleteExerciseId(exercise.id);
          if (nextId) {
            const nextExercise = exerciseDefinitionById(nextId);
            audioLessonStatus.textContent = `Soluzione completata. Prossimo esercizio consigliato: ${nextExercise.title}.`;
            exerciseNextSuggestion?.classList.add("is-visible");
          } else {
            audioLessonStatus.textContent = "Soluzione completata. Hai concluso tutti gli esercizi della lezione.";
            exerciseNextSuggestion?.classList.remove("is-visible");
          }
        } else {
          audioLessonStatus.textContent = `Lettura completata · ${exercise.title}.`;
        }
      };

      utterance.onerror = (event) => {
        if (["canceled", "interrupted"].includes(event.error)) return;
        exerciseSpeechState.speaking = false;
        exerciseSpeechState.paused = false;
        setExercisePlayState("play");
        clearExerciseAudioHighlight();
        stopFrequencyAnimation(true);
        audioLessonStatus.textContent = "Il browser ha interrotto la lettura dell'esercizio.";
        if (eveMascotAvailable) eveAssistant.classList.remove("eve-speaking", "eve-paused");
      };

      window.speechSynthesis.speak(utterance);
    }

    function stopExerciseSpeech(updateStatus = true) {
      if (speechIsSupported() && (exerciseSpeechState.speaking || exerciseSpeechState.paused)) {
        window.speechSynthesis.cancel();
      }
      exerciseSpeechState.speaking = false;
      exerciseSpeechState.paused = false;
      exerciseSpeechState.utterance = null;
      clearExerciseAudioHighlight();
      setExercisePlayState("play");
      stopFrequencyAnimation(updateStatus);
      if (eveMascotAvailable) eveAssistant.classList.remove("eve-speaking", "eve-paused");
      resetReadingMascot();
      if (updateStatus && state.currentView === "exercises") {
        audioLessonStatus.textContent = "Eve ha interrotto la lettura dell'esercizio.";
        audioLessonProgress.style.width = "0%";
      }
    }

    function toggleExerciseSpeech() {
      if (!exerciseSpeechState.speaking) {
        if (exerciseSpeechState.selectedText) speakExerciseSelection();
        else speakActiveExercisePrompt();
        return;
      }
      if (exerciseSpeechState.paused) {
        window.speechSynthesis.resume();
        exerciseSpeechState.paused = false;
        setExercisePlayState("pause");
        startFrequencyAnimation(exerciseSpeechState.block);
        if (eveMascotAvailable) eveAssistant.classList.remove("eve-paused");
        audioLessonStatus.textContent = `Eve ha ripreso ${exerciseSpeechState.currentLabel}.`;
      } else {
        window.speechSynthesis.pause();
        exerciseSpeechState.paused = true;
        setExercisePlayState("play");
        pauseFrequencyAnimation();
        if (eveMascotAvailable) eveAssistant.classList.add("eve-paused");
        audioLessonStatus.textContent = "Lettura dell'esercizio in pausa.";
      }
    }

    function speakExercisePrompt(id) {
      const exercise = exerciseDefinitionById(id);
      activateExercise(exercise.id, { save: false });
      speakExerciseText(`${exercise.title}. ${exercise.prompt}. Obiettivo: ${exercise.goal}`, {
        exerciseId: exercise.id,
        element: exerciseTextElement(exercise.id, "prompt"),
        label: "la consegna",
        kind: "prompt"
      });
    }

    function speakActiveExercisePrompt() {
      speakExercisePrompt(state.activeExerciseId);
    }

    function giveExerciseHint(id) {
      const exercise = exerciseDefinitionById(id);
      activateExercise(exercise.id, { save: false });
      const hintBox = document.getElementById(`exerciseHint-${exercise.id}`);
      if (hintBox) {
        hintBox.innerHTML = `<strong>Suggerimento di Eve</strong><br>${escapeHtml(exercise.hint)}`;
        hintBox.classList.add("is-visible");
      }
      speakExerciseText(`Suggerimento. ${exercise.hint}`, {
        exerciseId: exercise.id,
        element: hintBox || exerciseTextElement(exercise.id, "prompt"),
        label: "un suggerimento",
        kind: "hint"
      });
    }

    function giveActiveExerciseHint() {
      giveExerciseHint(state.activeExerciseId);
    }

    function handleEveSuggestion() {
      if (state.currentView === "exercises") {
        giveActiveExerciseHint();
        return;
      }
      showToast("Eve ha preparato un suggerimento simulato");
    }

    function speakExerciseSolution(id) {
      const exercise = exerciseDefinitionById(id);
      const completed = normalizedExerciseCompletedIds().includes(exercise.id);
      if (!completed) {
        showToast("Concludi prima l'esercizio per sbloccare la soluzione");
        return;
      }
      activateExercise(exercise.id, { save: false });
      speakExerciseText(exercise.solutionSpeech, {
        exerciseId: exercise.id,
        element: exerciseTextElement(exercise.id, "solution"),
        label: "la soluzione corretta",
        kind: "solution"
      });
    }

    function finishExercise(id) {
      const exercise = exerciseDefinitionById(id);
      activateExercise(exercise.id, { save: false });
      const textarea = document.getElementById(`exerciseAnswer-${exercise.id}`);
      const answer = String(textarea?.value || state.exerciseDrafts?.[exercise.id] || "").trim();
      const alreadyCompleted = normalizedExerciseCompletedIds().includes(exercise.id);

      if (!alreadyCompleted && answer.length < exercise.minimumChars) {
        textarea?.focus();
        const missing = Math.max(0, exercise.minimumChars - answer.length);
        audioLessonStatus.textContent = `La risposta è ancora troppo breve. Aggiungi circa ${missing} caratteri e completa tutti i punti richiesti.`;
        showToast("Completa meglio la risposta prima di vedere la soluzione");
        speakExerciseText(`Prima di concludere, completa meglio la risposta. Mancano ancora alcuni dettagli. ${exercise.hint}`, {
          exerciseId: exercise.id,
          element: textarea || exerciseTextElement(exercise.id, "prompt"),
          label: "un'indicazione di completamento",
          kind: "hint"
        });
        return;
      }

      state.exerciseDrafts = state.exerciseDrafts && typeof state.exerciseDrafts === "object" ? state.exerciseDrafts : {};
      state.exerciseDrafts[exercise.id] = answer;
      state.exerciseCompletedIds = [...new Set([...normalizedExerciseCompletedIds(), exercise.id])];
      state.exerciseSaved = state.exerciseCompletedIds.length > 0;

      const card = document.querySelector(`[data-exercise-id="${exercise.id}"]`);
      card?.classList.add("is-complete");
      const status = document.getElementById(`exerciseStatus-${exercise.id}`);
      if (status) status.textContent = "Completato";
      const solution = document.getElementById(`exerciseSolution-${exercise.id}`);
      solution?.classList.add("is-visible");
      const finishButton = card?.querySelector(".finish-exercise-button");
      if (finishButton) finishButton.lastChild.textContent = " Riascolta la soluzione";

      updateExerciseProgressUI();
      updateExerciseVoicePanel();
      updateProgress();
      saveState();
      showToast(alreadyCompleted ? "Eve rilegge la soluzione" : "Esercizio completato: soluzione sbloccata");
      window.setTimeout(() => solution?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      speakExerciseSolution(exercise.id);
    }

    function finishActiveExercise() {
      finishExercise(state.activeExerciseId);
    }

    function nextIncompleteExerciseId(afterId = state.activeExerciseId) {
      const completed = normalizedExerciseCompletedIds();
      const start = Math.max(0, exerciseDefinitions.findIndex((exercise) => exercise.id === afterId));
      for (let offset = 1; offset <= exerciseDefinitions.length; offset += 1) {
        const candidate = exerciseDefinitions[(start + offset) % exerciseDefinitions.length];
        if (!completed.includes(candidate.id)) return candidate.id;
      }
      return null;
    }

    function goToNextIncompleteExercise() {
      const nextId = nextIncompleteExerciseId();
      if (!nextId) {
        showToast("Tutti gli esercizi sono completati");
        return;
      }
      exerciseNextSuggestion?.classList.remove("is-visible");
      activateExercise(nextId, { scroll: true });
      const exercise = exerciseDefinitionById(nextId);
      audioLessonStatus.textContent = `Prossimo esercizio: ${exercise.title}. Puoi ascoltare la consegna oppure iniziare a scrivere.`;
    }

    function goToAdjacentExercise(direction) {
      const currentIndex = Math.max(0, exerciseDefinitions.findIndex((exercise) => exercise.id === state.activeExerciseId));
      const targetIndex = Math.min(exerciseDefinitions.length - 1, Math.max(0, currentIndex + direction));
      const target = exerciseDefinitions[targetIndex];
      activateExercise(target.id, { scroll: true });
    }

    function selectedTextInsideExerciseView() {
      if (state.currentView !== "exercises") return null;
      const active = document.activeElement;
      if (active?.matches?.("textarea[data-exercise-answer]")) {
        const start = active.selectionStart;
        const end = active.selectionEnd;
        if (Number.isInteger(start) && Number.isInteger(end) && end > start) {
          const text = active.value.slice(start, end).trim();
          if (text) {
            const rect = active.getBoundingClientRect();
            return {
              text,
              element: active,
              exerciseId: active.dataset.exerciseAnswer,
              rect: { left: rect.left + rect.width / 2, top: rect.top + 18, right: rect.right, bottom: rect.top + 18, width: 1, height: 1 }
            };
          }
        }
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
      const text = selection.toString().trim();
      if (!text) return null;
      const range = selection.getRangeAt(0);
      const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      if (!common || !documentContent.contains(common) || !common.closest(".exercise-card")) return null;
      const rect = range.getBoundingClientRect();
      const card = common.closest(".exercise-card");
      return {
        text,
        element: common.closest("p, li, h1, h2, h3, .exercise-prompt, .exercise-solution") || common,
        exerciseId: card?.dataset.exerciseId || state.activeExerciseId,
        rect
      };
    }

    function captureExerciseSelection() {
      window.clearTimeout(exerciseSpeechState.selectionCaptureTimer);
      exerciseSpeechState.selectionCaptureTimer = window.setTimeout(() => {
        const selected = selectedTextInsideExerciseView();
        if (!selected) {
          if (exerciseSelectionToolbar && !exerciseSelectionToolbar.matches(":hover")) {
            exerciseSelectionToolbar.classList.add("hidden");
          }
          return;
        }
        exerciseSpeechState.selectedText = selected.text.slice(0, 1800);
        exerciseSpeechState.selectedSourceElement = selected.element;
        exerciseSpeechState.activeExerciseId = selected.exerciseId;
        activateExercise(selected.exerciseId, { save: false });
        updateExerciseSelectionPreview();
        positionExerciseSelectionToolbar(selected.rect);
      }, 30);
    }

    function positionExerciseSelectionToolbar(rect) {
      if (!exerciseSelectionToolbar || !rect) return;
      const x = Math.max(92, Math.min(window.innerWidth - 92, rect.left + (rect.width || 0) / 2));
      const y = Math.max(58, Math.min(window.innerHeight - 16, rect.top));
      exerciseSelectionToolbar.style.left = `${x}px`;
      exerciseSelectionToolbar.style.top = `${y}px`;
      exerciseSelectionToolbar.classList.remove("hidden");
    }

    function updateExerciseSelectionPreview() {
      const text = exerciseSpeechState.selectedText.trim();
      if (exerciseSelectionPreview) {
        exerciseSelectionPreview.textContent = text
          ? `“${text.length > 160 ? `${text.slice(0, 157)}…` : text}”`
          : "Seleziona una frase nella consegna o nella tua risposta: Eve la leggerà senza cambiare esercizio.";
        exerciseSelectionPreview.classList.toggle("has-selection", Boolean(text));
      }
      if (exerciseReadSelectionButton) exerciseReadSelectionButton.disabled = !text;
      setExercisePlayState(exerciseSpeechState.speaking ? "pause" : "play");
    }

    function speakExerciseSelection() {
      const text = exerciseSpeechState.selectedText.trim();
      if (!text) {
        captureExerciseSelection();
        showToast("Seleziona prima il testo da far leggere a Eve");
        return;
      }
      const exerciseId = exerciseSpeechState.activeExerciseId || state.activeExerciseId;
      speakExerciseText(text, {
        exerciseId,
        element: exerciseSpeechState.selectedSourceElement || exerciseTextElement(exerciseId, "prompt"),
        label: "il testo selezionato",
        kind: "selection"
      });
      exerciseSelectionToolbar?.classList.add("hidden");
    }

    function syncExerciseVoicePreferences() {
      if (exerciseAudioRate) state.audioRate = Number(exerciseAudioRate.value || 1);
      if (exerciseAudioVoice) state.audioVoiceURI = exerciseAudioVoice.value || "";
      if (audioRate) audioRate.value = String(state.audioRate);
      if (audioVoice) audioVoice.value = state.audioVoiceURI;
      saveState();
    }

    function syncExerciseVoiceSelectors() {
      if (exerciseAudioRate) exerciseAudioRate.value = String(state.audioRate || 1);
      if (exerciseAudioVoice && audioVoice) {
        exerciseAudioVoice.innerHTML = audioVoice.innerHTML;
        exerciseAudioVoice.value = state.audioVoiceURI || "";
      }
    }


    function speechIsSupported() {
      return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    }

    function initializeFrequencyBars() {
      if (!eveFrequencyBars || eveFrequencyBars.children.length) return;
      const barCount = 25;
      for (let index = 0; index < barCount; index += 1) {
        const bar = document.createElement("span");
        const distanceFromCenter = Math.abs(index - (barCount - 1) / 2);
        const initial = Math.max(8, 24 - distanceFromCenter * 1.15);
        bar.style.setProperty("--bar-height", `${initial}%`);
        eveFrequencyBars.appendChild(bar);
      }
    }

    function classifySpeechImportance(element, text) {
      const normalized = String(text || "").toLowerCase();
      const criticalWords = [
        "fondamentale", "attenzione", "errore", "casi limite", "caso limite",
        "controesempio", "non significa", "differenza", "criterio di comprensione",
        "ricorda", "importante", "deve"
      ];
      const exampleWords = ["esempio", "applicazione", "immagina", "prova", "calcolare", "procedura"];
      const definitionWords = ["significa", "è un", "è una", "definisce", "rappresenta", "si chiama"];

      if (element.classList.contains("code-block")) {
        return { focus: "code", importance: 3, label: "Applicazione pratica", colorName: "Azzurro-violetto" };
      }
      if (element.classList.contains("callout")) {
        const critical = criticalWords.some((word) => normalized.includes(word));
        return critical
          ? { focus: "critical", importance: 4, label: "Massima attenzione", colorName: "Plasma" }
          : { focus: "key", importance: 3, label: "Concetto chiave", colorName: "Violetto" };
      }
      if (element.matches("h1")) {
        return { focus: "critical", importance: 4, label: "Tema centrale", colorName: "Plasma" };
      }
      if (element.matches("h2")) {
        return { focus: "key", importance: 3, label: "Concetto chiave", colorName: "Violetto" };
      }
      if (element.matches("h3") || exampleWords.some((word) => normalized.includes(word))) {
        return { focus: "example", importance: 2, label: "Esempio o applicazione", colorName: "Verde-ciano" };
      }
      if (criticalWords.some((word) => normalized.includes(word))) {
        return { focus: "critical", importance: 4, label: "Massima attenzione", colorName: "Plasma" };
      }
      if (definitionWords.some((word) => normalized.includes(word))) {
        return { focus: "key", importance: 3, label: "Definizione importante", colorName: "Violetto" };
      }
      return { focus: "standard", importance: 1, label: "Spiegazione", colorName: "Ciano" };
    }

    function frequencyHeightForBar(index, count, importance) {
      const center = (count - 1) / 2;
      const centerFactor = 1 - Math.abs(index - center) / Math.max(1, center);
      const minimum = 8 + importance * 5;
      const range = 18 + importance * 13;
      const random = Math.random() * range;
      const centerBoost = centerFactor * (8 + importance * 6);
      return Math.min(100, Math.round(minimum + random + centerBoost));
    }

    function renderFrequencyFrame(importance = 1, active = false) {
      if (!eveFrequencyBars) return;
      const bars = [...eveFrequencyBars.children];
      bars.forEach((bar, index) => {
        const height = active
          ? frequencyHeightForBar(index, bars.length, importance)
          : Math.max(7, 16 - Math.abs(index - (bars.length - 1) / 2) * 0.55);
        bar.style.setProperty("--bar-height", `${height}%`);
      });
    }

    function stopFrequencyAnimation(reset = false) {
      if (audioLessonState.frequencyTimer) {
        window.clearInterval(audioLessonState.frequencyTimer);
        audioLessonState.frequencyTimer = null;
      }
      if (eveAttentionVisualizer) {
        eveAttentionVisualizer.classList.remove("is-speaking", "is-paused");
        if (reset) eveAttentionVisualizer.dataset.focus = "standard";
      }
      renderFrequencyFrame(1, false);
      if (reset && eveFrequencyLevel && eveFrequencyTopic) {
        eveFrequencyLevel.textContent = "Pronta";
        eveFrequencyTopic.innerHTML = "<strong>Ciano</strong> · Eve mostrerà qui il livello di attenzione suggerito durante la lettura.";
      }
    }

    function startFrequencyAnimation(block) {
      if (!block || !eveAttentionVisualizer) return;
      initializeFrequencyBars();
      stopFrequencyAnimation(false);
      audioLessonState.activeFocus = block.focus || "standard";
      audioLessonState.activeImportance = Number(block.importance || 1);
      eveAttentionVisualizer.dataset.focus = audioLessonState.activeFocus;
      if (eveMascotAvailable) {
        eveAssistant.dataset.audioFocus = audioLessonState.activeFocus;
        setMascotSpeechContent(block);
      }
      eveAttentionVisualizer.classList.add("is-speaking");
      eveFrequencyLevel.textContent = block.importanceLabel || "Spiegazione";
      const preview = block.text.length > 116 ? `${block.text.slice(0, 113)}…` : block.text;
      eveFrequencyTopic.innerHTML = `<strong>${escapeHtml(block.colorName || "Ciano")}</strong> · ${escapeHtml(preview)}`;
      renderFrequencyFrame(audioLessonState.activeImportance, true);
      const interval = Math.max(72, 150 - audioLessonState.activeImportance * 16);
      audioLessonState.frequencyTimer = window.setInterval(() => {
        renderFrequencyFrame(audioLessonState.activeImportance, true);
      }, interval);
    }

    function pauseFrequencyAnimation() {
      if (audioLessonState.frequencyTimer) {
        window.clearInterval(audioLessonState.frequencyTimer);
        audioLessonState.frequencyTimer = null;
      }
      if (eveAttentionVisualizer) {
        eveAttentionVisualizer.classList.remove("is-speaking");
        eveAttentionVisualizer.classList.add("is-paused");
      }
      if (eveFrequencyLevel) eveFrequencyLevel.textContent = "In pausa";
    }

    function resumeFrequencyAnimation() {
      const block = audioLessonState.queue[audioLessonState.index];
      if (block) startFrequencyAnimation(block);
    }

    function voiceOptionLabel(voice) {
      const service = voice.localService ? "locale" : "online";
      return `${voice.name} · ${voice.lang || "lingua non indicata"} · ${service}`;
    }

    function appendVoiceGroup(label, voices, current) {
      if (!voices.length) return;
      const group = document.createElement("optgroup");
      group.label = label;
      voices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.voiceURI;
        option.textContent = voiceOptionLabel(voice);
        if (voice.voiceURI === current) option.selected = true;
        group.appendChild(option);
      });
      audioVoice.appendChild(group);
    }

    function populateAudioVoices(announce = false) {
      const countLabel = document.getElementById("audioVoiceCount");
      if (!speechIsSupported()) {
        audioLessonStatus.textContent = "La sintesi vocale non è disponibile in questo browser.";
        if (countLabel) countLabel.textContent = "Nessuna voce disponibile.";
        audioPlayButton.disabled = true;
        return;
      }

      const voices = window.speechSynthesis.getVoices()
        .slice()
        .sort((a, b) => {
          const aItalian = a.lang && a.lang.toLowerCase().startsWith("it") ? 0 : 1;
          const bItalian = b.lang && b.lang.toLowerCase().startsWith("it") ? 0 : 1;
          return aItalian - bItalian || String(a.lang).localeCompare(String(b.lang)) || a.name.localeCompare(b.name);
        });

      audioLessonState.voices = voices;
      const italianVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("it"));
      const compatibleVoices = voices.filter((voice) => voice.lang && /^(en|fr|es|de|pt)/i.test(voice.lang));
      const otherVoices = voices.filter((voice) => !italianVoices.includes(voice) && !compatibleVoices.includes(voice));
      const current = state.audioVoiceURI || audioVoice.value;

      audioVoice.innerHTML = '<option value="">Eve · voce italiana automatica</option>';
      appendVoiceGroup("Voci italiane", italianVoices, current);
      appendVoiceGroup("Voci internazionali principali", compatibleVoices, current);
      appendVoiceGroup("Altre voci installate", otherVoices, current);

      if (current && voices.some((voice) => voice.voiceURI === current)) {
        audioVoice.value = current;
      } else {
        audioVoice.value = "";
      }

      if (countLabel) {
        countLabel.textContent = `${italianVoices.length} italiane · ${voices.length} totali disponibili nel browser`;
      }
      audioPlayButton.disabled = false;
      syncExerciseVoiceSelectors();
      if (announce) {
        audioLessonStatus.textContent = voices.length
          ? `Eve ha trovato ${voices.length} voci disponibili.`
          : "Il browser non ha ancora restituito le voci. Riprova tra qualche secondo.";
      }
    }

    function reloadAudioVoices() {
      if (!speechIsSupported()) {
        showToast("Sintesi vocale non disponibile in questo browser");
        return;
      }
      audioLessonStatus.textContent = "Eve sta cercando le voci installate e online…";
      populateAudioVoices(false);
      window.setTimeout(() => populateAudioVoices(false), 250);
      window.setTimeout(() => populateAudioVoices(true), 900);
    }

    function previewSelectedVoice() {
      if (!speechIsSupported()) {
        showToast("Sintesi vocale non disponibile in questo browser");
        return;
      }
      if (audioLessonState.speaking) stopAudioLesson(false);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Ciao, sono Eve. Questa è la voce che userò per accompagnarti e spiegarti la lezione."
      );
      const voice = selectedSpeechVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || "it-IT";
      } else {
        utterance.lang = "it-IT";
      }
      utterance.rate = Number(audioRate.value || 1);
      utterance.onstart = () => {
        audioLessonStatus.textContent = "Eve sta riproducendo l’anteprima della voce selezionata.";
        startFrequencyAnimation({
          text: "Anteprima della voce selezionata.",
          focus: "standard",
          importance: 1,
          importanceLabel: "Anteprima voce",
          colorName: "Ciano"
        });
      };
      utterance.onend = () => {
        audioLessonStatus.textContent = "Voce pronta. Eve può iniziare l’audio-lezione.";
        stopFrequencyAnimation(true);
      };
      utterance.onerror = () => {
        audioLessonStatus.textContent = "Il browser non è riuscito a riprodurre questa voce.";
        stopFrequencyAnimation(true);
      };
      window.speechSynthesis.speak(utterance);
    }

    function normalizeSpeechText(value) {
      return String(value)
        .replace(/\s+/g, " ")
        .replace(/→/g, " porta a ")
        .replace(/·/g, ", ")
        .trim();
    }

    function explainCodeForAudio(code) {
      const lines = String(code).split(/\n+/).map((line) => line.trim()).filter(Boolean);
      const explained = lines.map((line) => {
        const printMatch = line.match(/^print\((.+)\)$/i);
        if (printMatch) {
          return `Infine, il programma mostra il valore di ${printMatch[1].replaceAll("_", " ")}.`;
        }
        const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
        if (assignment) {
          const name = assignment[1].replaceAll("_", " ");
          const expression = assignment[2]
            .replaceAll("*", " moltiplicato per ")
            .replaceAll("/", " diviso ")
            .replaceAll("-", " meno ")
            .replaceAll("+", " più ")
            .replaceAll("_", " ");
          return `La variabile ${name} assume il valore o il risultato di: ${expression}.`;
        }
        return `Il codice esegue questa istruzione: ${line}.`;
      });
      return explained.join(" ");
    }

    function createSpeechBlocks(sectionIndex) {
      const container = document.createElement("div");
      container.innerHTML = lessonSections[sectionIndex].html;
      const elements = [...container.querySelectorAll("h1, h2, h3, p, li, .callout, .code-block")];
      const mode = audioMode.value;

      return elements.map((element, blockIndex) => {
        let text = normalizeSpeechText(element.textContent || "");
        if (element.classList.contains("code-block")) {
          text = mode === "lesson"
            ? explainCodeForAudio(element.textContent || "")
            : `Codice. ${text}`;
        } else if (mode === "lesson") {
          if (element.matches("h1")) text = `Iniziamo questa parte della lezione: ${text}.`;
          if (element.matches("h2")) text = `Ora approfondiamo: ${text}.`;
          if (element.matches("h3")) text = `Vediamo un esempio: ${text}.`;
          if (element.classList.contains("callout")) text = `Concetto importante. ${text}`;
        }
        const attention = classifySpeechImportance(element, text);
        return {
          text,
          sectionIndex,
          blockIndex,
          focus: attention.focus,
          importance: attention.importance,
          importanceLabel: attention.label,
          colorName: attention.colorName
        };
      }).filter((item) => item.text.length > 1);
    }

    function buildAudioQueue(scope = audioScope.value, originSection = state.currentSection) {
      let sectionIndexes;
      if (scope === "lesson") {
        sectionIndexes = lessonSections.map((_, index) => index);
      } else if (scope === "custom") {
        sectionIndexes = normalizedAudioSelectedSections();
      } else {
        sectionIndexes = [Math.min(lessonSections.length - 1, Math.max(0, originSection))];
      }

      audioLessonState.selectedSections = [...sectionIndexes];
      return sectionIndexes.flatMap((sectionIndex) => createSpeechBlocks(sectionIndex));
    }

    function clearAudioHighlight(resetMascot = true) {
      documentContent.querySelectorAll(".audio-reading").forEach((element) => {
        element.classList.remove("audio-reading");
        element.removeAttribute("data-audio-focus");
      });
      if (resetMascot) resetReadingMascot();
    }

    function highlightAudioBlock(block) {
      clearAudioHighlight(false);
      const elements = [...documentContent.querySelectorAll("h1, h2, h3, p, li, .callout, .code-block")];
      const element = elements[block.blockIndex];
      if (!element) return;
      element.dataset.audioFocus = block.focus || "standard";
      element.classList.add("audio-reading");
      positionEveBesideReading(element, block);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(refreshReadingMascotPosition, 340);
    }

    function setVisibleAudioSection(sectionIndex) {
      if (state.currentSection === sectionIndex && state.currentView === "lesson") return;
      state.currentSection = sectionIndex;
      state.currentView = "lesson";
      document.querySelectorAll(".content-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.view === "lesson");
      });
      renderLessonSection(true);
    }

    function selectedSpeechVoice() {
      const uri = audioVoice.value;
      if (uri) return audioLessonState.voices.find((voice) => voice.voiceURI === uri) || null;
      return audioLessonState.voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("it")) || null;
    }

    function updateAudioProgress() {
      const total = audioLessonState.queue.length;
      const current = total ? Math.min(total, audioLessonState.index + (audioLessonState.speaking ? 1 : 0)) : 0;
      const value = total ? Math.round((current / total) * 100) : 0;
      audioLessonProgress.style.width = `${value}%`;
    }

    function speakCurrentAudioBlock() {
      if (!speechIsSupported()) return;
      const block = audioLessonState.queue[audioLessonState.index];
      if (!block) {
        audioLessonState.speaking = false;
        audioLessonState.paused = false;
        setAudioPlayButtonState("play");
        const completionMessages = {
          lesson: "Lezione completa terminata: tutte le pagine sono state lette.",
          custom: "Lettura delle pagine scelte terminata: Eve ha completato tutta la sequenza selezionata.",
          section: "Pagina corrente terminata: la riproduzione si è fermata alla fine della pagina."
        };
        audioLessonStatus.textContent = completionMessages[audioLessonState.scope] || completionMessages.section;
        audioLessonProgress.style.width = "100%";
        clearAudioHighlight();
        stopFrequencyAnimation(false);
        if (eveMascotAvailable) eveAssistant.classList.remove("eve-speaking");
        setEveContext(state.currentView);
        eveAttentionVisualizer.dataset.focus = "key";
        eveFrequencyLevel.textContent = "Completata";
        const completionTopics = {
          lesson: "<strong>Violetto</strong> · Lezione completa terminata. Ora prova a riepilogare i concetti principali.",
          custom: "<strong>Violetto</strong> · Sequenza selezionata completata. Eve ha cambiato pagina automaticamente fino all’ultima scelta.",
          section: "<strong>Violetto</strong> · Pagina corrente terminata. La lettura non proseguirà alla pagina successiva."
        };
        eveFrequencyTopic.innerHTML = completionTopics[audioLessonState.scope] || completionTopics.section;
        return;
      }

      setVisibleAudioSection(block.sectionIndex);
      highlightAudioBlock(block);

      const utterance = new SpeechSynthesisUtterance(block.text);
      utterance.lang = "it-IT";
      utterance.rate = Number(audioRate.value || 1);
      utterance.pitch = 1;
      const voice = selectedSpeechVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        audioLessonState.speaking = true;
        audioLessonState.paused = false;
        setAudioPlayButtonState("pause");
        const customPosition = audioLessonState.selectedSections.indexOf(block.sectionIndex);
        const pageLabel = audioLessonState.scope === "lesson"
          ? `pagina ${block.sectionIndex + 1} di ${lessonSections.length}`
          : audioLessonState.scope === "custom"
            ? `pagina ${block.sectionIndex + 1} · selezione ${customPosition + 1} di ${audioLessonState.selectedSections.length}`
            : `pagina ${audioLessonState.startSection + 1}`;
        audioLessonStatus.textContent = `In ascolto · ${pageLabel} · passaggio ${audioLessonState.index + 1} di ${audioLessonState.queue.length}`;
        if (eveMascotAvailable) {
          eveAssistant.classList.add("eve-speaking");
          eveAssistant.classList.remove("eve-paused");
          positionEveBesideReading(audioLessonState.activeElement, block);
        }
        resumeFrequencyAnimation();
        startFrequencyAnimation(block);
        updateAudioProgress();
      };

      utterance.onend = () => {
        if (!audioLessonState.speaking) return;
        const completedBlock = audioLessonState.queue[audioLessonState.index];
        const nextBlock = audioLessonState.queue[audioLessonState.index + 1];
        audioLessonState.index += 1;
        updateAudioProgress();

        if (
          audioLessonState.scope !== "section" &&
          completedBlock &&
          nextBlock &&
          completedBlock.sectionIndex !== nextBlock.sectionIndex
        ) {
          const destinationPosition = audioLessonState.selectedSections.indexOf(nextBlock.sectionIndex);
          audioLessonStatus.textContent = audioLessonState.scope === "custom"
            ? `Passaggio automatico alla pagina ${nextBlock.sectionIndex + 1} · selezione ${destinationPosition + 1} di ${audioLessonState.selectedSections.length}…`
            : `Passaggio automatico alla pagina ${nextBlock.sectionIndex + 1} di ${lessonSections.length}…`;
        }

        /* Nessuna pausa manuale tra le pagine: la coda continua da sola. */
        speakCurrentAudioBlock();
      };

      utterance.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") return;
        audioLessonState.speaking = false;
        setAudioPlayButtonState("play");
        audioLessonStatus.textContent = "La lettura è stata interrotta dal browser.";
        clearAudioHighlight();
        stopFrequencyAnimation(true);
        if (eveMascotAvailable) eveAssistant.classList.remove("eve-speaking");
        setEveContext(state.currentView);
      };

      audioLessonState.utterance = utterance;
      window.speechSynthesis.speak(utterance);
    }

    function startAudioLesson() {
      if (!speechIsSupported()) {
        showToast("Sintesi vocale non disponibile in questo browser");
        return;
      }
      if (state.currentView !== "lesson") activateLessonTab();
      window.speechSynthesis.cancel();
      audioLessonState.scope = audioScope.value;
      const customSections = normalizedAudioSelectedSections();
      if (audioLessonState.scope === "custom" && !customSections.length) {
        renderAudioPageSelection();
        audioLessonStatus.textContent = "Seleziona almeno una pagina da far leggere a Eve.";
        showToast("Seleziona almeno una pagina");
        return;
      }
      audioLessonState.startSection = audioLessonState.scope === "lesson"
        ? 0
        : audioLessonState.scope === "custom"
          ? customSections[0]
          : state.currentSection;
      audioLessonState.queue = buildAudioQueue(
        audioLessonState.scope,
        audioLessonState.startSection
      );
      audioLessonState.index = 0;
      audioLessonState.speaking = true;
      audioLessonState.paused = false;
      audioLessonProgress.style.width = "0%";
      if (!audioLessonState.queue.length) {
        audioLessonState.speaking = false;
        setAudioPlayButtonState("play");
        showToast("Nessun testo disponibile per la lettura");
        return;
      }
      setEveContext("audio");
      if (eveMascotAvailable) eveAssistant.classList.add("eve-speaking");
      speakCurrentAudioBlock();
    }

    function toggleAudioLesson() {
      if (!audioLessonState.speaking) {
        startAudioLesson();
        return;
      }
      if (audioLessonState.paused) {
        window.speechSynthesis.resume();
        audioLessonState.paused = false;
        setAudioPlayButtonState("pause");
        const block = audioLessonState.queue[audioLessonState.index];
        const activeSection = block?.sectionIndex ?? audioLessonState.startSection;
        const customPosition = audioLessonState.selectedSections.indexOf(activeSection);
        const pageLabel = audioLessonState.scope === "lesson"
          ? `pagina ${activeSection + 1} di ${lessonSections.length}`
          : audioLessonState.scope === "custom"
            ? `pagina ${activeSection + 1} · selezione ${customPosition + 1} di ${audioLessonState.selectedSections.length}`
            : `pagina ${audioLessonState.startSection + 1}`;
        audioLessonStatus.textContent = `In ascolto · ${pageLabel} · passaggio ${audioLessonState.index + 1} di ${audioLessonState.queue.length}`;
        if (eveMascotAvailable) eveAssistant.classList.remove("eve-paused");
        resumeFrequencyAnimation();
      } else {
        window.speechSynthesis.pause();
        audioLessonState.paused = true;
        setAudioPlayButtonState("play");
        audioLessonStatus.textContent = "Eve ha messo in pausa l’audio-lezione.";
        if (eveMascotAvailable) eveAssistant.classList.add("eve-paused");
        pauseFrequencyAnimation();
      }
    }

    function stopAudioLesson(updateStatus = true) {
      if (speechIsSupported()) window.speechSynthesis.cancel();
      audioLessonState.speaking = false;
      audioLessonState.paused = false;
      audioLessonState.queue = [];
      audioLessonState.index = 0;
      audioLessonState.utterance = null;
      clearAudioHighlight();
      setAudioPlayButtonState("play");
      audioLessonProgress.style.width = "0%";
      stopFrequencyAnimation(true);
      if (eveMascotAvailable) eveAssistant.classList.remove("eve-speaking");
      setEveContext(state.currentView);
      if (updateStatus) audioLessonStatus.textContent = "Eve ha interrotto l’audio-lezione.";
    }

    function skipAudioBlock(direction) {
      if (!audioLessonState.queue.length) {
        startAudioLesson();
        return;
      }
      if (speechIsSupported()) window.speechSynthesis.cancel();
      audioLessonState.index = Math.min(
        audioLessonState.queue.length - 1,
        Math.max(0, audioLessonState.index + direction)
      );
      audioLessonState.speaking = true;
      audioLessonState.paused = false;
      speakCurrentAudioBlock();
    }

    function syncAudioPreferences() {
      const previousScope = audioLessonState.scope || state.audioScope || "section";
      const nextScope = audioScope.value;
      const currentBlock = audioLessonState.queue[audioLessonState.index] || null;

      state.audioRate = Number(audioRate.value || 1);
      state.audioVoiceURI = audioVoice.value;
      state.audioMode = audioMode.value;
      state.audioScope = nextScope;
      updateAudioScopeNote();
      saveState();

      if (audioLessonState.speaking) {
        window.speechSynthesis.cancel();
        audioLessonState.scope = nextScope;
        const customSections = normalizedAudioSelectedSections();
        audioLessonState.startSection = nextScope === "lesson"
          ? 0
          : nextScope === "custom"
            ? (customSections[0] ?? state.currentSection)
            : state.currentSection;
        audioLessonState.queue = buildAudioQueue(nextScope, audioLessonState.startSection);

        if (previousScope === nextScope && currentBlock) {
          const matchingIndex = audioLessonState.queue.findIndex((block) =>
            block.sectionIndex === currentBlock.sectionIndex &&
            block.blockIndex === currentBlock.blockIndex
          );
          audioLessonState.index = matchingIndex >= 0 ? matchingIndex : 0;
        } else {
          /* Cambiando ambito, la nuova modalità riparte in modo prevedibile. */
          audioLessonState.index = 0;
        }

        audioLessonState.speaking = true;
        audioLessonState.paused = false;
        speakCurrentAudioBlock();
      }
    }

    function renderLessonSection(preserveAudio = false) {
      if (!preserveAudio && audioLessonState.speaking) stopAudioLesson(false);
      setEveContext(audioLessonState.speaking ? "audio" : "lesson");
      const section = lessonSections[state.currentSection];
      documentContent.innerHTML = section.html;
      documentContent.scrollTop = 0;
      document.querySelector(".page-scroll").scrollTo({ top: 0, behavior: "smooth" });
      document.getElementById("eveSuggestion").textContent =
        `Continua da “${section.title}” e segnala la sezione come compresa quando riesci a spiegarla con parole tue.`;
      syncComprehensionButton();
      saveState();
    }

    function switchView(view, button) {
      if (view !== "lesson" && audioLessonState.speaking) stopAudioLesson(false);
      if (view !== "exercises" && exerciseSpeechState.speaking) stopExerciseSpeech(false);
      state.currentView = view;
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");

      if (view === "lesson") {
        renderLessonSection();
        updateEveVoiceActivity("lesson");
      } else if (view === "exercises") {
        renderExercisesView();
        document.querySelector(".page-scroll").scrollTo({ top: 0, behavior: "smooth" });
        setEveContext("exercises");
        document.getElementById("eveSuggestion").textContent =
          "Seleziona una frase da ascoltare, completa la risposta e usa Concludi per confrontarla con la soluzione corretta letta da Eve.";
      } else {
        documentContent.innerHTML = viewTemplates[view];
        document.querySelector(".page-scroll").scrollTo({ top: 0, behavior: "smooth" });
        setEveContext(view);
        updateEveVoiceActivity("lesson");
      }

      exerciseSelectionToolbar?.classList.add("hidden");
      autosave();
    }

    function nextSection() {
      if (state.currentView !== "lesson") {
        activateLessonTab();
        return;
      }
      state.currentSection = Math.min(lessonSections.length - 1, state.currentSection + 1);
      renderLessonSection();
    }

    function previousSection() {
      if (state.currentView !== "lesson") {
        activateLessonTab();
        return;
      }
      state.currentSection = Math.max(0, state.currentSection - 1);
      renderLessonSection();
    }

    function activateLessonTab() {
      const lessonTab = document.querySelector('[data-view="lesson"]');
      switchView("lesson", lessonTab);
    }

    function syncComprehensionButton() {
      const button = document.getElementById("comprehensionButton");
      const label = document.getElementById("comprehensionLabel");
      const hint = document.getElementById("comprehensionHint");
      if (!button || !label || !hint) return;
      const completed = state.completedSections.has(state.currentSection);
      button.classList.toggle("is-complete", completed);
      button.setAttribute("aria-pressed", String(completed));
      label.textContent = completed ? "Contenuto compreso" : "Ho compreso questo contenuto";
      hint.textContent = completed
        ? "Obiettivo registrato · puoi continuare con la pagina successiva"
        : "Conferma quando riesci a spiegarlo con parole tue";
    }

    function completeCurrentSection() {
      const alreadyCompleted = state.completedSections.has(state.currentSection);
      state.completedSections.add(state.currentSection);
      syncComprehensionButton();
      updateProgress();
      autosave();
      showToast(alreadyCompleted
        ? `La pagina ${state.currentSection + 1} risulta già compresa`
        : `Pagina ${state.currentSection + 1} segnata come compresa`);
    }

    function applyProgressMissionsState() {
      const dashboard = document.getElementById("progressDashboard");
      const toggle = document.getElementById("progressMissionsToggle");
      if (!dashboard || !toggle) return;
      const expanded = Boolean(state.progressMissionsExpanded);
      dashboard.classList.toggle("missions-expanded", expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
      const label = expanded ? "Nascondi missioni" : "Mostra missioni";
      toggle.title = label;
      toggle.setAttribute("aria-label", label);
    }

    function applyModulesPanelState() {
      const sidebar = document.getElementById("lessonSidebar");
      const toggle = document.getElementById("modulesPanelToggle");
      const layout = document.querySelector(".learning-layout");
      if (!sidebar || !toggle || !layout) return;

      const collapsed = Boolean(state.modulesPanelCollapsed);
      sidebar.classList.toggle("is-collapsed", collapsed);
      layout.classList.toggle("modules-panel-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      const label = collapsed ? "Espandi Moduli e lezioni" : "Riduci Moduli e lezioni";
      toggle.title = label;
      toggle.setAttribute("aria-label", label);
    }

    function toggleModulesPanel() {
      state.modulesPanelCollapsed = !state.modulesPanelCollapsed;
      applyModulesPanelState();
      saveState();
      showToast(state.modulesPanelCollapsed ? "Moduli e lezioni ridotti" : "Moduli e lezioni aperti");
    }

    function toggleProgressMissions() {
      state.progressMissionsExpanded = !state.progressMissionsExpanded;
      applyProgressMissionsState();
      saveState();
      showToast(state.progressMissionsExpanded ? "Missioni mostrate" : "Missioni nascoste");
    }

    function getProgress() {
      const validCompletedSections = [...state.completedSections].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < lessonSections.length
      ).length;
      const sectionWeight = (validCompletedSections / lessonSections.length) * 70;
      const activities =
        (state.exerciseSaved ? 10 : 0) +
        (state.quizCorrect ? 10 : 0) +
        (state.projectSubmitted ? 10 : 0);
      return Math.min(100, Math.round(sectionWeight + activities));
    }

    function getProgressDetails() {
      const completedSectionIndexes = new Set(
        [...state.completedSections].filter(
          (index) => Number.isInteger(index) && index >= 0 && index < lessonSections.length
        )
      );
      const sectionsCompleted = completedSectionIndexes.size;
      const totalSections = lessonSections.length;
      const activityObjectives = [
        Boolean(state.exerciseSaved),
        Boolean(state.quizCorrect),
        Boolean(state.projectSubmitted)
      ];
      const completedObjectives = sectionsCompleted + activityObjectives.filter(Boolean).length;
      const totalObjectives = totalSections + activityObjectives.length;
      const firstIncompleteSection = lessonSections.findIndex(
        (_, index) => !completedSectionIndexes.has(index)
      );

      let nextGoal = "Tutti gli obiettivi della lezione sono stati raggiunti.";
      let nextGoalType = "complete";

      if (firstIncompleteSection >= 0) {
        nextGoalType = "reading";
        nextGoal = `Comprendi la sezione ${firstIncompleteSection + 1}: ${lessonSections[firstIncompleteSection].title}`;
      } else if (!state.exerciseSaved) {
        nextGoalType = "exercise";
        nextGoal = "Completa e salva l'esercizio della lezione.";
      } else if (!state.quizCorrect) {
        nextGoalType = "quiz";
        nextGoal = "Supera il quiz rispondendo correttamente alla domanda.";
      } else if (!state.projectSubmitted) {
        nextGoalType = "project";
        nextGoal = "Consegna il Python Project con una descrizione completa.";
      }

      return {
        value: getProgress(),
        sectionsCompleted,
        totalSections,
        readingPercent: Math.round((sectionsCompleted / totalSections) * 100),
        completedObjectives,
        totalObjectives,
        firstIncompleteSection,
        nextGoal,
        nextGoalType,
        exerciseComplete: Boolean(state.exerciseSaved),
        quizComplete: Boolean(state.quizCorrect),
        projectComplete: Boolean(state.projectSubmitted)
      };
    }

    function setProgressGoalState(element, statusElement, complete, statusText) {
      if (element) element.classList.toggle("is-complete", complete);
      if (statusElement) statusElement.textContent = statusText;
    }

    function updateProgress() {
      const details = getProgressDetails();

      progressBar.style.width = `${details.value}%`;
      progressPercent.textContent = `${details.value}%`;
      if (progressTrackDetailed) {
        progressTrackDetailed.setAttribute("aria-valuenow", String(details.value));
        progressTrackDetailed.setAttribute(
          "aria-valuetext",
          `${details.value}%: ${details.completedObjectives} obiettivi su ${details.totalObjectives}`
        );
      }
      if (progressObjectiveCount) {
        progressObjectiveCount.textContent = `${details.completedObjectives} di ${details.totalObjectives} obiettivi raggiunti`;
      }
      if (progressReadingBar) progressReadingBar.style.width = `${details.readingPercent}%`;
      setProgressGoalState(
        progressGoalReading,
        progressReadingStatus,
        details.sectionsCompleted === details.totalSections,
        `${details.sectionsCompleted}/${details.totalSections}`
      );
      setProgressGoalState(
        progressGoalExercise,
        progressExerciseStatus,
        details.exerciseComplete,
        details.exerciseComplete ? "Fatto" : "Da fare"
      );
      setProgressGoalState(
        progressGoalQuiz,
        progressQuizStatus,
        details.quizComplete,
        details.quizComplete ? "Superato" : "Da fare"
      );
      setProgressGoalState(
        progressGoalProject,
        progressProjectStatus,
        details.projectComplete,
        details.projectComplete ? "Consegnato" : "Da fare"
      );
      if (progressNextGoal) progressNextGoal.textContent = details.nextGoal;

      const summaryProgress = document.getElementById("summaryProgress");
      if (summaryProgress) summaryProgress.textContent = details.value;

      const firstLessonStatus = document.querySelector(".lesson-item .lesson-status");
      if (firstLessonStatus) {
        firstLessonStatus.textContent = `${details.sectionsCompleted}/${details.totalSections} sezioni comprese`;
      }
    }

    function goToProgressGoal(goal) {
      const tabMap = {
        exercise: "exercises",
        quiz: "quiz",
        project: "project"
      };

      if (goal === "reading") {
        const details = getProgressDetails();
        const targetSection = details.firstIncompleteSection >= 0
          ? details.firstIncompleteSection
          : Math.max(0, lessonSections.length - 1);
        state.currentSection = targetSection;
        const lessonTab = document.querySelector('[data-view="lesson"]');
        switchView("lesson", lessonTab);
        renderLessonSection();
        showToast(
          details.firstIncompleteSection >= 0
            ? `Aperta la sezione ${targetSection + 1} da comprendere`
            : "Tutte le sezioni sono già comprese"
        );
      } else {
        const view = tabMap[goal];
        const tab = document.querySelector(`[data-view="${view}"]`);
        if (view && tab) switchView(view, tab);
      }

      window.setTimeout(() => {
        const target = document.querySelector(".reader-area");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40);
    }

    function buildProgressDrawerHtml() {
      const details = getProgressDetails();
      const objectiveRows = [
        {
          label: "Sezioni comprese",
          value: `${details.sectionsCompleted}/${details.totalSections}`,
          done: details.sectionsCompleted === details.totalSections,
          goal: "reading"
        },
        {
          label: "Esercizio salvato",
          value: details.exerciseComplete ? "Completato" : "Da completare",
          done: details.exerciseComplete,
          goal: "exercise"
        },
        {
          label: "Quiz superato",
          value: details.quizComplete ? "Superato" : "Da superare",
          done: details.quizComplete,
          goal: "quiz"
        },
        {
          label: "Progetto consegnato",
          value: details.projectComplete ? "Consegnato" : "Da consegnare",
          done: details.projectComplete,
          goal: "project"
        }
      ];

      return `
        <div class="drawer-section">
          <h3>Avanzamento reale · Lezione 0.1</h3>
          <div class="progress-track progress-detailed" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${details.value}">
            <span style="width:${details.value}%"></span>
          </div>
          <div class="drawer-progress-summary">
            <div class="drawer-progress-metric">
              <strong>${details.value}%</strong>
              <span>Completamento pesato</span>
            </div>
            <div class="drawer-progress-metric">
              <strong>${details.completedObjectives}/${details.totalObjectives}</strong>
              <span>Obiettivi raggiunti</span>
            </div>
          </div>
          <div class="progress-next-goal">
            <span>Prossimo obiettivo</span>
            <strong>${escapeHtml(details.nextGoal)}</strong>
          </div>
        </div>
        <div class="drawer-section">
          <h3>Obiettivi della lezione</h3>
          <div class="progress-objectives">
            ${objectiveRows.map((item) => `
              <button class="progress-objective ${item.done ? "is-complete" : ""}" type="button" onclick="closeDrawer(); goToProgressGoal('${item.goal}')">
                <span class="progress-goal-icon">${item.done ? "✓" : "○"}</span>
                <span class="progress-goal-copy">
                  <strong>${item.label}</strong>
                  <small>${item.value}</small>
                </span>
                <span class="progress-goal-status">${item.done ? "Fatto" : "Apri"}</span>
              </button>
            `).join("")}
          </div>
          <p class="progress-weight-note">Il completamento non è una semplice media: lettura 70%, esercizio 10%, quiz 10%, progetto 10%.</p>
        </div>
      `;
    }

    function autosave() {
      autosaveLabel.textContent = "Salvataggio...";
      window.setTimeout(() => {
        autosaveLabel.textContent = "Salvato automaticamente";
        saveState();
      }, 450);
    }

    function saveExercise() {
      finishExercise(state.activeExerciseId || exerciseDefinitions[0].id);
    }

    function selectQuiz(button, correct) {
      document.querySelectorAll(".quiz-option").forEach((option) => option.classList.remove("selected"));
      button.classList.add("selected");
      const feedback = document.getElementById("quizFeedback");
      feedback.style.display = "block";
      if (correct) {
        state.quizCorrect = true;
        feedback.innerHTML = "<strong>Risposta corretta</strong> L'algoritmo descrive la logica; il programma la implementa.";
      } else {
        feedback.innerHTML = "<strong>Da ripassare</strong> Rileggi la sezione dedicata ad algoritmi e programmi.";
      }
      updateProgress();
      autosave();
    }

    function submitProject() {
      const text = document.getElementById("projectText");
      if (!text || text.value.trim().length < 20) {
        showToast("Aggiungi una descrizione più completa");
        return;
      }
      state.projectSubmitted = true;
      updateProgress();
      autosave();
      showToast("Progetto consegnato nella demo");
    }

    function selectLesson(id, button) {
      document.querySelectorAll(".lesson-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      if (id === "0.1") {
        setEveContext("lesson");
        document.getElementById("selectedMaterialTitle").textContent = "Che cosa significa programmare?";
        document.getElementById("courseLessonTitle").textContent = "Che cosa significa programmare?";
        state.currentSection = 0;
        activateLessonTab();
      } else {
        setEveContext("lesson");
        const lessonTitle = button.querySelector("strong").textContent;
        document.getElementById("selectedMaterialTitle").textContent = lessonTitle;
        document.getElementById("courseLessonTitle").textContent = lessonTitle;
        documentContent.innerHTML = `
          <div class="document-section-label">${button.querySelector(".lesson-number").textContent}</div>
          <h1>${lessonTitle}</h1>
          <div class="callout">
            <strong>Stato editoriale</strong>
            Questa lezione è rappresentata come bozza nella demo e non viene mostrata come completa.
          </div>
        `;
      }
      autosave();
    }

    function openModal(type) {
      const template = modalTemplates[type];
      document.getElementById("modalTitle").textContent = template.title;
      document.getElementById("modalContent").innerHTML = template.html;
      document.getElementById("modalBackdrop").classList.remove("hidden");
      if (type === "impostazioni") syncGraphicsSettingsControls();
      updateProgress();
    }

    function closeModal() {
      document.getElementById("modalBackdrop").classList.add("hidden");
    }

    function closeModalFromBackdrop(event) {
      if (event.target.id === "modalBackdrop") closeModal();
    }

    function openDrawer(type) {
      const template = drawerTemplates[type];
      document.getElementById("drawerTitle").textContent = template.title;
      document.getElementById("drawerContent").innerHTML =
        type === "progressi"
          ? buildProgressDrawerHtml()
          : type === "materiali"
            ? buildMaterialsDrawerHtml()
            : template.html;
      document.getElementById("drawerBackdrop").classList.remove("hidden");
      setEveContext(type);
    }

    function closeDrawer() {
      document.getElementById("drawerBackdrop").classList.add("hidden");
      setEveContext(audioLessonState.speaking ? "audio" : state.currentView);
    }

    function closeDrawerFromBackdrop(event) {
      if (event.target.id === "drawerBackdrop") closeDrawer();
    }

    function saveNotes() {
      const field = document.getElementById("privateNotes");
      state.notes = field ? field.value : "";
      saveState();
      showToast("Appunti privati salvati");
    }

    function toggleFloating(id) {
      const panel = document.getElementById(id);
      if (!panel) return;
      const opening = panel.classList.contains("hidden");
      panel.classList.toggle("hidden");
      if (id === "chatPanel" && opening) {
        if (state.chat && Array.isArray(state.chat.minimizedConversationIds)) {
          const activeIsMinimized = state.chat.minimizedConversationIds.includes(state.chat.activeConversationId);
          if (activeIsMinimized) {
            const nextConversation = state.chat.conversations.find(
              (conversation) => !state.chat.minimizedConversationIds.includes(conversation.id)
            );
            if (nextConversation) state.chat.activeConversationId = nextConversation.id;
          }
        }
        renderChatCenter();
        if (window.innerWidth <= 760) panel.classList.remove("mobile-conversation-open");
        saveState();
      }
    }

    function toggleTimer() {
      state.timerRunning = !state.timerRunning;
      document.getElementById("timerToggle").textContent = state.timerRunning ? "Pausa" : "Avvia";
      saveState();
    }

    function resetTimer() {
      state.timerSeconds = 0;
      updateTimerDisplay();
      saveState();
    }

    function switchTimerMode() {
      state.timerPomodoro = !state.timerPomodoro;
      document.getElementById("timerMode").textContent = state.timerPomodoro ? "Modalità Pomodoro" : "Modalità libera";
      showToast(state.timerPomodoro ? "Modalità Pomodoro attivata" : "Modalità libera attivata");
      saveState();
    }

    function updateTimerDisplay() {
      const hours = String(Math.floor(state.timerSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((state.timerSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(state.timerSeconds % 60).padStart(2, "0");
      document.getElementById("timerDisplay").textContent = `${hours}:${minutes}:${seconds}`;
    }

    setInterval(() => {
      if (!state.timerRunning) return;
      state.timerSeconds += 1;
      updateTimerDisplay();
      if (state.timerSeconds % 15 === 0) saveState();
    }, 1000);

    const chatParticipants = [
      { id: "tatiana", name: "Tatiana", initials: "TA", online: true, status: "Online ora" },
      { id: "marco", name: "Marco", initials: "MA", online: true, status: "In sessione focus" },
      { id: "sofia", name: "Sofia", initials: "SO", online: false, status: "Ultimo accesso 18:42" },
      { id: "davide", name: "Davide", initials: "DA", online: false, status: "Ultimo accesso ieri" }
    ];

    const chatUiState = {
      filter: "all",
      search: "",
      createOpen: false,
      infoOpen: false
    };

    function chatNow(offsetMinutes = 0) {
      return Date.now() + offsetMinutes * 60000;
    }

    function createDefaultChatState() {
      const now = Date.now();
      return {
        activeConversationId: "lobby",
        minimizedConversationIds: [],
        conversations: [
          {
            id: "lobby",
            type: "lobby",
            title: "Lobby generale",
            avatar: "LO",
            pinned: true,
            locked: true,
            members: ["tu", "tatiana", "marco", "sofia", "davide"],
            unread: 2,
            messages: [
              { id: "l1", sender: "tatiana", senderName: "Tatiana", text: "Io sto ripassando le funzioni. Chi vuole fare insieme il quiz più tardi?", timestamp: now - 44 * 60000 },
              { id: "l2", sender: "marco", senderName: "Marco", text: "Ci sono. Prima finisco la sezione sugli algoritmi.", timestamp: now - 39 * 60000 },
              { id: "l3", sender: "system", senderName: "Sistema", text: "Sofia è entrata nella Lobby generale.", timestamp: now - 31 * 60000, system: true },
              { id: "l4", sender: "sofia", senderName: "Sofia", text: "Perfetto, io preparo due domande di ripasso.", timestamp: now - 24 * 60000 }
            ]
          },
          {
            id: "private-tatiana",
            type: "private",
            title: "Tatiana",
            avatar: "TA",
            members: ["tu", "tatiana"],
            unread: 1,
            messages: [
              { id: "t1", sender: "tatiana", senderName: "Tatiana", text: "Hai già completato l’esercizio della prima lezione?", timestamp: now - 18 * 60000 }
            ]
          },
          {
            id: "private-marco",
            type: "private",
            title: "Marco",
            avatar: "MA",
            members: ["tu", "marco"],
            unread: 0,
            messages: [
              { id: "m1", sender: "me", senderName: "Tu", text: "Quando finisci possiamo confrontare gli appunti.", timestamp: now - 85 * 60000, status: "read" },
              { id: "m2", sender: "marco", senderName: "Marco", text: "Va bene, ti scrivo appena termino.", timestamp: now - 78 * 60000 }
            ]
          },
          {
            id: "group-project",
            type: "group",
            title: "Progetto finale",
            avatar: "PF",
            members: ["tu", "tatiana", "marco", "sofia"],
            unread: 0,
            messages: [
              { id: "p1", sender: "system", senderName: "Sistema", text: "Hai creato il gruppo Progetto finale.", timestamp: now - 2 * 86400000, system: true },
              { id: "p2", sender: "me", senderName: "Tu", text: "Qui organizziamo input, elaborazione, output e casi limite.", timestamp: now - 2 * 86400000 + 18 * 60000, status: "read" },
              { id: "p3", sender: "sofia", senderName: "Sofia", text: "Io posso occuparmi dei casi limite.", timestamp: now - 2 * 86400000 + 35 * 60000 }
            ]
          }
        ]
      };
    }

    function normalizeChatState(value) {
      const fallback = createDefaultChatState();
      if (!value || !Array.isArray(value.conversations)) return fallback;
      const conversations = value.conversations
        .filter((conversation) => conversation && conversation.id && Array.isArray(conversation.messages))
        .map((conversation) => ({
          unread: 0,
          members: ["tu"],
          avatar: chatInitials(conversation.title || "Chat"),
          type: "private",
          ...conversation,
          messages: conversation.messages.map((message) => ({
            id: message.id || createChatId("message"),
            sender: message.sender || "system",
            senderName: message.senderName || "Sistema",
            text: message.text || "",
            timestamp: Number(message.timestamp || Date.now()),
            system: Boolean(message.system),
            status: message.status || "read",
            attachment: message.attachment || null
          }))
        }));

      if (!conversations.some((conversation) => conversation.id === "lobby")) {
        conversations.unshift(fallback.conversations[0]);
      }

      const activeConversationId = conversations.some((conversation) => conversation.id === value.activeConversationId)
        ? value.activeConversationId
        : "lobby";
      const validIds = new Set(conversations.map((conversation) => conversation.id));
      const minimizedConversationIds = Array.isArray(value.minimizedConversationIds)
        ? [...new Set(value.minimizedConversationIds.filter((id) => validIds.has(id)))]
        : [];

      return { activeConversationId, minimizedConversationIds, conversations };
    }

    function createChatId(prefix) {
      return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function chatInitials(value) {
      return String(value || "Chat")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase();
    }

    function getChatConversation(id = state.chat?.activeConversationId) {
      return state.chat?.conversations.find((conversation) => conversation.id === id) || null;
    }

    function getChatParticipant(id) {
      return chatParticipants.find((participant) => participant.id === id) || null;
    }

    function getConversationLastMessage(conversation) {
      return conversation?.messages?.[conversation.messages.length - 1] || null;
    }

    function formatChatTime(timestamp) {
      const date = new Date(Number(timestamp || Date.now()));
      const today = new Date();
      const sameDay = date.toDateString() === today.toDateString();
      if (sameDay) return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(date);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return "Ieri";
      return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit" }).format(date);
    }

    function formatChatDay(timestamp) {
      const date = new Date(Number(timestamp || Date.now()));
      const today = new Date();
      if (date.toDateString() === today.toDateString()) return "Oggi";
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return "Ieri";
      return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(date);
    }

    function formatFileSize(bytes) {
      const size = Number(bytes || 0);
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }

    function conversationTypeLabel(conversation) {
      if (!conversation) return "Conversazione";
      if (conversation.type === "lobby") return `${conversation.members.length} partecipanti · canale permanente`;
      if (conversation.type === "group") return `${conversation.members.length} partecipanti`;
      const otherId = conversation.members.find((member) => member !== "tu");
      return getChatParticipant(otherId)?.status || "Conversazione privata";
    }

    function conversationIsOnline(conversation) {
      if (!conversation || conversation.type !== "private") return false;
      const otherId = conversation.members.find((member) => member !== "tu");
      return Boolean(getChatParticipant(otherId)?.online);
    }

    function renderConversationButton(conversation) {
      const lastMessage = getConversationLastMessage(conversation);
      const active = state.chat.activeConversationId === conversation.id;
      const preview = lastMessage
        ? lastMessage.attachment
          ? `Allegato: ${lastMessage.attachment.name}`
          : `${lastMessage.sender === "me" ? "Tu: " : ""}${lastMessage.text}`
        : "Nessun messaggio";
      const unread = Number(conversation.unread || 0);
      return `
        <button class="chat-conversation-item ${active ? "active" : ""}" type="button" onclick="openChatConversation('${escapeHtml(conversation.id)}')">
          <span class="chat-conversation-avatar ${conversationIsOnline(conversation) ? "online" : ""}">${escapeHtml(conversation.avatar || chatInitials(conversation.title))}</span>
          <span class="chat-conversation-copy">
            <strong>${escapeHtml(conversation.title)}</strong>
            <span>${escapeHtml(preview)}</span>
          </span>
          <span class="chat-conversation-meta">
            <time>${lastMessage ? formatChatTime(lastMessage.timestamp) : ""}</time>
            ${unread ? `<span class="chat-unread-badge">${Math.min(unread, 99)}</span>` : conversation.pinned ? '<span class="chat-pin" aria-label="Fissata">◆</span>' : ""}
          </span>
        </button>
      `;
    }

    function chatMatchesSearch(conversation, query) {
      if (!query) return true;
      const haystack = [
        conversation.title,
        ...conversation.messages.slice(-20).map((message) => `${message.senderName} ${message.text} ${message.attachment?.name || ""}`)
      ].join(" ").toLocaleLowerCase("it-IT");
      return haystack.includes(query.toLocaleLowerCase("it-IT"));
    }

    function chatMatchesFilter(conversation) {
      if (conversation.id === "lobby") return false;
      if (chatUiState.filter === "unread") return Number(conversation.unread || 0) > 0;
      if (chatUiState.filter === "private") return conversation.type === "private";
      if (chatUiState.filter === "group") return conversation.type === "group";
      return true;
    }

    function renderChatConversationList() {
      if (!state.chat) return;
      const lobby = getChatConversation("lobby");
      const lobbyNode = document.getElementById("chatLobbyShortcut");
      const listNode = document.getElementById("chatConversationList");
      if (lobbyNode) lobbyNode.innerHTML = lobby ? renderConversationButton(lobby) : "";
      if (!listNode) return;

      const conversations = state.chat.conversations
        .filter((conversation) => conversation.id !== "lobby")
        .filter((conversation) => chatMatchesFilter(conversation))
        .filter((conversation) => chatMatchesSearch(conversation, chatUiState.search))
        .sort((a, b) => Number(getConversationLastMessage(b)?.timestamp || 0) - Number(getConversationLastMessage(a)?.timestamp || 0));

      listNode.innerHTML = conversations.length
        ? conversations.map(renderConversationButton).join("")
        : '<div class="chat-empty-list">Nessuna conversazione corrisponde alla ricerca o al filtro scelto.</div>';

      document.querySelectorAll("[data-chat-filter]").forEach((button) => {
        button.classList.toggle("active", button.dataset.chatFilter === chatUiState.filter);
      });

      const totalUnread = state.chat.conversations.reduce((total, conversation) => total + Number(conversation.unread || 0), 0);
      const navBadge = document.getElementById("chatNavBadge");
      if (navBadge) {
        navBadge.hidden = totalUnread <= 0;
        navBadge.textContent = totalUnread > 99 ? "99+" : String(totalUnread);
        navBadge.setAttribute("aria-label", `${totalUnread} messaggi non letti`);
      }
    }

    function renderChatConversationHeader() {
      const conversation = getChatConversation();
      const header = document.getElementById("chatConversationHeader");
      if (!header || !conversation) return;
      header.innerHTML = `
        <button class="chat-icon-button chat-mobile-back" type="button" aria-label="Torna alle conversazioni" onclick="chatBackToList()">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"></path></svg>
        </button>
        <span class="chat-header-avatar ${conversationIsOnline(conversation) ? "online" : ""}">${escapeHtml(conversation.avatar || chatInitials(conversation.title))}</span>
        <span class="chat-conversation-heading">
          <strong>${escapeHtml(conversation.title)}</strong>
          <span>${escapeHtml(conversationTypeLabel(conversation))}</span>
        </span>
        <span class="chat-header-tools">
          <button class="chat-icon-button" type="button" aria-label="Cerca nella conversazione" title="Cerca nella conversazione" onclick="focusChatSearch('${escapeHtml(conversation.title)}')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
          </button>
          <button class="chat-icon-button" type="button" aria-label="Informazioni conversazione" title="Informazioni conversazione" onclick="toggleChatInfo(true)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path></svg>
          </button>
        </span>
      `;
    }

    function renderChatMessages() {
      const conversation = getChatConversation();
      const messagesNode = document.getElementById("chatMessages");
      if (!messagesNode || !conversation) return;
      let previousDay = "";
      messagesNode.innerHTML = conversation.messages.map((message) => {
        const day = new Date(message.timestamp).toDateString();
        const separator = day !== previousDay ? `<div class="chat-day-separator">${escapeHtml(formatChatDay(message.timestamp))}</div>` : "";
        previousDay = day;
        if (message.system) {
          return `${separator}<div class="chat-system-message">${escapeHtml(message.text)}</div>`;
        }
        const outgoing = message.sender === "me";
        const senderLabel = !outgoing && conversation.type !== "private"
          ? `<div class="chat-message-sender">${escapeHtml(message.senderName)}</div>`
          : "";
        const attachment = message.attachment
          ? `<div class="chat-message-file"><span class="chat-message-file-icon">▣</span><span><strong>${escapeHtml(message.attachment.name)}</strong><small>${escapeHtml(formatFileSize(message.attachment.size))}</small></span></div>`
          : "";
        const textContent = message.text ? `<div class="chat-message-text">${escapeHtml(message.text)}</div>` : "";
        return `${separator}
          <div class="chat-message-row ${outgoing ? "outgoing" : "incoming"}">
            <div class="chat-message-bubble">
              ${senderLabel}${attachment}${textContent}
              <div class="chat-message-meta">
                <time>${formatChatTime(message.timestamp)}</time>
                ${outgoing ? `<span class="chat-message-status" title="Letto">✓✓</span>` : ""}
              </div>
            </div>
          </div>`;
      }).join("");
      requestAnimationFrame(() => { messagesNode.scrollTop = messagesNode.scrollHeight; });
    }

    function renderChatCreateSheet() {
      const privateNode = document.getElementById("chatPrivateContacts");
      const groupNode = document.getElementById("chatGroupMembers");
      if (!privateNode || !groupNode) return;
      privateNode.innerHTML = chatParticipants.map((participant) => `
        <button class="chat-contact-button" type="button" onclick="createOrOpenPrivateChat('${participant.id}')">
          <span class="chat-conversation-avatar ${participant.online ? "online" : ""}">${participant.initials}</span>
          <span class="chat-conversation-copy"><strong>${escapeHtml(participant.name)}</strong><span>${escapeHtml(participant.status)}</span></span>
        </button>`).join("");
      groupNode.innerHTML = chatParticipants.map((participant) => `
        <label class="chat-member-option">
          <span class="chat-conversation-avatar ${participant.online ? "online" : ""}">${participant.initials}</span>
          <span class="chat-conversation-copy"><strong>${escapeHtml(participant.name)}</strong><span>${escapeHtml(participant.status)}</span></span>
          <input type="checkbox" value="${participant.id}" data-chat-group-member />
        </label>`).join("");
    }

    function renderChatInfoSheet() {
      const sheet = document.getElementById("chatInfoSheet");
      const conversation = getChatConversation();
      if (!sheet || !conversation) return;
      const members = conversation.members
        .filter((member) => member !== "tu")
        .map((member) => getChatParticipant(member))
        .filter(Boolean);
      sheet.innerHTML = `
        <div style="display:flex;justify-content:flex-end"><button class="chat-icon-button" type="button" aria-label="Chiudi informazioni" onclick="toggleChatInfo(false)">×</button></div>
        <div class="chat-info-hero">
          <span class="chat-header-avatar ${conversationIsOnline(conversation) ? "online" : ""}">${escapeHtml(conversation.avatar || chatInitials(conversation.title))}</span>
          <strong>${escapeHtml(conversation.title)}</strong>
          <small class="portal-muted" style="margin-top:5px">${escapeHtml(conversationTypeLabel(conversation))}</small>
        </div>
        <div class="chat-create-section">
          <h4>${conversation.type === "private" ? "Contatto" : "Partecipanti"}</h4>
          ${members.map((member) => `<div class="chat-info-member"><span class="chat-conversation-avatar ${member.online ? "online" : ""}">${member.initials}</span><span><strong>${escapeHtml(member.name)}</strong><br><small class="portal-muted">${escapeHtml(member.status)}</small></span></div>`).join("") || '<p>Nessun partecipante disponibile.</p>'}
        </div>
        ${conversation.locked ? '<div class="chat-system-message" style="max-width:100%">La Lobby generale è permanente e non può essere eliminata.</div>' : '<button class="chat-contact-button" type="button" onclick="archiveActiveChat()">Archivia conversazione</button>'}
      `;
    }

    function renderChatMinimizedDock() {
      const dock = document.getElementById("chatMinimizedDock");
      if (!dock || !state.chat) return;
      const ids = Array.isArray(state.chat.minimizedConversationIds)
        ? state.chat.minimizedConversationIds
        : [];
      const conversations = ids
        .map((id) => getChatConversation(id))
        .filter(Boolean);

      dock.hidden = conversations.length === 0;
      dock.innerHTML = conversations.map((conversation) => {
        const unread = Number(conversation.unread || 0);
        const title = escapeHtml(conversation.title);
        return `
          <div class="chat-minimized-item" data-minimized-chat="${escapeHtml(conversation.id)}">
            <button class="chat-minimized-open" type="button" title="Apri ${title}" aria-label="Apri la chat ${title}" onclick="restoreMinimizedChat('${escapeHtml(conversation.id)}')">
              <span class="chat-minimized-avatar ${conversationIsOnline(conversation) ? "online" : ""}">${escapeHtml(conversation.avatar || chatInitials(conversation.title))}</span>
              <span class="chat-minimized-name">${title}</span>
              ${unread ? `<span class="chat-minimized-unread">${Math.min(unread, 99)}</span>` : ""}
            </button>
            <button class="chat-minimized-remove" type="button" aria-label="Rimuovi ${title} dalle chat ridotte" title="Rimuovi dalla barra" onclick="removeMinimizedChat('${escapeHtml(conversation.id)}')">×</button>
          </div>`;
      }).join("");
    }

    function minimizeActiveChat() {
      const panel = document.getElementById("chatPanel");
      const conversation = getChatConversation();
      if (!panel || !conversation) return;
      if (!Array.isArray(state.chat.minimizedConversationIds)) {
        state.chat.minimizedConversationIds = [];
      }
      if (!state.chat.minimizedConversationIds.includes(conversation.id)) {
        state.chat.minimizedConversationIds.push(conversation.id);
      }
      panel.classList.add("hidden");
      panel.classList.remove("mobile-conversation-open", "is-dragging");
      document.documentElement.classList.remove("chat-dragging");
      renderChatMinimizedDock();
      saveState();
      showToast(`${conversation.title} ridotta in basso`);
    }

    function restoreMinimizedChat(id) {
      const conversation = getChatConversation(id);
      const panel = document.getElementById("chatPanel");
      if (!conversation || !panel) return;
      state.chat.activeConversationId = id;
      conversation.unread = 0;
      state.chat.minimizedConversationIds = (state.chat.minimizedConversationIds || [])
        .filter((conversationId) => conversationId !== id);
      panel.classList.remove("hidden");
      if (window.innerWidth <= 760) panel.classList.add("mobile-conversation-open");
      renderChatCenter();
      saveState();
    }

    function removeMinimizedChat(id) {
      state.chat.minimizedConversationIds = (state.chat.minimizedConversationIds || [])
        .filter((conversationId) => conversationId !== id);
      renderChatMinimizedDock();
      saveState();
    }

    function renderChatCenter() {
      if (!state.chat) state.chat = createDefaultChatState();
      renderChatConversationList();
      renderChatConversationHeader();
      renderChatMessages();
      renderChatCreateSheet();
      renderChatInfoSheet();
      renderChatMinimizedDock();
    }

    function openChatConversation(id) {
      const conversation = getChatConversation(id);
      if (!conversation) return;
      state.chat.activeConversationId = id;
      conversation.unread = 0;
      state.chat.minimizedConversationIds = (state.chat.minimizedConversationIds || [])
        .filter((conversationId) => conversationId !== id);
      document.getElementById("chatPanel")?.classList.add("mobile-conversation-open");
      toggleChatCreateSheet(false);
      toggleChatInfo(false);
      renderChatCenter();
      saveState();
    }

    function chatBackToList() {
      document.getElementById("chatPanel")?.classList.remove("mobile-conversation-open");
    }

    function setChatFilter(filter) {
      chatUiState.filter = ["all", "unread", "private", "group"].includes(filter) ? filter : "all";
      renderChatConversationList();
    }

    function setChatSearch(value) {
      chatUiState.search = String(value || "").trim();
      renderChatConversationList();
    }

    function focusChatSearch(query = "") {
      const input = document.getElementById("chatSearch");
      if (!input) return;
      chatBackToList();
      input.value = query;
      setChatSearch(query);
      input.focus();
    }

    function toggleChatCreateSheet(force) {
      const sheet = document.getElementById("chatCreateSheet");
      if (!sheet) return;
      const next = typeof force === "boolean" ? force : sheet.hidden;
      sheet.hidden = !next;
      chatUiState.createOpen = next;
      if (next) {
        toggleChatInfo(false);
        renderChatCreateSheet();
        setTimeout(() => document.getElementById("chatGroupName")?.focus(), 40);
      }
    }

    function toggleChatInfo(force) {
      const sheet = document.getElementById("chatInfoSheet");
      if (!sheet) return;
      const next = typeof force === "boolean" ? force : sheet.hidden;
      sheet.hidden = !next;
      chatUiState.infoOpen = next;
      if (next) {
        toggleChatCreateSheet(false);
        renderChatInfoSheet();
      }
    }

    function createOrOpenPrivateChat(participantId) {
      const participant = getChatParticipant(participantId);
      if (!participant) return;
      let conversation = state.chat.conversations.find((item) => item.type === "private" && item.members.includes(participantId));
      if (!conversation) {
        conversation = {
          id: `private-${participantId}`,
          type: "private",
          title: participant.name,
          avatar: participant.initials,
          members: ["tu", participantId],
          unread: 0,
          messages: [{
            id: createChatId("system"),
            sender: "system",
            senderName: "Sistema",
            text: `Conversazione privata con ${participant.name} avviata.`,
            timestamp: Date.now(),
            system: true
          }]
        };
        state.chat.conversations.push(conversation);
      }
      openChatConversation(conversation.id);
      showToast(`Chat privata con ${participant.name}`);
    }

    function createChatGroup() {
      const nameInput = document.getElementById("chatGroupName");
      const name = nameInput?.value.trim() || "";
      const selected = [...document.querySelectorAll("[data-chat-group-member]:checked")].map((input) => input.value);
      if (name.length < 2) {
        showToast("Inserisci un nome per il gruppo");
        nameInput?.focus();
        return;
      }
      if (selected.length < 2) {
        showToast("Seleziona almeno due partecipanti");
        return;
      }
      const conversation = {
        id: createChatId("group"),
        type: "group",
        title: name,
        avatar: chatInitials(name),
        members: ["tu", ...selected],
        unread: 0,
        messages: [{
          id: createChatId("system"),
          sender: "system",
          senderName: "Sistema",
          text: `Hai creato il gruppo ${name}.`,
          timestamp: Date.now(),
          system: true
        }]
      };
      state.chat.conversations.push(conversation);
      nameInput.value = "";
      document.querySelectorAll("[data-chat-group-member]").forEach((input) => { input.checked = false; });
      openChatConversation(conversation.id);
      showToast(`Gruppo “${name}” creato`);
    }

    function autoSizeChatInput(input) {
      if (!input) return;
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 118)}px`;
    }

    function insertChatEmoji() {
      const input = document.getElementById("chatInput");
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = `${input.value.slice(0, start)}🙂${input.value.slice(end)}`;
      input.focus();
      input.setSelectionRange(start + 2, start + 2);
      autoSizeChatInput(input);
    }

    function sendChatMessage() {
      const input = document.getElementById("chatInput");
      const value = input?.value.trim() || "";
      const conversation = getChatConversation();
      if (!value || !conversation) return;
      conversation.messages.push({
        id: createChatId("message"),
        sender: "me",
        senderName: "Tu",
        text: value,
        timestamp: Date.now(),
        status: "read"
      });
      input.value = "";
      autoSizeChatInput(input);
      renderChatCenter();
      saveState();
    }

    function sendChatAttachments(event) {
      const files = [...(event.target.files || [])];
      const conversation = getChatConversation();
      if (!conversation || !files.length) return;
      files.slice(0, 5).forEach((file) => {
        conversation.messages.push({
          id: createChatId("file"),
          sender: "me",
          senderName: "Tu",
          text: "",
          timestamp: Date.now(),
          status: "read",
          attachment: { name: file.name, size: file.size, type: file.type || "file" }
        });
      });
      event.target.value = "";
      renderChatCenter();
      saveState();
      showToast(files.length === 1 ? "Allegato aggiunto" : `${Math.min(files.length, 5)} allegati aggiunti`);
    }

    function handleChatKey(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
      }
    }

    function archiveActiveChat() {
      const conversation = getChatConversation();
      if (!conversation || conversation.locked) return;
      state.chat.conversations = state.chat.conversations.filter((item) => item.id !== conversation.id);
      state.chat.minimizedConversationIds = (state.chat.minimizedConversationIds || [])
        .filter((conversationId) => conversationId !== conversation.id);
      state.chat.activeConversationId = "lobby";
      toggleChatInfo(false);
      renderChatCenter();
      saveState();
      showToast("Conversazione archiviata");
    }

    function toggleDarkMode() {
      document.body.classList.toggle("dark");
      saveState();
    }

    const graphicsModes = new Set(["full", "optimized", "reduced"]);
    let graphicsAnimationObserver = null;

    function syncGraphicsSettingsControls() {
      document.querySelectorAll(".graphics-mode-option[data-graphics-mode]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.graphicsMode === state.graphicsMode));
      });
    }

    function applyGraphicsMode(options = {}) {
      const mode = graphicsModes.has(state.graphicsMode) ? state.graphicsMode : "optimized";
      state.graphicsMode = mode;
      document.body.dataset.graphicsMode = mode;
      document.body.classList.toggle("graphics-full", mode === "full");
      document.body.classList.toggle("graphics-optimized", mode === "optimized");
      document.body.classList.toggle("graphics-reduced", mode === "reduced");

      updateThemeCursorMode();
      syncGraphicsSettingsControls();

      if (mode === "reduced") {
        hideThemeCursor();
        resetRestingEveGaze();
      }

      if (options.persist) saveState();
      if (options.notify) {
        const labels = {
          full: "Grafica completa attivata",
          optimized: "Grafica ottimizzata attivata",
          reduced: "Animazioni ridotte"
        };
        showToast(labels[mode]);
      }
    }

    function setGraphicsMode(mode) {
      if (!graphicsModes.has(mode)) return;
      state.graphicsMode = mode;
      applyGraphicsMode({ persist: true, notify: true });
    }

    function initializeGraphicsAnimationObserver() {
      if (typeof IntersectionObserver !== "function") return;

      graphicsAnimationObserver?.disconnect();
      graphicsAnimationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("graphics-animation-paused", !entry.isIntersecting);
        });
      }, { rootMargin: "80px", threshold: 0.01 });

      document.querySelectorAll("*").forEach((element) => {
        if (window.getComputedStyle(element).animationName !== "none") {
          graphicsAnimationObserver.observe(element);
        }
      });
    }

    function syncGraphicsPageVisibility() {
      document.body.classList.toggle("graphics-page-hidden", document.hidden);
      if (document.hidden) {
        hideThemeCursor();
        resetRestingEveGaze();
      }
    }

    function resetDemo() {
      try {
        localStorage.removeItem("aula-demo-layout-reale");
      } catch (error) {
        console.warn("localStorage non disponibile durante il reset", error);
      }
      location.reload();
    }

    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("visible");
      clearTimeout(showToast.timeout);
      showToast.timeout = setTimeout(() => toast.classList.remove("visible"), 2200);
    }

    function saveState() {
      const serializable = {
        ...state,
        completedSections: [...state.completedSections],
        dark: document.body.classList.contains("dark")
      };
      try {
        localStorage.setItem("aula-demo-layout-reale", JSON.stringify(serializable));
      } catch (error) {
        console.warn("localStorage non disponibile: la demo continuerà senza persistenza", error);
      }
    }

    function loadState() {
      try {
        const raw = localStorage.getItem("aula-demo-layout-reale");
        if (!raw) return;
        const saved = JSON.parse(raw);
        state.currentSection = Number(saved.currentSection || 0);
        state.currentView = saved.currentView || "lesson";
        state.completedSections = new Set(saved.completedSections || []);
        state.exerciseSaved = Boolean(saved.exerciseSaved);
        state.exerciseDrafts = saved.exerciseDrafts && typeof saved.exerciseDrafts === "object"
          ? saved.exerciseDrafts
          : {};
        state.exerciseCompletedIds = Array.isArray(saved.exerciseCompletedIds)
          ? saved.exerciseCompletedIds
          : (saved.exerciseSaved ? ["distributor"] : []);
        state.activeExerciseId = exerciseDefinitions.some((exercise) => exercise.id === saved.activeExerciseId)
          ? saved.activeExerciseId
          : "distributor";
        state.quizCorrect = Boolean(saved.quizCorrect);
        state.projectSubmitted = Boolean(saved.projectSubmitted);
        state.notes = saved.notes || "";
        state.timerSeconds = Number(saved.timerSeconds || 0);
        state.timerRunning = Boolean(saved.timerRunning);
        state.timerPomodoro = Boolean(saved.timerPomodoro);
        state.audioRate = Number(saved.audioRate || 1);
        state.audioVoiceURI = saved.audioVoiceURI || "";
        state.audioMode = saved.audioMode || "faithful";
        state.audioScope = ["section", "custom", "lesson"].includes(saved.audioScope)
          ? saved.audioScope
          : "section";
        state.audioSelectedSections = Array.isArray(saved.audioSelectedSections)
          ? saved.audioSelectedSections.map(Number)
          : lessonSections.map((_, index) => index);
        state.evePanelCollapsed = Boolean(saved.evePanelCollapsed ?? saved.eveVoiceCollapsed);
        state.eveDetachEnabled = Boolean(saved.eveDetachEnabled);
        state.progressMissionsExpanded = Boolean(saved.progressMissionsExpanded);
        state.modulesPanelCollapsed = Boolean(saved.modulesPanelCollapsed);
        state.graphicsMode = graphicsModes.has(saved.graphicsMode) ? saved.graphicsMode : "optimized";
        state.chat = normalizeChatState(saved.chat);
        if (saved.dark) document.body.classList.add("dark");
      } catch (error) {
        console.warn("Stato demo non valido", error);
      }
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function makeFloatingPanelDraggable(panel) {
      if (!panel) return;
      const handle = panel.querySelector("[data-drag-handle]");
      if (!handle) return;

      let dragging = false;
      let pointerId = null;
      let offsetX = 0;
      let offsetY = 0;

      function stopDragging(event) {
        if (!dragging) return;
        if (event?.pointerId != null && pointerId != null && event.pointerId !== pointerId) return;
        dragging = false;
        window.removeEventListener("pointermove", movePanel);
        window.removeEventListener("pointerup", stopDragging);
        window.removeEventListener("pointercancel", stopDragging);
        panel.classList.remove("is-dragging");
        document.documentElement.classList.remove("chat-dragging");
        try {
          if (pointerId != null && handle.hasPointerCapture?.(pointerId)) {
            handle.releasePointerCapture(pointerId);
          }
        } catch (error) {
          /* Il puntatore può essere già stato rilasciato dal browser. */
        }
        pointerId = null;
        saveState();
      }

      function movePanel(event) {
        if (!dragging || (pointerId != null && event.pointerId !== pointerId)) return;
        event.preventDefault();
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        const visibleEdge = 54;
        const minLeft = Math.min(8, visibleEdge - panelWidth);
        const maxLeft = Math.max(8, window.innerWidth - visibleEdge);
        const minTop = 8;
        const maxTop = Math.max(8, window.innerHeight - visibleEdge);
        const left = Math.min(Math.max(minLeft, event.clientX - offsetX), maxLeft);
        const top = Math.min(Math.max(minTop, event.clientY - offsetY), maxTop);
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }

      handle.addEventListener("pointerdown", (event) => {
        if (panel.id === "chatPanel" && window.innerWidth <= 760) return;
        if (event.button !== 0 || event.target.closest("button, input, textarea, select, a")) return;
        event.preventDefault();
        dragging = true;
        pointerId = event.pointerId;
        const rect = panel.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        panel.classList.add("is-dragging");
        document.documentElement.classList.add("chat-dragging");
        try {
          handle.setPointerCapture(pointerId);
        } catch (error) {
          /* Il trascinamento continua tramite gli eventi globali. */
        }
        window.addEventListener("pointermove", movePanel, { passive: false });
        window.addEventListener("pointerup", stopDragging, { passive: true });
        window.addEventListener("pointercancel", stopDragging, { passive: true });
      });

      handle.addEventListener("lostpointercapture", stopDragging);
      window.addEventListener("blur", stopDragging);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopDragging();
      });
    }

    loadState();
    applyGraphicsMode();
    syncGraphicsPageVisibility();
    state.chat = normalizeChatState(state.chat);
    renderChatCenter();
    applyProgressMissionsState();
    applyModulesPanelState();
    renderLessonSection();
    setEveContext(state.currentView || "lesson");
    updateProgress();
    updateTimerDisplay();
    document.getElementById("timerToggle").textContent = state.timerRunning ? "Pausa" : "Avvia";
    document.getElementById("timerMode").textContent = state.timerPomodoro ? "Modalità Pomodoro" : "Modalità libera";
    audioRate.value = String(state.audioRate || 1);
    audioMode.value = state.audioMode || "faithful";
    audioScope.value = state.audioScope || "section";
    audioVoice.value = state.audioVoiceURI || "";
    if (exerciseAudioRate) exerciseAudioRate.value = String(state.audioRate || 1);
    audioLessonState.scope = audioScope.value;
    audioLessonState.startSection = state.currentSection;
    updateAudioScopeNote();
    renderAudioPageSelection();
    syncComprehensionButton();
    setAudioPlayButtonState("play");
    applyEvePanelState();
    applyEveDetachState();
    audioRate.addEventListener("change", syncAudioPreferences);
    audioVoice.addEventListener("change", syncAudioPreferences);
    audioMode.addEventListener("change", syncAudioPreferences);
    audioScope.addEventListener("change", syncAudioPreferences);
    initializeFrequencyBars();
    stopFrequencyAnimation(true);
    populateAudioVoices();
    syncExerciseVoiceSelectors();
    updateEveVoiceActivity(state.currentView);
    initializeGraphicsAnimationObserver();
    document.addEventListener("visibilitychange", syncGraphicsPageVisibility, { passive: true });
    if (speechIsSupported()) window.speechSynthesis.onvoiceschanged = populateAudioVoices;
    pageScroll.addEventListener("scroll", refreshReadingMascotPosition, { passive: true });
    window.addEventListener("resize", refreshReadingMascotPosition, { passive: true });
    document.addEventListener("selectionchange", captureExerciseSelection);
    documentContent.addEventListener("mouseup", captureExerciseSelection, { passive: true });
    documentContent.addEventListener("keyup", captureExerciseSelection, { passive: true });
    documentContent.addEventListener("select", captureExerciseSelection, { passive: true });
    pageScroll.addEventListener("scroll", () => exerciseSelectionToolbar?.classList.add("hidden"), { passive: true });
    window.addEventListener("resize", () => exerciseSelectionToolbar?.classList.add("hidden"), { passive: true });
    if (eveAssistant && evePanelToggle) {
      const evePresenceObserver = new MutationObserver(syncRestingEvePresence);
      evePresenceObserver.observe(eveAssistant, { attributes: true, attributeFilter: ["class"] });
      syncRestingEvePresence();
    }
    window.addEventListener("beforeunload", () => { stopExerciseSpeech(false); stopAudioLesson(false); });
    makeFloatingPanelDraggable(document.getElementById("timerPanel"));
    makeFloatingPanelDraggable(document.getElementById("chatPanel"));
  


  /* ==========================================================
     CONSOLIDAMENTO MATERIALI + CHECKLIST — 1.4.0-alpha.9
     ========================================================== */
  (() => {
    "use strict";

    const VERSION = "1.4.0-alpha.9";
    window.AULA_DEMO_VERSION = VERSION;
    window.AULA_PHASE3_CONSOLIDATION = {
      version: "1.3.0-alpha.10",
      integratedInto: VERSION,
      base: "1.3.0-alpha.9",
      standalone: true
    };
    window.AULA_PHASE4_CHECKLIST = {
      version: VERSION,
      storageKey: "aula-demo-checklist-v2",
      standalone: true
    };

    const phaseEscape = (value) => String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    const textSeed = aulaMaterialsPanelData.find((item) => item.id === "python-introduction-txt");
    if (textSeed) {
      Object.assign(textSeed, {
        viewerReady: true,
        textSections: [
          {
            title: "Che cos’è Python",
            paragraphs: [
              "Python è un linguaggio di programmazione progettato per rendere il codice leggibile e organizzato.",
              "Un programma Python è composto da istruzioni eseguite in ordine, salvo quando condizioni, cicli o funzioni modificano il flusso."
            ],
            examples: [
              'print("Ciao, mondo!")',
              "eta = 25",
              'nome = "Andrea"'
            ]
          },
          {
            title: "Regole essenziali",
            paragraphs: [
              "La sintassi stabilisce come devono essere scritte le istruzioni. La semantica descrive che cosa significano.",
              "Gli spazi iniziali possono avere un significato strutturale: in Python l’indentazione delimita i blocchi di codice."
            ],
            examples: [
              'if eta >= 18:\n    print("Maggiorenne")'
            ]
          },
          {
            title: "Collegamento con gli esercizi",
            paragraphs: [
              "Prima di scrivere codice, separa input, elaborazione, output e casi limite.",
              "Usa nomi chiari e verifica il comportamento anche con dati vuoti, valori estremi o input non validi."
            ],
            examples: []
          }
        ]
      });
    }

    function phaseMaterialUpdateHeading(material) {
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
    }

    function phaseTextSections(material) {
      if (Array.isArray(material.textSections) && material.textSections.length) {
        return material.textSections;
      }
      return [
        {
          title: "Anteprima testuale sicura",
          paragraphs: [
            "Il materiale è classificato come TXT o Markdown ed è disponibile nel lettore interno della demo.",
            "Per proteggere il dispositivo, la demo non esegue codice e non interpreta HTML eventualmente presente nel file."
          ],
          examples: material.originalName ? [`File: ${material.originalName}`] : []
        }
      ];
    }

    window.aulaTextOpen = function aulaTextOpen(material) {
      if (!material || !documentContent) return;

      if (typeof aulaMaterialTrackingStop === "function") aulaMaterialTrackingStop();
      const saved = typeof aulaMaterialProgressGet === "function"
        ? aulaMaterialProgressGet(material.id)
        : null;

      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      phaseMaterialUpdateHeading(material);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));

      const sections = phaseTextSections(material);
      documentContent.innerHTML = `
        <section class="material-text-viewer" data-material-text-id="${phaseEscape(material.id)}">
          <div class="document-section-label">Testo interno · ${phaseEscape(material.course || "Materiale della stanza")}</div>
          <article class="material-text-sheet">
            <h1>${phaseEscape(material.title)}</h1>
            ${sections.map((section) => `
              <section>
                <h2>${phaseEscape(section.title)}</h2>
                ${(section.paragraphs || []).map((paragraph) => `<p>${phaseEscape(paragraph)}</p>`).join("")}
                ${(section.examples || []).map((example) => `<pre class="material-text-code">${phaseEscape(example)}</pre>`).join("")}
              </section>
            `).join("")}
          </article>
        </section>`;

      state.currentView = "material-text";
      aulaMaterialsPanelState.selectedId = material.id;
      aulaMaterialsPanelSave();
      saveState();
      closeDrawer();
      showToast(`Testo aperto: ${material.title}`);

      window.setTimeout(() => {
        if (saved && typeof aulaMaterialRestoreAfterOpen === "function") {
          aulaMaterialRestoreAfterOpen(material.id, saved);
        }
        if (typeof aulaMaterialTrackingBanner === "function") {
          aulaMaterialTrackingBanner(material.id, saved);
        }
        if (typeof aulaMaterialTrackingStart === "function") {
          aulaMaterialTrackingStart(material.id, saved);
        }
        if (typeof aulaMaterialTrackingSave === "function") {
          aulaMaterialTrackingSave(saved ? "material_resumed" : "material_opened");
        }
      }, 40);
    };

    const phaseMaterialsOpenBefore = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function phaseMaterialsPanelOpen(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material && typeof aulaMaterialOfficialDescriptor === "function"
        ? aulaMaterialOfficialDescriptor(material)
        : null;
      if (material && descriptor?.access === "internal" && descriptor.viewer === "text") {
        return window.aulaTextOpen(material);
      }
      return phaseMaterialsOpenBefore(id);
    };

    function phaseDuplicateIds() {
      const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    }

    window.aulaMaterialDiagnosticsOpen = function aulaMaterialDiagnosticsOpen() {
      if (!documentContent) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);

      const checks = [
        ["Identificatori univoci", phaseDuplicateIds().length === 0],
        ["Lettore TXT / Markdown", typeof window.aulaTextOpen === "function"],
        ["Viewer PDF", typeof window.aulaPdfOpen === "function"],
        ["Viewer DOCX", typeof window.aulaDocumentOpen === "function"],
        ["Viewer PPTX", typeof window.aulaPresentationOpen === "function"],
        ["Player video", typeof window.aulaVideoOpen === "function"],
        ["Importazione protetta", typeof window.aulaMaterialImportStart === "function"],
        ["Tracking e ripresa", typeof window.aulaMaterialTrackingSave === "function"],
        ["Errori e alternative", typeof window.aulaMaterialRetry === "function"],
        ["Nessun iframe remoto", [...document.querySelectorAll("iframe")].every((frame) => !/^https?:/i.test(frame.src || ""))]
      ];
      const passed = checks.filter(([, ok]) => ok).length;

      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      documentContent.innerHTML = `
        <section class="material-diagnostics">
          <div class="document-section-label">Fase 3 consolidata · diagnostica locale</div>
          <article class="material-diagnostics-card">
            <h1>Verifica sistema Materiali</h1>
            <p>${passed} controlli superati su ${checks.length}. La diagnostica verifica la presenza delle funzioni nella demo corrente e non sostituisce un test server dell’app ufficiale.</p>
            <div class="material-diagnostics-grid">
              ${checks.map(([label, ok]) => `
                <div class="material-diagnostic-row" data-ok="${ok}">
                  <strong>${phaseEscape(label)}</strong>
                  <span>${ok ? "Disponibile" : "Non disponibile"}</span>
                </div>
              `).join("")}
            </div>
            <div class="material-diagnostics-note">
              <strong>File autonomo.</strong> Questa versione non usa <code>fetch()</code>, non richiede Internet e può essere aperta direttamente con doppio clic.
            </div>
          </article>
        </section>`;
      state.currentView = "material-diagnostics";
      setEveContext("materiali");
      saveState();
      closeDrawer();
      showToast(`Diagnostica Materiali: ${passed}/${checks.length}`);
    };

    const phaseBuildMaterialsBefore = window.buildMaterialsDrawerHtml || buildMaterialsDrawerHtml;
    window.buildMaterialsDrawerHtml = function phaseBuildMaterialsDrawerHtml() {
      const html = phaseBuildMaterialsBefore();
      const target = '<div class="materials-panel-footer-actions">';
      const controls = `
        <div class="materials-panel-footer-actions">
          <span class="phase4-version-badge">Fase 3 consolidata</span>
          <button type="button" onclick="aulaMaterialDiagnosticsOpen()">Verifica sistema</button>`;
      return html.includes(target) ? html.replace(target, controls) : html;
    };

    const CHECKLIST_KEY = "aula-demo-checklist-v2";
    const checklistDefaults = [
      {
        id: "checklist-goal",
        title: "Definire l’obiettivo della settimana",
        category: "Pianificazione",
        assignee: "Andrea",
        priority: "high",
        due: "2026-07-23",
        status: "todo"
      },
      {
        id: "checklist-python",
        title: "Installare Python e verificare la versione",
        category: "Avvio",
        assignee: "Andrea",
        priority: "high",
        due: "2026-07-24",
        status: "todo"
      },
      {
        id: "checklist-lesson",
        title: "Completare la lezione 0.1",
        category: "Lezioni",
        assignee: "Andrea",
        priority: "high",
        due: "2026-07-25",
        status: "in_progress"
      },
      {
        id: "checklist-exercises",
        title: "Svolgere gli esercizi del capitolo 1",
        category: "Esercizi",
        assignee: "Luca",
        priority: "medium",
        due: "2026-07-27",
        status: "todo"
      },
      {
        id: "checklist-review",
        title: "Confrontare le soluzioni nella stanza",
        category: "Revisione",
        assignee: "Tutti",
        priority: "medium",
        due: "2026-07-28",
        status: "todo"
      },
      {
        id: "checklist-notes",
        title: "Salvare gli appunti introduttivi",
        category: "Appunti",
        assignee: "Andrea",
        priority: "low",
        due: "2026-07-22",
        status: "done"
      }
    ];

    const checklistState = {
      loaded: false,
      items: [],
      query: "",
      status: "all",
      assignee: "all",
      formOpen: false
    };

    function checklistNormalize(item) {
      if (!item || typeof item !== "object") return null;
      const title = String(item.title || "").trim().replace(/\s+/g, " ").slice(0, 100);
      if (!item.id || title.length < 3) return null;
      return {
        id: String(item.id).slice(0, 80),
        title,
        category: String(item.category || "Generale").slice(0, 40),
        assignee: ["Andrea", "Luca", "Tutti"].includes(item.assignee) ? item.assignee : "Tutti",
        priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "medium",
        due: /^\d{4}-\d{2}-\d{2}$/.test(String(item.due || "")) ? String(item.due) : "",
        status: ["todo", "in_progress", "done"].includes(item.status) ? item.status : "todo"
      };
    }

    function checklistLoad() {
      if (checklistState.loaded) return;
      checklistState.loaded = true;
      let parsed = null;
      try {
        parsed = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "null");
      } catch {
        parsed = null;
      }
      const source = Array.isArray(parsed) ? parsed : checklistDefaults;
      checklistState.items = source.map(checklistNormalize).filter(Boolean);
      if (!checklistState.items.length) {
        checklistState.items = checklistDefaults.map((item) => ({ ...item }));
      }
    }

    function checklistSave() {
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistState.items));
        return true;
      } catch {
        return false;
      }
    }

    function checklistToday() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function checklistIsOverdue(item) {
      return item.status !== "done" && item.due && item.due < checklistToday();
    }

    function checklistFiltered() {
      const query = checklistState.query.trim().toLocaleLowerCase("it");
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return checklistState.items
        .filter((item) => {
          const haystack = `${item.title} ${item.category} ${item.assignee}`.toLocaleLowerCase("it");
          return (!query || haystack.includes(query))
            && (checklistState.status === "all" || item.status === checklistState.status)
            && (checklistState.assignee === "all" || item.assignee === checklistState.assignee);
        })
        .sort((a, b) =>
          Number(a.status === "done") - Number(b.status === "done")
          || Number(checklistIsOverdue(b)) - Number(checklistIsOverdue(a))
          || priorityOrder[a.priority] - priorityOrder[b.priority]
          || String(a.due).localeCompare(String(b.due))
          || a.title.localeCompare(b.title, "it")
        );
    }

    function checklistStatusLabel(value) {
      return ({
        todo: "Da fare",
        in_progress: "In corso",
        done: "Completata",
        high: "Alta",
        medium: "Media",
        low: "Bassa"
      })[value] || value;
    }

    function checklistDateLabel(value) {
      if (!value) return "Senza scadenza";
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }

    function checklistMessage(message = "", tone = "") {
      const node = document.getElementById("checklistMessage");
      if (!node) return;
      node.textContent = message;
      if (tone) node.dataset.tone = tone;
      else node.removeAttribute("data-tone");
    }

    function checklistTaskHtml(item) {
      const overdue = checklistIsOverdue(item);
      return `
        <article class="checklist-task" data-status="${phaseEscape(item.status)}" data-overdue="${overdue}">
          <button
            class="checklist-complete-button"
            type="button"
            role="checkbox"
            aria-checked="${item.status === "done"}"
            aria-label="${item.status === "done" ? "Riapri" : "Completa"} ${phaseEscape(item.title)}"
            onclick="checklistToggle('${phaseEscape(item.id)}')"
          >${item.status === "done" ? "✓" : ""}</button>
          <div>
            <h4>${phaseEscape(item.title)}</h4>
            <p>${phaseEscape(item.category)} · ${phaseEscape(item.assignee)}</p>
            <div class="checklist-tags">
              <span>Priorità ${phaseEscape(checklistStatusLabel(item.priority))}</span>
              <span>${overdue ? "Scaduta " : "Scadenza "}${phaseEscape(checklistDateLabel(item.due))}</span>
            </div>
          </div>
          <div class="checklist-task-actions">
            <select aria-label="Stato di ${phaseEscape(item.title)}" onchange="checklistSetStatus('${phaseEscape(item.id)}', this.value)">
              <option value="todo"${item.status === "todo" ? " selected" : ""}>Da fare</option>
              <option value="in_progress"${item.status === "in_progress" ? " selected" : ""}>In corso</option>
              <option value="done"${item.status === "done" ? " selected" : ""}>Completata</option>
            </select>
            <button type="button" onclick="checklistRemove('${phaseEscape(item.id)}')">Rimuovi</button>
          </div>
        </article>`;
    }

    window.buildChecklistDrawerHtml = function buildChecklistDrawerHtml() {
      checklistLoad();
      const filtered = checklistFiltered();
      const total = checklistState.items.length;
      const done = checklistState.items.filter((item) => item.status === "done").length;
      const inProgress = checklistState.items.filter((item) => item.status === "in_progress").length;
      const overdue = checklistState.items.filter(checklistIsOverdue).length;
      const percent = total ? Math.round((done / total) * 100) : 0;

      return `
        <div class="checklist-shell">
          <section class="checklist-header">
            <div>
              <span class="phase4-version-badge">Fase 4 · ${VERSION}</span>
              <h3>Programmazione da Zero</h3>
              <p>Attività della stanza con stato, assegnatario, priorità e scadenza.</p>
            </div>
            <div class="checklist-progress-summary">
              <strong>${percent}%</strong>
              <span>${done} di ${total} completate</span>
              <div class="checklist-progress-track"><span style="width:${percent}%"></span></div>
            </div>
          </section>

          <div class="checklist-metrics">
            <div class="checklist-metric"><span>Totale</span><strong>${total}</strong></div>
            <div class="checklist-metric"><span>Completate</span><strong>${done}</strong></div>
            <div class="checklist-metric"><span>In corso</span><strong>${inProgress}</strong></div>
            <div class="checklist-metric"><span>Scadute</span><strong>${overdue}</strong></div>
          </div>

          <div class="checklist-toolbar">
            <input
              id="checklistSearch"
              type="search"
              value="${phaseEscape(checklistState.query)}"
              placeholder="Cerca attività"
              aria-label="Cerca nella Checklist"
              oninput="checklistSetQuery(this.value)"
            >
            <select aria-label="Filtra per stato" onchange="checklistSetFilter(this.value)">
              <option value="all"${checklistState.status === "all" ? " selected" : ""}>Tutti gli stati</option>
              <option value="todo"${checklistState.status === "todo" ? " selected" : ""}>Da fare</option>
              <option value="in_progress"${checklistState.status === "in_progress" ? " selected" : ""}>In corso</option>
              <option value="done"${checklistState.status === "done" ? " selected" : ""}>Completate</option>
            </select>
            <select aria-label="Filtra per assegnatario" onchange="checklistSetAssignee(this.value)">
              <option value="all"${checklistState.assignee === "all" ? " selected" : ""}>Tutte le persone</option>
              <option value="Andrea"${checklistState.assignee === "Andrea" ? " selected" : ""}>Andrea</option>
              <option value="Luca"${checklistState.assignee === "Luca" ? " selected" : ""}>Luca</option>
              <option value="Tutti"${checklistState.assignee === "Tutti" ? " selected" : ""}>Tutti</option>
            </select>
            <button class="primary" type="button" onclick="checklistToggleForm()">＋ Nuova attività</button>
          </div>

          ${checklistState.formOpen ? `
            <form class="checklist-create-form" onsubmit="checklistAdd(event)">
              <input name="title" minlength="3" maxlength="100" required placeholder="Titolo dell’attività" aria-label="Titolo attività">
              <select name="assignee" aria-label="Assegnatario">
                <option>Andrea</option>
                <option>Luca</option>
                <option>Tutti</option>
              </select>
              <select name="priority" aria-label="Priorità">
                <option value="high">Alta</option>
                <option value="medium" selected>Media</option>
                <option value="low">Bassa</option>
              </select>
              <input name="due" type="date" aria-label="Scadenza">
              <button class="primary" type="submit">Aggiungi</button>
            </form>
          ` : ""}

          <div class="checklist-message" id="checklistMessage" role="status" aria-live="polite"></div>

          <div class="checklist-list">
            ${filtered.length
              ? filtered.map(checklistTaskHtml).join("")
              : '<div class="checklist-empty">Nessuna attività corrisponde ai filtri.</div>'}
          </div>

          <div class="checklist-local-note">
            <strong>Demo locale.</strong> Le modifiche vengono salvate soltanto in questo browser.
            Nell’app ufficiale Checklist, assegnazioni e permessi dovranno usare database, RLS e Realtime autenticati.
          </div>
        </div>`;
    };

    window.checklistRender = function checklistRender(options = {}) {
      const content = document.getElementById("drawerContent");
      const backdrop = document.getElementById("drawerBackdrop");
      if (!content || !backdrop || backdrop.classList.contains("hidden")) return;
      content.innerHTML = window.buildChecklistDrawerHtml();
      if (options.focusSearch) {
        window.setTimeout(() => {
          const input = document.getElementById("checklistSearch");
          if (!input) return;
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
      }
    };

    window.checklistSetQuery = function checklistSetQuery(value) {
      checklistState.query = String(value || "");
      window.checklistRender({ focusSearch: true });
    };

    window.checklistSetFilter = function checklistSetFilter(value) {
      checklistState.status = ["all", "todo", "in_progress", "done"].includes(value) ? value : "all";
      window.checklistRender();
    };

    window.checklistSetAssignee = function checklistSetAssignee(value) {
      checklistState.assignee = ["all", "Andrea", "Luca", "Tutti"].includes(value) ? value : "all";
      window.checklistRender();
    };

    window.checklistToggleForm = function checklistToggleForm() {
      checklistState.formOpen = !checklistState.formOpen;
      window.checklistRender();
      if (checklistState.formOpen) {
        window.setTimeout(() => document.querySelector(".checklist-create-form input[name='title']")?.focus(), 0);
      }
    };

    window.checklistToggle = function checklistToggle(id) {
      const item = checklistState.items.find((current) => current.id === id);
      if (!item) return;
      item.status = item.status === "done" ? "todo" : "done";
      const saved = checklistSave();
      window.checklistRender();
      checklistMessage(saved ? "Stato aggiornato e salvato." : "Stato aggiornato per questa sessione.", "success");
      showToast(item.status === "done" ? "Attività completata" : "Attività riaperta");
    };

    window.checklistSetStatus = function checklistSetStatus(id, status) {
      const item = checklistState.items.find((current) => current.id === id);
      if (!item || !["todo", "in_progress", "done"].includes(status)) return;
      item.status = status;
      const saved = checklistSave();
      window.checklistRender();
      checklistMessage(saved ? "Stato aggiornato e salvato." : "Stato aggiornato per questa sessione.", "success");
    };

    window.checklistAdd = function checklistAdd(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const values = new FormData(form);
      const title = String(values.get("title") || "").trim().replace(/\s+/g, " ");
      if (title.length < 3) {
        checklistMessage("Inserisci almeno 3 caratteri.", "error");
        return;
      }
      if (checklistState.items.some((item) => item.title.toLocaleLowerCase("it") === title.toLocaleLowerCase("it"))) {
        checklistMessage("Esiste già un’attività con questo titolo.", "error");
        return;
      }
      const item = checklistNormalize({
        id: `checklist-${Date.now().toString(36)}`,
        title,
        category: "Personale",
        assignee: values.get("assignee"),
        priority: values.get("priority"),
        due: values.get("due"),
        status: "todo"
      });
      if (!item) {
        checklistMessage("I dati dell’attività non sono validi.", "error");
        return;
      }
      checklistState.items.unshift(item);
      checklistState.formOpen = false;
      const saved = checklistSave();
      window.checklistRender();
      checklistMessage(saved ? "Attività aggiunta e salvata." : "Attività aggiunta per questa sessione.", "success");
      showToast("Attività aggiunta");
    };

    window.checklistRemove = function checklistRemove(id) {
      const item = checklistState.items.find((current) => current.id === id);
      if (!item) return;
      if (!window.confirm(`Rimuovere “${item.title}”?`)) return;
      checklistState.items = checklistState.items.filter((current) => current.id !== id);
      const saved = checklistSave();
      window.checklistRender();
      checklistMessage(saved ? "Attività rimossa e salvataggio aggiornato." : "Attività rimossa per questa sessione.", "success");
      showToast("Attività rimossa");
    };

    const phaseOpenDrawerBefore = window.openDrawer || openDrawer;
    window.openDrawer = function phaseOpenDrawer(type) {
      if (type !== "checklist") return phaseOpenDrawerBefore(type);
      const title = document.getElementById("drawerTitle");
      const content = document.getElementById("drawerContent");
      const backdrop = document.getElementById("drawerBackdrop");
      if (!title || !content || !backdrop) return;
      title.textContent = "Checklist";
      content.innerHTML = window.buildChecklistDrawerHtml();
      backdrop.classList.remove("hidden");
      setEveContext("checklist");
    };

    document.documentElement.dataset.aulaDemoVersion = VERSION;
  })();

  

/* API usata dagli attributi interattivi della demo canonica. */
if (typeof activateExercise === "function") window.activateExercise = activateExercise;
if (typeof archiveActiveChat === "function") window.archiveActiveChat = archiveActiveChat;
if (typeof askEveContextualHelp === "function") window.askEveContextualHelp = askEveContextualHelp;
if (typeof assign === "function") window.assign = assign;
if (typeof aulaMaterialAddOpen === "function") window.aulaMaterialAddOpen = aulaMaterialAddOpen;
if (typeof aulaMaterialDiagnosticsOpen === "function") window.aulaMaterialDiagnosticsOpen = aulaMaterialDiagnosticsOpen;
if (typeof aulaMaterialImport === "function") window.aulaMaterialImport = aulaMaterialImport;
if (typeof aulaMaterialRetry === "function") window.aulaMaterialRetry = aulaMaterialRetry;
if (typeof aulaMaterialsPanelOpen === "function") window.aulaMaterialsPanelOpen = aulaMaterialsPanelOpen;
if (typeof aulaMaterialsPanelSelect === "function") window.aulaMaterialsPanelSelect = aulaMaterialsPanelSelect;
if (typeof aulaMaterialsPanelSetCourse === "function") window.aulaMaterialsPanelSetCourse = aulaMaterialsPanelSetCourse;
if (typeof aulaMaterialsPanelSetKind === "function") window.aulaMaterialsPanelSetKind = aulaMaterialsPanelSetKind;
if (typeof aulaMaterialsPanelSetQuery === "function") window.aulaMaterialsPanelSetQuery = aulaMaterialsPanelSetQuery;
if (typeof aulaPdfMove === "function") window.aulaPdfMove = aulaPdfMove;
if (typeof aulaPresentationMove === "function") window.aulaPresentationMove = aulaPresentationMove;
if (typeof aulaVideoSeek === "function") window.aulaVideoSeek = aulaVideoSeek;
if (typeof aulaVideoToggle === "function") window.aulaVideoToggle = aulaVideoToggle;
if (typeof autoSizeChatInput === "function") window.autoSizeChatInput = autoSizeChatInput;
if (typeof chatBackToList === "function") window.chatBackToList = chatBackToList;
if (typeof checklistAdd === "function") window.checklistAdd = checklistAdd;
if (typeof checklistRemove === "function") window.checklistRemove = checklistRemove;
if (typeof checklistSetAssignee === "function") window.checklistSetAssignee = checklistSetAssignee;
if (typeof checklistSetFilter === "function") window.checklistSetFilter = checklistSetFilter;
if (typeof checklistSetQuery === "function") window.checklistSetQuery = checklistSetQuery;
if (typeof checklistSetStatus === "function") window.checklistSetStatus = checklistSetStatus;
if (typeof checklistToggle === "function") window.checklistToggle = checklistToggle;
if (typeof checklistToggleForm === "function") window.checklistToggleForm = checklistToggleForm;
if (typeof closeDrawer === "function") window.closeDrawer = closeDrawer;
if (typeof closeDrawerFromBackdrop === "function") window.closeDrawerFromBackdrop = closeDrawerFromBackdrop;
if (typeof closeModal === "function") window.closeModal = closeModal;
if (typeof closeModalFromBackdrop === "function") window.closeModalFromBackdrop = closeModalFromBackdrop;
if (typeof completeCurrentSection === "function") window.completeCurrentSection = completeCurrentSection;
if (typeof createChatGroup === "function") window.createChatGroup = createChatGroup;
if (typeof createOrOpenPrivateChat === "function") window.createOrOpenPrivateChat = createOrOpenPrivateChat;
if (typeof finishActiveExercise === "function") window.finishActiveExercise = finishActiveExercise;
if (typeof finishExercise === "function") window.finishExercise = finishExercise;
if (typeof focusChatSearch === "function") window.focusChatSearch = focusChatSearch;
if (typeof getElementById === "function") window.getElementById = getElementById;
if (typeof giveActiveExerciseHint === "function") window.giveActiveExerciseHint = giveActiveExerciseHint;
if (typeof giveExerciseHint === "function") window.giveExerciseHint = giveExerciseHint;
if (typeof goToAdjacentExercise === "function") window.goToAdjacentExercise = goToAdjacentExercise;
if (typeof goToNextIncompleteExercise === "function") window.goToNextIncompleteExercise = goToNextIncompleteExercise;
if (typeof goToProgressGoal === "function") window.goToProgressGoal = goToProgressGoal;
if (typeof handleChatKey === "function") window.handleChatKey = handleChatKey;
if (typeof handleEveSuggestion === "function") window.handleEveSuggestion = handleEveSuggestion;
if (typeof insertChatEmoji === "function") window.insertChatEmoji = insertChatEmoji;
if (typeof minimizeActiveChat === "function") window.minimizeActiveChat = minimizeActiveChat;
if (typeof navigatePortal === "function") window.navigatePortal = navigatePortal;
if (typeof nextSection === "function") window.nextSection = nextSection;
if (typeof openChatConversation === "function") window.openChatConversation = openChatConversation;
if (typeof openDrawer === "function") window.openDrawer = openDrawer;
if (typeof openEvePanelFromMascot === "function") window.openEvePanelFromMascot = openEvePanelFromMascot;
if (typeof openModal === "function") window.openModal = openModal;
if (typeof portalDashboardOpenCatalogForRoom === "function") window.portalDashboardOpenCatalogForRoom = portalDashboardOpenCatalogForRoom;
if (typeof previewSelectedVoice === "function") window.previewSelectedVoice = previewSelectedVoice;
if (typeof previousSection === "function") window.previousSection = previousSection;
if (typeof reloadAudioVoices === "function") window.reloadAudioVoices = reloadAudioVoices;
if (typeof removeMinimizedChat === "function") window.removeMinimizedChat = removeMinimizedChat;
if (typeof resetDemo === "function") window.resetDemo = resetDemo;
if (typeof resetTimer === "function") window.resetTimer = resetTimer;
if (typeof restoreMinimizedChat === "function") window.restoreMinimizedChat = restoreMinimizedChat;
if (typeof saveNotes === "function") window.saveNotes = saveNotes;
if (typeof selectAudioPagesFromCurrent === "function") window.selectAudioPagesFromCurrent = selectAudioPagesFromCurrent;
if (typeof selectLesson === "function") window.selectLesson = selectLesson;
if (typeof selectQuiz === "function") window.selectQuiz = selectQuiz;
if (typeof sendChatAttachments === "function") window.sendChatAttachments = sendChatAttachments;
if (typeof sendChatMessage === "function") window.sendChatMessage = sendChatMessage;
if (typeof setAllAudioPages === "function") window.setAllAudioPages = setAllAudioPages;
if (typeof setChatFilter === "function") window.setChatFilter = setChatFilter;
if (typeof setChatSearch === "function") window.setChatSearch = setChatSearch;
if (typeof setGraphicsMode === "function") window.setGraphicsMode = setGraphicsMode;
if (typeof showToast === "function") window.showToast = showToast;
if (typeof skipAudioBlock === "function") window.skipAudioBlock = skipAudioBlock;
if (typeof speakActiveExercisePrompt === "function") window.speakActiveExercisePrompt = speakActiveExercisePrompt;
if (typeof speakExercisePrompt === "function") window.speakExercisePrompt = speakExercisePrompt;
if (typeof speakExerciseSelection === "function") window.speakExerciseSelection = speakExerciseSelection;
if (typeof speakExerciseSolution === "function") window.speakExerciseSolution = speakExerciseSolution;
if (typeof stopAudioLesson === "function") window.stopAudioLesson = stopAudioLesson;
if (typeof stopExerciseSpeech === "function") window.stopExerciseSpeech = stopExerciseSpeech;
if (typeof stopPropagation === "function") window.stopPropagation = stopPropagation;
if (typeof submitProject === "function") window.submitProject = submitProject;
if (typeof switchTimerMode === "function") window.switchTimerMode = switchTimerMode;
if (typeof switchView === "function") window.switchView = switchView;
if (typeof syncExerciseVoicePreferences === "function") window.syncExerciseVoicePreferences = syncExerciseVoicePreferences;
if (typeof toggleAudioLesson === "function") window.toggleAudioLesson = toggleAudioLesson;
if (typeof toggleAudioPageSelection === "function") window.toggleAudioPageSelection = toggleAudioPageSelection;
if (typeof toggleChatCreateSheet === "function") window.toggleChatCreateSheet = toggleChatCreateSheet;
if (typeof toggleChatInfo === "function") window.toggleChatInfo = toggleChatInfo;
if (typeof toggleDarkMode === "function") window.toggleDarkMode = toggleDarkMode;
if (typeof toggleEveAssistant === "function") window.toggleEveAssistant = toggleEveAssistant;
if (typeof toggleEveDetach === "function") window.toggleEveDetach = toggleEveDetach;
if (typeof toggleEvePanel === "function") window.toggleEvePanel = toggleEvePanel;
if (typeof toggleExerciseSpeech === "function") window.toggleExerciseSpeech = toggleExerciseSpeech;
if (typeof toggleFloating === "function") window.toggleFloating = toggleFloating;
if (typeof toggleModulesPanel === "function") window.toggleModulesPanel = toggleModulesPanel;
if (typeof toggleProgressMissions === "function") window.toggleProgressMissions = toggleProgressMissions;
if (typeof toggleTimer === "function") window.toggleTimer = toggleTimer;
if (typeof updateExerciseDraft === "function") window.updateExerciseDraft = updateExerciseDraft;

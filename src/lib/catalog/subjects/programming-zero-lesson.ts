export const PROGRAMMING_ZERO_PATH_ID = "programming-zero";
export const PROGRAMMING_LESSON_ID = "programming-0-1";
export const PROGRAMMING_LESSON_RESOURCE_ID = "9f219d2a-d532-4af2-bd97-5df8fc863101";
export const PROGRAMMING_LESSON_SOURCE_URL = "https://aula-studio-virtuale.vercel.app/internal/programming-0-1";

export interface LessonSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  example?: string;
  remember?: string;
}

export interface LessonQuizQuestion {
  id: string;
  concept: string;
  prompt: string;
  choices: string[];
  correctChoice: number;
  explanation: string;
  reviewSectionId: string;
}

export const programmingCurriculumOutline = [
  "Introduzione all’informatica e alla programmazione", "Preparazione dell’ambiente di sviluppo",
  "Primi programmi Python", "Variabili e tipi di dato", "Input, output e operatori", "Condizioni",
  "Cicli", "Funzioni", "Moduli e organizzazione del codice", "Stringhe", "Liste", "Tuple",
  "Dizionari", "Set", "File e persistenza", "Gestione degli errori",
  "Programmazione orientata agli oggetti", "Algoritmi fondamentali", "Ricorsione",
  "Debugging e testing", "Git e GitHub", "Database e SQL", "API e JSON",
  "Fondamenti del Web", "Sicurezza di base", "Progetto finale", "Specializzazioni",
] as const;

export const programmingLesson = {
  id: PROGRAMMING_LESSON_ID,
  pathId: PROGRAMMING_ZERO_PATH_ID,
  moduleId: "programming-module-0",
  title: "Che cosa significa programmare?",
  level: "Principiante assoluto",
  estimatedMinutes: 120,
  description: "Introduzione alla programmazione, agli algoritmi, ai programmi, ai processi, agli input e output e alle principali tecniche di risoluzione dei problemi.",
  objectives: [
    "Definire la programmazione con parole proprie", "Spiegare perché programmare non significa soltanto scrivere codice",
    "Riconoscere un’istruzione", "Distinguere programma, applicazione, script e processo",
    "Distinguere un algoritmo dalla sua implementazione", "Identificare input, elaborazione e output",
    "Riconoscere lo stato di un programma", "Distinguere sintassi e semantica",
    "Scomporre un problema complesso", "Riconoscere istruzioni ambigue", "Individuare casi limite",
    "Progettare un semplice algoritmo",
  ],
  sections: [
    {
      id: "fundamental-idea", title: "L’idea fondamentale",
      paragraphs: ["Programmare significa costruire una sequenza precisa di istruzioni che una macchina possa eseguire per ottenere un risultato.", "La macchina non comprende il significato commerciale di uno sconto come una persona: esegue le operazioni indicate."],
      bullets: ["Un obiettivo", "Dati iniziali", "Una procedura", "Un risultato"],
      example: "Prezzo 100 €, sconto 20%. Sconto = 100 × 20 / 100 = 20 €. Prezzo finale = 100 − 20 = 80 €.",
      remember: "Non chiediamo genericamente al computer di risolvere un problema: descriviamo la soluzione con precisione sufficiente.",
    },
    {
      id: "not-only-code", title: "Programmare non significa solo scrivere codice",
      paragraphs: ["Il codice è la parte visibile del programma, ma non è la prima fase del lavoro.", "Prima occorre comprendere il problema, individuare i dati, stabilire il risultato, dividere il problema, definire le regole, considerare errori e verificare la soluzione."],
      example: "Per un evento: chiedi l’età, verifica che sia un numero, consenti l’accesso se è almeno 18, altrimenti negalo.",
      remember: "La programmazione trasforma un’idea generica in una procedura eseguibile.",
    },
    {
      id: "instruction", title: "Che cos’è un’istruzione?",
      paragraphs: ["Un’istruzione è un comando elementare che il computer può eseguire.", "Normalmente le istruzioni vengono eseguite nell’ordine in cui sono scritte; cambiarne l’ordine può cambiare il risultato."],
      bullets: ["Mostrare o leggere un valore", "Sommare o confrontare dati", "Salvare un dato", "Ripetere un’operazione", "Aprire un file"],
      example: "nome = \"Andrea\"\nprint(nome)\n\nLa prima istruzione associa un valore; la seconda lo mostra.",
    },
    {
      id: "program", title: "Che cos’è un programma?",
      paragraphs: ["Un programma è un insieme organizzato di istruzioni e dati progettati per svolgere uno o più compiti.", "Un’applicazione offre funzioni direttamente all’utente; uno script automatizza in genere un compito piccolo; il sistema operativo gestisce hardware, file, processi e applicazioni."],
      example: "print(2 + 3) è un programma minimo. Browser, videogiochi e sistemi bancari sono programmi molto più grandi.",
    },
    {
      id: "program-process", title: "Programma e processo",
      paragraphs: ["Un programma sul disco è simile a una ricetta scritta: contiene istruzioni, ma non sta lavorando.", "Quando viene avviato, il sistema operativo crea un processo: un’istanza del programma durante l’esecuzione. Lo stesso programma può generare più processi."],
      example: "Programma memorizzato → avvio → processo in esecuzione.",
    },
    {
      id: "ambiguity", title: "Il computer non comprende le intenzioni",
      paragraphs: ["Le persone completano istruzioni incomplete usando esperienza e contesto; il computer segue regole formali.", "Programmare significa anche prevedere ciò che potrebbe andare storto."],
      bullets: ["Quali dati usare?", "In quale ordine?", "Come gestire duplicati o input vuoti?", "Dove mettere il risultato?"],
      example: "Prima di dividere A per B, controlla se B è zero; in quel caso mostra un errore.",
    },
    {
      id: "algorithm", title: "Che cos’è un algoritmo?",
      paragraphs: ["Un algoritmo è una procedura ordinata e finita che trasforma dati iniziali in un risultato.", "L’algoritmo è la soluzione logica; il programma è la sua implementazione in un linguaggio. Lo stesso algoritmo può essere scritto in Python, JavaScript o Java."],
      example: "Per trovare il maggiore tra A e B: confrontali; mostra il maggiore oppure segnala che sono uguali.",
    },
    {
      id: "algorithm-properties", title: "Proprietà di un algoritmo",
      paragraphs: ["Un buon algoritmo deve essere finito, preciso, efficace e corretto, con input e output definiti."],
      bullets: ["Finitezza: deve terminare", "Precisione: ogni passo è chiaro", "Input e output definiti", "Efficacia: ogni passo è eseguibile", "Correttezza: produce il risultato previsto per ogni input valido"],
      example: "“Sistema i dati” è ambiguo; “ordina i numeri in ordine crescente” è più preciso.",
    },
    {
      id: "input-processing-output", title: "Input, elaborazione e output",
      paragraphs: ["Molti programmi seguono il modello Input → Elaborazione → Output.", "Gli input arrivano da tastiera, mouse, file, database, sensori, rete o altri programmi. L’elaborazione calcola, confronta, trasforma, ordina o verifica. L’output può essere testo, immagine, suono, file, messaggio o valore."],
      example: "Meteo: posizione e dati sono input; selezione e conversione sono elaborazione; previsione e temperatura sono output.",
    },
    {
      id: "state", title: "Stato e memoria",
      paragraphs: ["Molti programmi devono ricordare informazioni durante l’esecuzione: queste informazioni rappresentano lo stato corrente.", "Le variabili, studiate più avanti, permettono di rappresentare e modificare lo stato."],
      example: "Punteggio 100; moneta raccolta +10; nuovo stato del punteggio 110.",
    },
    {
      id: "data-instructions", title: "Dati e istruzioni",
      paragraphs: ["Un programma usa principalmente dati e istruzioni. I valori rappresentano i dati; assegnazioni e operazioni sono istruzioni."],
      example: "prezzo = 100\nsconto = 20\nprezzo_finale = prezzo - prezzo * sconto / 100",
    },
    {
      id: "languages", title: "Linguaggi di programmazione",
      paragraphs: ["Un linguaggio di programmazione è un sistema formale per descrivere dati e istruzioni. Possiede sintassi, semantica, parole riservate, simboli e regole.", "La sintassi stabilisce la forma corretta; la semantica riguarda il significato. Codice sintatticamente valido può comunque produrre il risultato sbagliato."],
      example: "In Python print(\"Ciao\") è sintassi valida; mostra \"Ciao\" non lo è.",
    },
    {
      id: "different-languages", title: "Perché esistono diversi linguaggi?",
      paragraphs: ["I linguaggi privilegiano priorità diverse. Non esiste un linguaggio migliore in assoluto.", "Python è scelto come primo linguaggio perché la sintassi leggibile lascia spazio ai concetti fondamentali."],
      bullets: ["Python: automazione, dati, web e AI", "JavaScript: interattività web", "C: sistemi vicini all’hardware", "C++: prestazioni e videogiochi", "Java: applicazioni aziendali", "SQL: database"],
    },
    {
      id: "problem-to-program", title: "Dal problema al programma",
      paragraphs: ["Il codice arriva dopo l’analisi e la progettazione, ed è seguito da esecuzione, verifica, correzione e miglioramento."],
      bullets: ["Comprendi il problema", "Definisci input e output", "Progetta l’algoritmo", "Scrivi il codice", "Esegui", "Verifica", "Correggi", "Migliora"],
      example: "Per la media di tre voti: input tre numeri; elaborazione somma e divisione per tre; output la media.",
    },
    {
      id: "decomposition", title: "Decomposizione",
      paragraphs: ["La decomposizione divide un problema complesso in parti più piccole, affrontabili e verificabili."],
      example: "Una biblioteca si divide in: aggiungere e cercare libri, prestiti, restituzioni, disponibilità, salvataggio e utenti.",
    },
    {
      id: "abstraction", title: "Astrazione",
      paragraphs: ["L’astrazione concentra l’attenzione sugli aspetti importanti e ignora temporaneamente dettagli non necessari.", "Funzioni, moduli, oggetti e librerie sono forme di astrazione."],
      example: "Per usare una calcolatrice servono dati, operazione e risultato; non occorre conoscere i circuiti interni.",
    },
    {
      id: "generalization", title: "Generalizzazione",
      paragraphs: ["Una soluzione generale funziona in più situazioni ed è riutilizzabile."],
      example: "Calcolare soltanto 8 + 5 è specifico; ricevere due numeri e un’operazione è generale.",
    },
    {
      id: "edge-cases", title: "Correttezza e casi limite",
      paragraphs: ["Un programma non va provato soltanto con dati semplici. I casi limite sono situazioni particolari che possono rivelare errori."],
      bullets: ["Nessun valore", "Testo al posto di numeri", "Valori negativi", "Valori massimi", "Decimali", "Dati mancanti"],
    },
    {
      id: "efficiency", title: "Efficienza",
      paragraphs: ["Due programmi possono produrre lo stesso risultato usando quantità diverse di tempo e memoria."],
      bullets: ["1. Correttezza", "2. Chiarezza", "3. Semplicità", "4. Efficienza"],
      remember: "Evita ottimizzazioni premature che rendono la soluzione meno comprensibile.",
    },
    {
      id: "code-to-cpu", title: "Dal codice alla CPU",
      paragraphs: ["Il codice Python non è direttamente il linguaggio nativo del processore. L’interprete traduce ed esegue le istruzioni secondo un modello che approfondiremo più avanti."],
      example: "Codice Python → interprete Python → istruzioni eseguibili → CPU.",
    },
    {
      id: "pseudocode", title: "Primo esempio di pseudocodice",
      paragraphs: ["Lo pseudocodice descrive la logica senza richiedere la conoscenza completa di Python."],
      example: "LEGGI numero\nSE il resto della divisione per 2 è zero\n  MOSTRA \"Pari\"\nALTRIMENTI\n  MOSTRA \"Dispari\"",
    },
    {
      id: "misconceptions", title: "Errori mentali comuni",
      paragraphs: ["Non devi imparare tutto a memoria: servono comprensione, pratica e documentazione.", "Non serve matematica avanzata per iniziare. Un programma che funziona una volta non è necessariamente corretto. Il computer non completa le intenzioni. Gli errori non indicano mancanza di talento: individuarli e correggerli è debugging."],
    },
  ] satisfies LessonSection[],
  glossary: [
    ["Programmazione", "Processo di progettazione e realizzazione di istruzioni eseguibili."],
    ["Istruzione", "Comando elementare eseguibile."], ["Programma", "Insieme organizzato di dati e istruzioni."],
    ["Applicazione", "Programma rivolto direttamente all’utente."], ["Script", "Programma piccolo usato per automatizzare un compito."],
    ["Processo", "Programma durante l’esecuzione."], ["Algoritmo", "Procedura ordinata e finita che trasforma input in output."],
    ["Input", "Dati ricevuti."], ["Elaborazione", "Operazioni applicate ai dati."], ["Output", "Risultato prodotto."],
    ["Stato", "Informazioni correnti conservate dal programma."], ["Sintassi", "Regole della forma corretta del codice."],
    ["Semantica", "Significato delle istruzioni."], ["Decomposizione", "Divisione di un problema in parti più piccole."],
    ["Astrazione", "Rappresentazione degli aspetti essenziali ignorando dettagli non necessari."],
    ["Generalizzazione", "Creazione di una soluzione applicabile a più casi."], ["Caso limite", "Situazione particolare che può rivelare errori."],
  ],
  guidedExercise: {
    id: "vending-machine", title: "Progettazione di un distributore di bevande",
    prompt: "Progetta la procedura che riceve una bevanda e il denaro e produce bevanda, resto o un messaggio di errore.",
    hints: ["Definisci scelta, denaro, prezzo e disponibilità", "Controlla scelta e disponibilità prima del pagamento", "Gestisci importi non validi o insufficienti", "Calcola resto e aggiorna disponibilità"],
    requiredCases: ["Bevanda esaurita", "Scelta inesistente", "Denaro insufficiente", "Importo negativo", "Valore non numerico", "Errore di erogazione", "Resto non disponibile"],
  },
  exercises: [
    { id: "app-analysis", title: "Analisi di un’app", prompt: "Scegli un’app e identifica almeno tre input, tre elaborazioni, tre output e tre informazioni di stato." },
    { id: "remove-ambiguity", title: "Eliminare le ambiguità", prompt: "Scrivi un algoritmo per preparare un panino; trova almeno cinque istruzioni ambigue e rendile precise." },
    { id: "ticket-edge-cases", title: "Casi limite", prompt: "Progetta il calcolo del prezzo di un biglietto in base all’età ed elenca almeno cinque situazioni particolari." },
    { id: "study-app-decomposition", title: "Decomposizione", prompt: "Dividi ‘creare un’app per organizzare lo studio’ in almeno dieci funzioni più piccole." },
    { id: "camera-ipo", title: "Input, elaborazione e output", prompt: "Analizza una fotocamera digitale descrivendo input, elaborazione, output e stato." },
  ],
  quiz: [
    { id: "algorithm-program", concept: "algoritmo", prompt: "Qual è la differenza tra algoritmo e programma?", choices: ["L’algoritmo è la procedura logica; il programma è la sua implementazione", "Sono sinonimi", "Il programma è sempre più piccolo", "L’algoritmo è un processo in esecuzione"], correctChoice: 0, explanation: "L’algoritmo descrive la soluzione; il programma la esprime in un linguaggio eseguibile.", reviewSectionId: "algorithm" },
    { id: "program-process", concept: "processo", prompt: "Qual è la differenza tra programma e processo?", choices: ["Il processo è solo il codice sorgente", "Il programma è memorizzato; il processo è il programma in esecuzione", "Il programma usa memoria, il processo no", "Non c’è differenza"], correctChoice: 1, explanation: "Il processo nasce quando il sistema operativo avvia un’istanza del programma.", reviewSectionId: "program-process" },
    { id: "ambiguity", concept: "precisione", prompt: "Perché il computer non può affidarsi a istruzioni ambigue?", choices: ["Perché non sa leggere", "Perché sceglie casualmente", "Perché segue regole formali e non completa le intenzioni", "Perché usa solo numeri"], correctChoice: 2, explanation: "Una macchina esegue quanto specificato, senza ricostruire automaticamente il contesto umano.", reviewSectionId: "ambiguity" },
    { id: "ipo", concept: "input-output", prompt: "Che cosa rappresentano input, elaborazione e output?", choices: ["Hardware, software e rete", "Dati ricevuti, operazioni eseguite e risultati prodotti", "Tre linguaggi", "Tre tipi di errore"], correctChoice: 1, explanation: "È il modello base del flusso di molti programmi.", reviewSectionId: "input-processing-output" },
    { id: "decomposition", concept: "decomposizione", prompt: "Che cosa significa scomporre un problema?", choices: ["Cancellarlo", "Renderlo più veloce", "Dividere un problema complesso in parti più semplici", "Tradurlo in inglese"], correctChoice: 2, explanation: "Parti più piccole sono più facili da progettare, verificare e correggere.", reviewSectionId: "decomposition" },
    { id: "edge-cases", concept: "casi limite", prompt: "Perché bisogna controllare i casi limite?", choices: ["Per accorciare il codice", "Per verificare il comportamento nelle situazioni particolari", "Per evitare ogni test", "Per scegliere il linguaggio"], correctChoice: 1, explanation: "Input vuoti, estremi o non validi spesso rivelano difetti nascosti.", reviewSectionId: "edge-cases" },
    { id: "syntax-semantics", concept: "sintassi e semantica", prompt: "Qual è la differenza tra sintassi e semantica?", choices: ["La sintassi riguarda la forma; la semantica il significato", "La sintassi riguarda l’hardware", "La semantica riguarda solo Python", "Sono la stessa cosa"], correctChoice: 0, explanation: "Codice formalmente valido può ancora avere un significato diverso da quello desiderato.", reviewSectionId: "languages" },
    { id: "languages", concept: "linguaggi", prompt: "Perché esistono diversi linguaggi di programmazione?", choices: ["Perché uno solo non può usare numeri", "Perché privilegiano obiettivi e settori diversi", "Solo per motivi estetici", "Perché ogni computer ne accetta uno"], correctChoice: 1, explanation: "Leggibilità, prestazioni, web, database e vicinanza all’hardware richiedono compromessi differenti.", reviewSectionId: "different-languages" },
    { id: "state", concept: "stato", prompt: "Che cosa rappresenta lo stato di un programma?", choices: ["Il paese in cui è stato scritto", "Le informazioni correnti conservate dal programma", "Il suo linguaggio", "Il file sul disco"], correctChoice: 1, explanation: "Punteggio, posizione, utente corrente o elementi salvati sono esempi di stato.", reviewSectionId: "state" },
    { id: "code-last", concept: "progettazione", prompt: "Perché il codice non è la prima fase della programmazione?", choices: ["Perché è facoltativo", "Perché prima bisogna comprendere il problema e progettare una soluzione", "Perché si scrive solo alla fine del corso", "Perché lo genera sempre il computer"], correctChoice: 1, explanation: "Analisi, input/output, regole, casi limite e algoritmo precedono l’implementazione.", reviewSectionId: "not-only-code" },
  ] satisfies LessonQuizQuestion[],
  project: {
    id: "study-assistant", title: "Progetta un assistente per lo studio",
    prompt: "Senza scrivere codice, progetta un programma che chieda materia e tempo, registri argomenti, proponga una pausa, registri i completamenti e mostri un riepilogo.",
    deliverables: ["Descrizione dell’obiettivo", "Elenco degli input", "Elenco degli output", "Algoritmo di almeno 20 passaggi", "Almeno 5 casi limite", "Decomposizione in funzioni", "Esempio completo di utilizzo"],
    criteria: ["Precisione", "Assenza di ambiguità", "Correttezza di input e output", "Gestione dei casi limite", "Ordine logico", "Qualità della decomposizione", "Completezza"],
  },
  completion: { minimumQuizScore: 70, requiredExerciseIds: ["app-analysis", "remove-ambiguity", "ticket-edge-cases", "study-app-decomposition", "camera-ipo"], requiresGuidedExercise: true, requiresProject: true, requiresSelfAssessment: true },
  summary: ["Programmare significa risolvere problemi con istruzioni precise", "Il codice è soltanto una parte del processo", "Un programma contiene dati e istruzioni; un processo è un programma in esecuzione", "Un algoritmo descrive una procedura", "Molti programmi seguono Input → Elaborazione → Output", "Lo stato rappresenta le informazioni correnti", "Un linguaggio possiede sintassi e semantica", "I problemi complessi si scompongono", "Casi limite ed errori vanno previsti", "Chiarezza e correttezza precedono l’ottimizzazione"],
} as const;

export type ProgrammingLesson = typeof programmingLesson;

export function publicProgrammingLesson() {
  return {
    ...programmingLesson,
    quiz: programmingLesson.quiz.map((question) => ({
      id: question.id, concept: question.concept, prompt: question.prompt,
      choices: question.choices, explanation: question.explanation, reviewSectionId: question.reviewSectionId,
    })),
  };
}

export function findQuizQuestion(questionId: string) {
  return programmingLesson.quiz.find((question) => question.id === questionId) ?? null;
}

import officialContent from "./programming-zero-official-content.json";
import lesson03Content from "./programming-zero-lesson-0-3-official-content.json";
import lesson04Content from "./programming-zero-lesson-0-4-official-content.json";
import lesson05Content from "./programming-zero-lesson-0-5-official-content.json";
import lesson06Content from "./programming-zero-lesson-0-6-official-content.json";
import lesson07Content from "./programming-zero-lesson-0-7-official-content.json";
import lesson08Content from "./programming-zero-lesson-0-8-official-content.json";
import lesson09Content from "./programming-zero-lesson-0-9-official-content.json";
import lesson11Content from "./programming-zero-lesson-1-1-official-content.json";
import lesson12Content from "./programming-zero-lesson-1-2-official-content.json";
import lesson13Content from "./programming-zero-lesson-1-3-official-content.json";
import lesson14Content from "./programming-zero-lesson-1-4-official-content.json";
import lesson15Content from "./programming-zero-lesson-1-5-official-content.json";
import lesson16Content from "./programming-zero-lesson-1-6-official-content.json";
import lesson17Content from "./programming-zero-lesson-1-7-official-content.json";
import lesson18Content from "./programming-zero-lesson-1-8-official-content.json";
import lesson19Content from "./programming-zero-lesson-1-9-official-content.json";
import lesson21Content from "./programming-zero-lesson-2-1-official-content.json";
import lesson22Content from "./programming-zero-lesson-2-2-official-content.json";
import lesson23Content from "./programming-zero-lesson-2-3-official-content.json";

export const PROGRAMMING_ZERO_PATH_ID = "programming-zero";
// The existing native material keeps its identifier so rooms and saved progress remain connected.
export const PROGRAMMING_LESSON_ID = "programming-0-1";
export const PROGRAMMING_LESSON_RESOURCE_ID = "9f219d2a-d532-4af2-bd97-5df8fc863101";
export const PROGRAMMING_LESSON_SOURCE_URL = "https://aula-studio-virtuale.vercel.app/internal/programming-0-1";

export interface LessonContentBlock {
  type: "paragraph" | "heading" | "list-item" | "callout" | "diagram" | "table";
  text?: string;
  rows?: string[][];
}

export interface LessonSection {
  id: string;
  lessonId: string;
  chapterNumber: number;
  title: string;
  blocks: LessonContentBlock[];
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

interface OfficialExercise {
  id: string;
  kind: string;
  lessonId: string;
  chapterNumber: number;
  title: string;
  prompt: string;
  autoverification?: string;
}

const officialLessons = [...officialContent.lessons, lesson03Content, lesson04Content, lesson05Content, lesson06Content, lesson07Content, lesson08Content, lesson09Content, lesson11Content, lesson12Content, lesson13Content, lesson14Content, lesson15Content, lesson16Content, lesson17Content, lesson18Content, lesson19Content, lesson21Content, lesson22Content, lesson23Content];
const chapters = officialLessons.flatMap((lesson) => lesson.chapters);
const allExercises = chapters.flatMap((chapter) => [chapter.exercises.guided, ...chapter.exercises.autonomous]);
const [firstGuidedExercise, ...remainingExercises] = allExercises;
const finalAssessments = officialLessons.map((lesson) => lesson.finalAssessment);
const moduleNumbers = [...new Set(officialLessons.map((lesson) => lesson.id.split(".")[0] ?? "0"))];
const programmingModules = moduleNumbers.map((moduleNumber) => ({
  id: `programming-module-${moduleNumber}`,
  title: `Modulo ${moduleNumber}`,
  lessons: officialLessons
    .filter((lesson) => lesson.id.split(".")[0] === moduleNumber)
    .map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.summary[0],
      sectionIds: lesson.sections.map((section) => section.id),
      exerciseIds: lesson.chapters.flatMap((chapter) => [chapter.exercises.guided.id, ...chapter.exercises.autonomous.map((exercise) => exercise.id)]),
      quizIds: lesson.chapters.flatMap((chapter) => chapter.quiz.map((question) => question.id)),
      glossary: lesson.glossary,
      summary: lesson.summary,
      objectives: lesson.objectives,
    })),
}));

export const programmingPythonProjects = [
  {
    id: "programming-zero-python-project-0-1",
    lessonId: "0.1",
    title: "Il mio primo messaggio",
    difficulty: "Primi passi",
    goal: "Capire che un programma contiene dati e istruzioni che producono un risultato osservabile.",
    concepts: ["variabili", "testo", "numeri", "print"],
    instructions: [
      "Esegui una prima volta il codice già pronto.",
      "Sostituisci nome e obiettivo con informazioni tue.",
      "Cambia il numero di ore settimanali e aggiungi una quarta riga stampata dal programma.",
    ],
    starterCode: `nome = "Studente"
obiettivo = "imparare a programmare"
ore_settimanali = 3

print("Ciao, mi chiamo", nome)
print("Il mio obiettivo è", obiettivo)
print("Studierò", ore_settimanali, "ore alla settimana")`,
    expectedResult: "Il programma deve mostrare almeno tre righe personalizzate.",
  },
  {
    id: "programming-zero-python-project-0-2",
    lessonId: "0.2",
    title: "Carta d’identità del computer",
    difficulty: "Base",
    goal: "Rappresentare alcune caratteristiche di un computer e prendere una decisione semplice usando una condizione.",
    concepts: ["variabili", "numeri", "confronto", "if/else"],
    instructions: [
      "Personalizza i dati del dispositivo, della RAM e dello spazio libero.",
      "Esegui il programma e osserva quale messaggio sceglie la condizione.",
      "Prova uno spazio libero inferiore a 20 GB e verifica che il risultato cambi.",
    ],
    starterCode: `dispositivo = "computer portatile"
memoria_ram_gb = 8
spazio_libero_gb = 120

print("Dispositivo:", dispositivo)
print("RAM:", memoria_ram_gb, "GB")
print("Spazio libero:", spazio_libero_gb, "GB")

if spazio_libero_gb >= 20:
    print("Stato: spazio sufficiente")
else:
    print("Stato: serve liberare spazio")`,
    expectedResult: "Il programma deve descrivere il dispositivo e mostrare uno dei due possibili stati.",
  },
  {
    id: "programming-zero-python-project-0-3",
    lessonId: "0.3",
    title: "Quanto spazio occupano i miei dati?",
    difficulty: "Base con calcolo",
    goal: "Usare numeri e operazioni per stimare la dimensione di un insieme di contenuti digitali.",
    concepts: ["dati digitali", "unità decimali MB/GB", "moltiplicazione", "divisione", "round"],
    instructions: [
      "Scegli un numero realistico di fotografie e la dimensione media di ciascuna.",
      "Esegui il calcolo usando unità decimali: 1 GB corrisponde a 1000 MB.",
      "Aggiungi una stampa che spieghi con parole tue che cosa rappresenta il risultato.",
    ],
    starterCode: `numero_foto = 120
dimensione_foto_mb = 4

totale_mb = numero_foto * dimensione_foto_mb
totale_gb = totale_mb / 1000

print("Numero di fotografie:", numero_foto)
print("Spazio totale in MB:", totale_mb)
print("Spazio totale in GB:", round(totale_gb, 2))`,
    expectedResult: "Il programma deve mostrare quantità, megabyte totali e gigabyte decimali arrotondati.",
  },
  {
    id: "programming-zero-python-project-0-4",
    lessonId: "0.4",
    title: "Una regola di accesso verificabile",
    difficulty: "Base con logica booleana",
    goal: "Tradurre una regola in condizioni verificabili e controllarne i confini con AND, OR e NOT.",
    concepts: ["booleani", "confronti", "AND", "OR", "NOT", "if/else"],
    instructions: [
      "Esegui il codice e osserva i valori delle singole condizioni e la decisione finale.",
      "Prova prima età 17 e poi età 18 per verificare il confine della maggiore età.",
      "Imposta account_attivo su False e controlla che NOT segnali il blocco e che l'accesso venga negato.",
      "Modifica consenso_tutore e spiega, con una nuova riga stampata, perché il risultato cambia oppure resta invariato.",
    ],
    starterCode: `eta = 17
consenso_tutore = True
account_attivo = True

maggiorenne = eta >= 18
autorizzato = maggiorenne or consenso_tutore
account_bloccato = not account_attivo
accesso_consentito = account_attivo and autorizzato

print("Maggiorenne:", maggiorenne)
print("Autorizzato:", autorizzato)
print("Account bloccato:", account_bloccato)

if accesso_consentito:
    print("Risultato: accesso consentito")
else:
    print("Risultato: accesso negato")`,
    expectedResult: "Il programma deve mostrare le condizioni booleane e concedere o negare l'accesso in modo coerente con i valori scelti.",
  },
  {
    id: "programming-zero-python-project-0-5",
    lessonId: "0.5",
    title: "Dall’algoritmo al primo programma",
    difficulty: "Base con progettazione",
    goal: "Partire da input, risultato atteso e passaggi ordinati per tradurre un piccolo algoritmo in Python.",
    concepts: ["input e output", "sequenza", "selezione", "traccia", "criterio di successo"],
    instructions: [
      "Individua nel codice gli input, i passaggi di calcolo e gli output prima di eseguirlo.",
      "Prevedi su carta il risultato con 180 minuti e 3 lezioni, quindi verifica la previsione eseguendo il programma.",
      "Prova 90 minuti e 4 lezioni e controlla quale ramo della selezione viene eseguito.",
      "Prova 0 lezioni e verifica che la precondizione impedisca la divisione; poi aggiungi una riga che dichiari il criterio di successo: almeno 45 minuti per lezione.",
    ],
    starterCode: `minuti_disponibili = 180
lezioni_da_studiare = 3

print("Input - minuti disponibili:", minuti_disponibili)
print("Input - lezioni da studiare:", lezioni_da_studiare)

if lezioni_da_studiare > 0:
    minuti_per_lezione = minuti_disponibili / lezioni_da_studiare
    print("Output - minuti per lezione:", round(minuti_per_lezione, 1))
    if minuti_per_lezione >= 45:
        print("Piano sostenibile")
    else:
        print("Riduci le lezioni o aumenta il tempo")
else:
    print("Errore: il numero di lezioni deve essere maggiore di zero")`,
    expectedResult: "Il programma deve rendere visibili input, calcolo, output e decisione finale dell'algoritmo.",
  },
  {
    id: "programming-zero-python-project-0-6",
    lessonId: "0.6",
    title: "Dal requisito al comportamento verificabile",
    difficulty: "Base con requisiti e test",
    goal: "Tradurre un requisito di annullamento in precondizioni, cambiamento di stato, risultato osservabile e casi di test.",
    concepts: ["requisiti", "precondizioni", "stati", "decisione", "casi di test", "tracciabilità"],
    instructions: [
      "Individua nel codice gli input, le precondizioni e il cambiamento di stato prima di eseguirlo.",
      "Verifica il caso normale con prenotazione confermata, 30 ore disponibili e utente autorizzato.",
      "Prova il valore di confine con 24 ore e poi con 23 ore: osserva quale requisito cambia il risultato.",
      "Prova una prenotazione già annullata oppure un utente non autorizzato e aggiungi una riga che spieghi quale precondizione non è soddisfatta.",
    ],
    starterCode: `stato_prenotazione = "confermata"
ore_alla_partenza = 30
utente_autorizzato = True

stato_valido = stato_prenotazione == "confermata"
entro_limite = ore_alla_partenza >= 24
puo_annullare = utente_autorizzato and stato_valido and entro_limite

print("Stato iniziale:", stato_prenotazione)
print("Ore alla partenza:", ore_alla_partenza)
print("Utente autorizzato:", utente_autorizzato)
print("Requisito soddisfatto:", puo_annullare)

if puo_annullare:
    stato_finale = "annullata"
    print("Esito: prenotazione annullata")
else:
    stato_finale = stato_prenotazione
    print("Esito: annullamento rifiutato")

print("Stato finale:", stato_finale)`,
    expectedResult: "Il programma deve mostrare dati iniziali, valutazione del requisito, esito e stato finale, distinguendo il caso valido, il confine e i casi rifiutati.",
  },
  {
    id: "programming-zero-python-project-0-7",
    lessonId: "0.7",
    title: "Un primato con criteri espliciti",
    difficulty: "Base con confronto storico",
    goal: "Trasformare il confronto fra due attribuzioni di primato in criteri separati, evitando di scegliere un vincitore assoluto.",
    concepts: ["criteri", "confronti", "ordine", "primato qualificato", "fatti e interpretazioni"],
    instructions: [
      "Leggi i quattro criteri: idea, prototipo, uso e diffusione. Un numero più piccolo indica una precedenza per quel solo criterio.",
      "Esegui il programma e osserva perché i due candidati possono risultare primi secondo criteri differenti.",
      "Cambia un valore di ordine e verifica quale affermazione di primato viene modificata, senza alterare gli altri criteri.",
      "Imposta due ordini uguali e verifica che il programma segnali una parità invece di attribuire il primato a uno dei candidati.",
      "Sostituisci i nomi generici e gli ordini con due casi studiati nella lezione, usando soltanto fatti documentati e mantenendo separati idea, prototipo, uso e diffusione.",
    ],
    starterCode: `candidato_a = "Tecnologia A"
candidato_b = "Tecnologia B"

ordine_idea_a = 1
ordine_idea_b = 2
ordine_prototipo_a = 1
ordine_prototipo_b = 2
ordine_uso_a = 2
ordine_uso_b = 1
ordine_diffusione_a = 2
ordine_diffusione_b = 1

print("Confronto tra", candidato_a, "e", candidato_b)

if ordine_idea_a < ordine_idea_b:
    print("Primato secondo l'idea:", candidato_a)
elif ordine_idea_b < ordine_idea_a:
    print("Primato secondo l'idea:", candidato_b)
else:
    print("Parità secondo l'idea")

if ordine_prototipo_a < ordine_prototipo_b:
    print("Primato secondo il prototipo:", candidato_a)
elif ordine_prototipo_b < ordine_prototipo_a:
    print("Primato secondo il prototipo:", candidato_b)
else:
    print("Parità secondo il prototipo")

if ordine_uso_a < ordine_uso_b:
    print("Primato secondo l'uso:", candidato_a)
elif ordine_uso_b < ordine_uso_a:
    print("Primato secondo l'uso:", candidato_b)
else:
    print("Parità secondo l'uso")

if ordine_diffusione_a < ordine_diffusione_b:
    print("Primato secondo la diffusione:", candidato_a)
elif ordine_diffusione_b < ordine_diffusione_a:
    print("Primato secondo la diffusione:", candidato_b)
else:
    print("Parità secondo la diffusione")

print("Conclusione: il primato dipende dal criterio dichiarato")`,
    expectedResult: "Il programma deve produrre quattro confronti qualificati, gestire anche le parità e mostrare che idea, prototipo, uso e diffusione possono indicare candidati diversi.",
  },
  {
    id: "programming-zero-python-project-0-8",
    lessonId: "0.8",
    title: "La media non racconta tutto",
    difficulty: "Base con percentuali ed equità",
    goal: "Confrontare due tipi di errore nei risultati globali e per gruppo, rendendo visibili differenze che la sola media può nascondere.",
    concepts: ["falsi positivi", "falsi negativi", "percentuali", "risultati per gruppo", "equità"],
    instructions: [
      "Individua per ciascun gruppo il numero di casi, i falsi positivi e i falsi negativi prima di eseguire il programma.",
      "Confronta il tasso globale con i tassi separati dei due gruppi e descrivi quale informazione andrebbe persa mostrando soltanto la media.",
      "Modifica uno dei due tipi di errore del gruppo B e verifica quali percentuali cambiano e quali restano invariate.",
      "Imposta dati che producano lo stesso tasso complessivo nei due gruppi e verifica che il programma segnali la parità.",
      "Aggiungi una riga stampata che proponga una verifica o una correzione su dati, obiettivo, processo oppure ricorso, come richiesto dall’esercizio ufficiale.",
    ],
    starterCode: `casi_gruppo_a = 100
falsi_positivi_a = 8
falsi_negativi_a = 4

casi_gruppo_b = 100
falsi_positivi_b = 3
falsi_negativi_b = 2

errori_a = falsi_positivi_a + falsi_negativi_a
errori_b = falsi_positivi_b + falsi_negativi_b

tasso_fp_a = falsi_positivi_a / casi_gruppo_a * 100
tasso_fn_a = falsi_negativi_a / casi_gruppo_a * 100
tasso_errori_a = errori_a / casi_gruppo_a * 100

tasso_fp_b = falsi_positivi_b / casi_gruppo_b * 100
tasso_fn_b = falsi_negativi_b / casi_gruppo_b * 100
tasso_errori_b = errori_b / casi_gruppo_b * 100

casi_totali = casi_gruppo_a + casi_gruppo_b
errori_totali = errori_a + errori_b
tasso_globale = errori_totali / casi_totali * 100

print("Tasso globale di errore:", round(tasso_globale, 1), "%")
print("Gruppo A - falsi positivi:", round(tasso_fp_a, 1), "%")
print("Gruppo A - falsi negativi:", round(tasso_fn_a, 1), "%")
print("Gruppo A - errori totali:", round(tasso_errori_a, 1), "%")
print("Gruppo B - falsi positivi:", round(tasso_fp_b, 1), "%")
print("Gruppo B - falsi negativi:", round(tasso_fn_b, 1), "%")
print("Gruppo B - errori totali:", round(tasso_errori_b, 1), "%")

if tasso_errori_a > tasso_errori_b:
    print("Attenzione: il gruppo A presenta il tasso di errore maggiore")
elif tasso_errori_b > tasso_errori_a:
    print("Attenzione: il gruppo B presenta il tasso di errore maggiore")
else:
    print("I due gruppi presentano lo stesso tasso complessivo di errore")`,
    expectedResult: "Il programma deve mostrare il tasso globale, i due tipi di errore per ciascun gruppo e segnalare quale gruppo presenta il tasso complessivo maggiore oppure se i tassi sono uguali.",
  },
  {
    id: "programming-zero-python-project-0-9",
    lessonId: "0.9",
    title: "Profilo di padronanza, non solo media",
    difficulty: "Verifica finale guidata",
    goal: "Calcolare il risultato complessivo e il profilo per dimensione, individuando le lacune che richiedono recupero anche quando la soglia totale è superata.",
    concepts: ["soglie", "profilo per dimensione", "logica booleana", "recupero mirato", "evidenze"],
    instructions: [
      "Leggi i quattro punteggi e verifica prima a mano il totale su 64.",
      "Esegui il programma: il totale supera 45, ma due dimensioni restano sotto la soglia di 8.",
      "Modifica i punteggi per ottenere prima un profilo completamente superato e poi un profilo con una sola lacuna.",
      "Scegli le due dimensioni più deboli e aggiungi due righe stampate con un'attività di recupero e la prova equivalente che useresti per verificarla.",
    ],
    starterCode: `problema_e_dati = 16
logica_e_algoritmo = 16
sistema_e_ciclo_di_vita = 7
impatto_e_responsabilita = 7

totale = problema_e_dati + logica_e_algoritmo + sistema_e_ciclo_di_vita + impatto_e_responsabilita
soglia_totale = 45
soglia_dimensione = 8

totale_superato = totale >= soglia_totale
problema_superato = problema_e_dati >= soglia_dimensione
logica_superata = logica_e_algoritmo >= soglia_dimensione
sistema_superato = sistema_e_ciclo_di_vita >= soglia_dimensione
impatto_superato = impatto_e_responsabilita >= soglia_dimensione

print("Punteggio totale:", totale, "/ 64")
print("Soglia totale superata:", totale_superato)
print("Problema e dati:", problema_e_dati, "- soglia superata:", problema_superato)
print("Logica e algoritmo:", logica_e_algoritmo, "- soglia superata:", logica_superata)
print("Sistema e ciclo di vita:", sistema_e_ciclo_di_vita, "- soglia superata:", sistema_superato)
print("Impatto e responsabilità:", impatto_e_responsabilita, "- soglia superata:", impatto_superato)

if totale_superato and problema_superato and logica_superata and sistema_superato and impatto_superato:
    print("Esito: profilo completo, pronto per il Modulo 1")
else:
    print("Esito: serve recupero mirato per le dimensioni sotto soglia")`,
    expectedResult: "Il programma deve mostrare il totale, l'esito di ogni dimensione e richiedere recupero quando almeno una soglia specifica non è raggiunta.",
  },
  {
    id: "programming-zero-python-project-1-1",
    lessonId: "1.1",
    title: "Mappa dell’ambiente in esecuzione",
    difficulty: "Base con osservazione dell’ambiente",
    goal: "Rappresentare i componenti dell’ambiente senza confondere editor, terminale, interprete, file e risultato.",
    concepts: ["ambiente di sviluppo", "editor", "terminale", "interprete", "file sorgente", "output"],
    instructions: [
      "Esegui il programma e individua il ruolo distinto di ogni componente.",
      "Sostituisci i valori generici con i nomi degli strumenti che userai realmente, lasciando ‘da verificare’ ciò che non hai ancora installato.",
      "Modifica il nome del file e l’output atteso senza scambiare il sorgente con il risultato.",
      "Aggiungi una riga che spieghi quale componente esegue il codice.",
    ],
    starterCode: `editor = "editor da scegliere"
terminale = "terminale del sistema"
interprete = "Python da verificare"
file_sorgente = "primo_programma.py"
output_atteso = "Ciao, ambiente!"

print("Editor - scrive il file:", editor)
print("Terminale - invia il comando:", terminale)
print("Interprete - esegue il codice:", interprete)
print("File sorgente:", file_sorgente)
print("Output atteso:", output_atteso)`,
    expectedResult: "Il programma deve mostrare una mappa chiara dei componenti e mantenere distinti strumento, sorgente ed output.",
  },
  {
    id: "programming-zero-python-project-1-2",
    lessonId: "1.2",
    title: "Dossier dell’installazione Python",
    difficulty: "Base con verifica tecnica",
    goal: "Registrare in modo ordinato le prove raccolte durante la verifica dell’installazione Python.",
    concepts: ["sys.executable", "versione", "implementazione", "architettura", "bitness", "verifica funzionale"],
    instructions: [
      "Sostituisci i valori di esempio soltanto dopo averli osservati con i comandi indicati nella lezione.",
      "Mantieni distinti percorso dell’eseguibile, versione, implementazione, bitness e architettura.",
      "Imposta prova_funzionale_riuscita su True soltanto se il file di verifica termina correttamente.",
      "Esegui il programma e controlla che il dossier segnali chiaramente se la verifica è completa o ancora da completare.",
    ],
    starterCode: `eseguibile = "percorso da sys.executable"
versione = "versione osservata"
implementazione = "CPython"
bitness_processo = 64
architettura_osservata = "architettura da verificare"
prova_funzionale_riuscita = False

print("Eseguibile:", eseguibile)
print("Versione:", versione)
print("Implementazione:", implementazione)
print("Bitness del processo:", bitness_processo)
print("Architettura osservata:", architettura_osservata)

if prova_funzionale_riuscita:
    print("Esito: installazione verificata")
else:
    print("Esito: verifica ancora da completare")`,
    expectedResult: "Il programma deve produrre un dossier con eseguibile, versione, implementazione, bitness, architettura ed esito della prova funzionale.",
  },
] as const;

if (!firstGuidedExercise) throw new Error("Le fonti ufficiali non contengono esercizi guidati");

export const programmingCurriculumOutline = officialLessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`);

export const programmingLesson = {
  id: PROGRAMMING_LESSON_ID,
  pathId: PROGRAMMING_ZERO_PATH_ID,
  moduleId: "programming-module-0",
  title: "Programmazione da Zero · Lezioni 0.1–2.3",
  lessonTitles: officialLessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`),
  level: "Lettore senza conoscenze pregresse",
  estimatedMinutes: 1890,
  description: officialLessons.map((lesson) => lesson.summary[0]).join(" "),
  objectives: officialLessons.flatMap((lesson) => lesson.objectives),
  modules: programmingModules,
  sourceDocuments: officialLessons.map((lesson) => ({ lessonId: lesson.id, ...lesson.source, metrics: lesson.metrics })),
  sections: officialLessons.flatMap((lesson) => lesson.sections) as LessonSection[],
  glossary: officialLessons.flatMap((lesson) => lesson.glossary) as string[][],
  guidedExercise: {
    ...(firstGuidedExercise as OfficialExercise),
    hints: [] as string[],
    requiredCases: [(firstGuidedExercise as OfficialExercise).autoverification ?? ""],
  },
  exercises: remainingExercises.map((exercise) => ({ ...exercise })) as Array<OfficialExercise>,
  quiz: chapters.flatMap((chapter) => chapter.quiz) as LessonQuizQuestion[],
  project: {
    id: "programming-zero-final-assessments",
    title: "Prova finale di padronanza",
    prompt: finalAssessments.map((assessment) => `Lezione ${assessment.lessonId}\n${assessment.prompt}`).join("\n\n"),
    deliverables: finalAssessments.flatMap((assessment) => assessment.deliverables),
    criteria: finalAssessments.flatMap((assessment) => assessment.rubric.slice(1).map((row) => row.join(" · "))),
    assessments: finalAssessments,
    guidedProjects: programmingPythonProjects,
  },
  completion: {
    minimumQuizScore: 80,
    requiredExerciseIds: chapters.flatMap((chapter) => [
      ...(chapter.exercises.guided.id === firstGuidedExercise.id ? [] : [chapter.exercises.guided.id]),
      ...chapter.exercises.autonomous.slice(0, 2).map((exercise) => exercise.id),
    ]),
    requiresGuidedExercise: true,
    requiresProject: true,
    requiresSelfAssessment: false,
  },
  summary: officialLessons.flatMap((lesson) => lesson.summary),
} as const;

export type ProgrammingLesson = typeof programmingLesson;

export function publicProgrammingLesson() {
  return {
    ...programmingLesson,
    quiz: programmingLesson.quiz.map((question) => ({
      id: question.id,
      concept: question.concept,
      prompt: question.prompt,
      choices: question.choices,
      explanation: question.explanation,
      reviewSectionId: question.reviewSectionId,
    })),
  };
}

export function findQuizQuestion(questionId: string) {
  return programmingLesson.quiz.find((question) => question.id === questionId) ?? null;
}


import type { CatalogMaterial, LearningPathDraft } from "./types";
import { normalizeCatalogText } from "./search";
import { resolveSubjectPackage } from "./subjects/registry";
import type { SubjectPackage } from "./subjects/types";
import { PROGRAMMING_LESSON_SOURCE_URL, programmingLesson } from "./subjects/programming-zero-lesson";

type Stage = { title: string; description: string; activity: string; completion: string };
type Blueprint = { aliases: string[]; title: string; rationale: string; stages: Stage[] };

const BLUEPRINTS: Blueprint[] = [
  {
    aliases: ["biologia", "biology", "genetica", "scienze biologiche"],
    title: "Percorso di biologia",
    rationale: "Dalla cellula agli organismi e agli ecosistemi, alternando teoria, osservazione ed esercizi.",
    stages: [
      { title: "Chimica della vita e cellule", description: "Molecole biologiche, membrane, organelli, metabolismo e divisione cellulare.", activity: "Crea una mappa della cellula collegando ogni organello alla sua funzione.", completion: "Spiegare struttura, energia e riproduzione di una cellula." },
      { title: "Genetica e biologia molecolare", description: "DNA, RNA, sintesi proteica, ereditarieta, mutazioni e regolazione genica.", activity: "Risolvi esercizi su incroci genetici e traduci una breve sequenza di DNA.", completion: "Collegare geni, proteine e caratteri osservabili." },
      { title: "Evoluzione e biodiversita", description: "Selezione naturale, speciazione, classificazione e storia evolutiva.", activity: "Confronta specie diverse costruendo un piccolo albero filogenetico.", completion: "Usare prove biologiche per spiegare un cambiamento evolutivo." },
      { title: "Anatomia, fisiologia ed ecologia", description: "Sistemi degli organismi, omeostasi, popolazioni, comunita ed ecosistemi.", activity: "Analizza un sistema corporeo e una rete alimentare reale.", completion: "Collegare livelli molecolari, organismici ed ecologici." },
      { title: "Indagine biologica", description: "Metodo scientifico, lettura dei dati, esperimenti e comunicazione dei risultati.", activity: "Progetta un esperimento con ipotesi, variabili, dati attesi e conclusioni.", completion: "Produrre e difendere un breve rapporto scientifico." },
    ],
  },
  {
    aliases: ["matematica", "math", "algebra", "geometria", "calcolo", "statistica"],
    title: "Percorso di matematica",
    rationale: "Costruisce le basi numeriche e algebriche prima di passare a modelli, calcolo e statistica.",
    stages: [
      { title: "Numeri e algebra", description: "Operazioni, frazioni, potenze, equazioni e manipolazione simbolica.", activity: "Completa esercizi graduati spiegando ogni passaggio.", completion: "Risolvere equazioni e controllare autonomamente il risultato." },
      { title: "Geometria e trigonometria", description: "Figure, coordinate, misure, similitudine, teoremi e trigonometria.", activity: "Modella un problema geometrico reale con disegno, formule e misure.", completion: "Passare correttamente da una figura a una relazione matematica." },
      { title: "Funzioni e modelli", description: "Funzioni lineari, quadratiche, esponenziali e logaritmiche.", activity: "Confronta modelli diversi sullo stesso insieme di dati.", completion: "Scegliere e interpretare una funzione adatta al problema." },
      { title: "Calcolo, probabilita e statistica", description: "Limiti, derivate, integrali, probabilita e statistica descrittiva.", activity: "Risolvi problemi applicati alternando calcolo e verifica grafica.", completion: "Interpretare variazioni, accumuli e incertezza." },
      { title: "Problemi e dimostrazione", description: "Strategie, dimostrazioni, modellazione e comunicazione rigorosa.", activity: "Crea un dossier di problemi commentati con errori e correzioni.", completion: "Argomentare una soluzione e riconoscerne ipotesi e limiti." },
    ],
  },
  {
    aliases: ["ingegneria", "engineering", "ingegnere", "meccanica", "elettronica", "ingegneria civile"],
    title: "Percorso di ingegneria",
    rationale: "Unisce fondamenti scientifici, strumenti tecnici e progettazione fino a un prototipo documentato.",
    stages: [
      { title: "Matematica e fisica", description: "Algebra, calcolo, vettori, forze, energia e misure.", activity: "Risolvi un problema fisico verificando dimensionalmente le formule.", completion: "Tradurre un fenomeno in un modello quantitativo coerente." },
      { title: "Materiali, disegno e strumenti", description: "Materiali, tolleranze, disegno tecnico e strumenti di misura.", activity: "Disegna un componente e prepara una scheda di materiali e tolleranze.", completion: "Leggere e produrre una specifica tecnica essenziale." },
      { title: "Programmazione, dati ed elettronica", description: "Algoritmi, sensori, circuiti, raccolta dati e automazione.", activity: "Acquisisci o simula dati di un sensore e rappresentali in un grafico.", completion: "Costruire una catena misura-elaborazione-risultato." },
      { title: "Progettazione di sistemi", description: "Requisiti, alternative, sicurezza, costi, affidabilita e verifica.", activity: "Confronta tre soluzioni usando una matrice decisionale motivata.", completion: "Giustificare una scelta progettuale rispetto ai requisiti." },
      { title: "Prototipo e portfolio", description: "Progetto completo, test, iterazioni, documentazione e presentazione.", activity: "Realizza un prototipo fisico o simulato e documenta test e miglioramenti.", completion: "Presentare un progetto verificabile con risultati e limiti." },
    ],
  },
];

function packagedRoadmap(
  subject: SubjectPackage,
  query: string,
  materials: CatalogMaterial[],
  initialLevel: LearningPathDraft["initialLevel"],
  targetLevel: LearningPathDraft["targetLevel"],
  weeklyHours: number,
): LearningPathDraft {
  if (subject.id === "programming") return programmingZeroRoadmap(query, materials, initialLevel, targetLevel, weeklyHours);
  const entryStageId = subject.entryStageByLevel[initialLevel];
  const entryIndex = Math.max(0, subject.stages.findIndex((stage) => stage.id === entryStageId));
  const selectedStages = subject.stages.filter((stage) => stage.order >= entryIndex);
  const specificationsByUrl = new Map(subject.recommendedMaterials.map((material) => [material.url, material]));
  const linked = materials.slice(0, 24);
  const totalMinutes = selectedStages.reduce((sum, stage) => sum + stage.estimatedMinutes, 0);
  const estimatedWeeks = Math.max(1, Math.ceil(totalMinutes / Math.max(30, weeklyHours * 60)));
  const branch = subject.branches.find((candidate) => normalizeCatalogText(query).includes(normalizeCatalogText(candidate.title))) ?? null;

  const modules = selectedStages.map((stage, stageIndex) => {
    const stageMaterials = linked.filter((material, materialIndex) => {
      const specification = specificationsByUrl.get(material.source_url);
      return specification ? specification.stageIds.includes(stage.id) : materialIndex % selectedStages.length === stageIndex;
    });
    const materialItems = stageMaterials.map((material) => ({
      catalogMaterialId: material.id,
      itemType: "material" as const,
      title: material.title,
      description: `Risorsa verificata di ${material.provider}, collegata alla tappa ${stage.order}.`,
      isRequired: true,
      estimatedDurationMinutes: material.estimated_duration_minutes,
    }));
    const items: LearningPathDraft["modules"][number]["items"] = [
      ...materialItems,
      {
        catalogMaterialId: null,
        itemType: "exercise",
        title: `Lezioni · ${stage.title}`,
        description: `${stage.lessons.join(" · ")}\n\nObiettivi: ${stage.objectives.join(" · ")}`,
        isRequired: true,
        estimatedDurationMinutes: Math.max(60, Math.round(stage.estimatedMinutes * 0.3)),
      },
      {
        catalogMaterialId: null,
        itemType: "exercise",
        title: `Esercizi · ${stage.title}`,
        description: stage.exercises.join(" · "),
        isRequired: true,
        estimatedDurationMinutes: Math.max(90, Math.round(stage.estimatedMinutes * 0.35)),
      },
      {
        catalogMaterialId: null,
        itemType: "project",
        title: `Progetto · ${stage.title}`,
        description: stage.projects.join(" · "),
        isRequired: true,
        estimatedDurationMinutes: Math.max(90, Math.round(stage.estimatedMinutes * 0.25)),
      },
      {
        catalogMaterialId: null,
        itemType: "checkpoint",
        title: `Verifica · ${stage.title}`,
        description: stage.completionCriteria.join(" · "),
        isRequired: true,
        estimatedDurationMinutes: Math.max(30, Math.round(stage.estimatedMinutes * 0.1)),
      },
    ];
    return {
      stageId: stage.id,
      title: stage.title,
      description: stage.description,
      estimatedDurationMinutes: stage.estimatedMinutes,
      prerequisites: stage.prerequisites,
      completionCriteria: stage.completionCriteria,
      items,
      concepts: stage.concepts,
      objectives: stage.objectives,
      activities: stage.activities,
      exercises: stage.exercises,
      projects: stage.projects,
      googleQueries: stage.googleQueries,
    };
  });

  const branchText = branch ? ` Obiettivo riconosciuto: ${branch.title}. ${branch.description}` : "";
  return {
    title: subject.pathTitle,
    objective: query.trim(),
    initialLevel,
    targetLevel,
    weeklyHours,
    rationale: `${subject.description} Dal livello scelto restano ${selectedStages.length} tappe, circa ${estimatedWeeks} settimane a ${weeklyHours} ore settimanali. La durata è indicativa e non una promessa.${branchText}`,
    modules,
  };
}

function programmingZeroRoadmap(
  query: string,
  materials: CatalogMaterial[],
  initialLevel: LearningPathDraft["initialLevel"],
  targetLevel: LearningPathDraft["targetLevel"],
  weeklyHours: number,
): LearningPathDraft {
  const nativeLesson = materials.find((material) => material.source_url === PROGRAMMING_LESSON_SOURCE_URL || material.internal_resource_id === "9f219d2a-d532-4af2-bd97-5df8fc863101");
  const modules = programmingLesson.modules.map((module, moduleIndex) => {
    const lessonIds = module.lessons.map((lesson) => lesson.id);
    const lessonTitles = module.lessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`);
    const assessments = programmingLesson.project.assessments.filter((assessment) => lessonIds.includes(assessment.lessonId));
    const projects = programmingLesson.project.guidedProjects.filter((project) => lessonIds.includes(project.lessonId));
    const items: LearningPathDraft["modules"][number]["items"] = [];
    if (nativeLesson && moduleIndex === 0) items.push({
      catalogMaterialId: nativeLesson.id, itemType: "material", title: programmingLesson.title,
      description: programmingLesson.description, isRequired: true, estimatedDurationMinutes: programmingLesson.estimatedMinutes,
    });
    items.push(
      ...lessonTitles.map((title) => ({ catalogMaterialId: null, itemType: "exercise" as const, title: `${title} · Esercizi`, description: "Esercizio guidato · Esercizi autonomi", isRequired: true, estimatedDurationMinutes: 60 })),
      ...lessonTitles.map((title) => ({ catalogMaterialId: null, itemType: "checkpoint" as const, title: `${title} · Quiz`, description: "Tre domande per ciascuno dei capitoli.", isRequired: true, estimatedDurationMinutes: 30 })),
      { catalogMaterialId: null, itemType: "project" as const, title: `Python Project · ${module.title}`, description: projects.map((project) => project.title).join(" · "), isRequired: true, estimatedDurationMinutes: Math.max(90, projects.length * 45) },
      { catalogMaterialId: null, itemType: "project" as const, title: assessments.at(-1)?.title ?? programmingLesson.project.title, description: assessments.map((assessment) => assessment.prompt).join("\n\n"), isRequired: true, estimatedDurationMinutes: 90 },
    );
    return {
      stageId: module.id,
      title: module.title,
      description: module.lessons.flatMap((lesson) => lesson.summary).join(" "),
      estimatedDurationMinutes: module.lessons.length * 90,
      prerequisites: moduleIndex === 0 ? [] : [programmingLesson.modules[moduleIndex - 1]?.title ?? "Modulo precedente"],
      completionCriteria: assessments.flatMap((assessment) => assessment.completionCriteria),
      items,
      concepts: programmingLesson.sections.filter((section) => lessonIds.includes(section.lessonId) && section.chapterNumber > 0).map((section) => section.title),
      objectives: module.lessons.flatMap((lesson) => lesson.objectives),
      activities: ["Esercizio guidato", "Esercizi autonomi", "Quiz", "Python Project"],
      exercises: programmingLesson.exercises.filter((exercise) => lessonIds.includes(exercise.lessonId)).map((exercise) => exercise.title),
      projects: [...projects.map((project) => project.title), ...assessments.map((assessment) => assessment.title)],
      googleQueries: moduleIndex === 0
        ? { lessons: ["programmazione da zero algoritmi basi"], exercises: ["esercizi algoritmi principianti con soluzioni"], videos: ["introduzione programmazione video principianti"], pdfs: ["introduzione programmazione algoritmi filetype:pdf"] }
        : { lessons: ["ambiente sviluppo installare Python principianti"], exercises: ["esercizi ambiente sviluppo Python principianti"], videos: ["installare Python ambiente sviluppo video"], pdfs: ["ambiente sviluppo Python installazione filetype:pdf"] },
    };
  });
  return {
    title: "Programmazione da zero", objective: query.trim(), initialLevel, targetLevel, weeklyHours,
    rationale: programmingLesson.description,
    modules,
  };
}

function blueprintFor(query: string): Blueprint {
  const normalized = normalizeCatalogText(query);
  const matched = BLUEPRINTS.find((blueprint) => blueprint.aliases.some((alias) => {
    const needle = normalizeCatalogText(alias);
    return normalized === needle || ` ${normalized} `.includes(` ${needle} `);
  }));
  if (matched) return matched;
  const subject = query.trim().replace(/\s+/g, " ").slice(0, 120) || "questo argomento";
  return {
    aliases: [],
    title: `Percorso: ${subject}`,
    rationale: "Percorso generale adattabile: orientamento, fondamenti, pratica, applicazione e verifica.",
    stages: [
      { title: "Orientamento e obiettivi", description: `Definisci cosa significa imparare ${subject}, il livello di partenza e un risultato osservabile.`, activity: "Scrivi obiettivi, prerequisiti, tempo disponibile e criteri di successo.", completion: "Avere un obiettivo concreto e misurabile." },
      { title: "Fondamenti e lessico", description: "Studia concetti essenziali, termini, regole e relazioni principali.", activity: "Crea una mappa concettuale e un glossario con esempi.", completion: "Spiegare i fondamenti con parole proprie." },
      { title: "Esercizi progressivi", description: "Passa da esempi guidati a problemi autonomi, registrando errori e dubbi.", activity: "Completa una serie di esercizi a difficolta crescente.", completion: "Risolvere esercizi senza seguire una soluzione passo passo." },
      { title: "Applicazione pratica", description: "Usa le conoscenze in un caso, progetto, simulazione o analisi reale.", activity: `Realizza un piccolo progetto collegato a ${subject}.`, completion: "Produrre un risultato verificabile e documentato." },
      { title: "Verifica e passo successivo", description: "Controlla lacune, ripeti i punti deboli e scegli il prossimo livello.", activity: "Prepara una prova finale e una lista di correzioni prioritarie.", completion: "Dimostrare i risultati e definire il prossimo obiettivo." },
    ],
  };
}

export function createSubjectRoadmap(
  query: string,
  materials: CatalogMaterial[] = [],
  initialLevel: LearningPathDraft["initialLevel"] = "no_experience",
  targetLevel: LearningPathDraft["targetLevel"] = "intermediate",
  weeklyHours = 5,
): LearningPathDraft {
  const subjectPackage = resolveSubjectPackage(query);
  if (subjectPackage) return packagedRoadmap(subjectPackage, query, materials, initialLevel, targetLevel, weeklyHours);
  const blueprint = blueprintFor(query);
  const linked = materials.slice(0, 10);
  const modules = blueprint.stages.map((stage, index) => {
    const materialItems = linked.filter((_, materialIndex) => materialIndex % blueprint.stages.length === index).map((material) => ({
      catalogMaterialId: material.id,
      itemType: "material" as const,
      title: material.title,
      description: `Risorsa collegata dal catalogo: ${material.provider}.`,
      isRequired: true,
      estimatedDurationMinutes: material.estimated_duration_minutes,
    }));
    const items: LearningPathDraft["modules"][number]["items"] = [
      ...materialItems,
      { catalogMaterialId: null, itemType: index === blueprint.stages.length - 1 ? "project" : "exercise", title: index === blueprint.stages.length - 1 ? "Progetto della tappa" : "Attivita della tappa", description: stage.activity, isRequired: true, estimatedDurationMinutes: index === blueprint.stages.length - 1 ? 180 : 90 },
    ];
    if (index === blueprint.stages.length - 1) items.push({ catalogMaterialId: null, itemType: "checkpoint", title: "Verifica finale e prossimi passi", description: "Rivedi risultati, errori e difficolta e scegli cosa approfondire.", isRequired: true, estimatedDurationMinutes: 60 });
    return { title: stage.title, description: stage.description, estimatedDurationMinutes: 300, prerequisites: index === 0 ? [] : [blueprint.stages[index - 1].title], completionCriteria: [stage.completion], items };
  });
  return { title: blueprint.title, objective: query.trim(), initialLevel, targetLevel, weeklyHours, rationale: blueprint.rationale, modules };
}

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import JSZip from "jszip";

const root = process.cwd();
const sources = [
  {
    id: "0.1",
    path: join(root, "docs/courses/programming-zero/source/Programmazione_da_Zero_Lezione_0.1_Che_cosa_significa_programmare.docx"),
  },
  {
    id: "0.2",
    path: join(root, "docs/courses/programming-zero/source/Programmazione_da_Zero_Lezione_0.2_Che_cosa_e_un_computer.docx"),
  },
];
const outputPath = join(root, "src/lib/catalog/subjects/programming-zero-official-content.json");

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function textFromXml(xml) {
  const prepared = xml
    .replace(/<w:tab\b[^>]*\/?\s*>/g, "\t")
    .replace(/<w:(?:br|cr)\b[^>]*\/?\s*>/g, "\n");
  return decodeXml(
    [...prepared.matchAll(/<w:(?:t|delText)\b[^>]*>([\s\S]*?)<\/w:(?:t|delText)>/g)]
      .map((match) => match[1])
      .join(""),
  ).replace(/\r\n?/g, "\n").trim();
}

function parseParagraph(xml) {
  const text = textFromXml(xml);
  if (!text) return null;
  return { type: "paragraph", text, numbered: /<w:numPr\b/.test(xml) };
}

function parseTable(xml) {
  const rows = [...xml.matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)].map((rowMatch) =>
    [...rowMatch[1].matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].map((cellMatch) => {
      const paragraphs = [...cellMatch[1].matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)]
        .map((paragraphMatch) => textFromXml(paragraphMatch[0]))
        .filter(Boolean);
      return paragraphs.join("\n");
    }),
  );
  return { type: "table", rows };
}

function parseDocumentXml(xml) {
  const body = xml.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/)?.[1];
  if (!body) throw new Error("Il documento Word non contiene w:body");
  return [...body.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>|<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g)]
    .map((match) => match[0].startsWith("<w:tbl") ? parseTable(match[0]) : parseParagraph(match[0]))
    .filter(Boolean);
}

function paragraphText(block) {
  return block?.type === "paragraph" ? block.text : "";
}

const headingLabels = new Set([
  "Come usare questa lezione", "Risultati di apprendimento", "Risultati di apprendimento della Lezione 0.1", "Risultati di apprendimento della Lezione 0.2",
  "Mappa della lezione", "Prerequisiti e materiali", "Convenzioni", "Introduzione", "Spiegazione intuitiva",
  "Spiegazione tecnica", "Esempi reali", "Controesempi: ciò che sembra corretto ma non lo è", "Analogia ragionata",
  "Diagramma testuale", "Approfondimento", "Errori comuni", "Casi limite", "Domande di riflessione",
  "Esercizio guidato", "Esercizi autonomi", "Quiz", "Glossario del capitolo", "Riepilogo", "Criteri di completamento",
  "Sintesi integrata della Lezione 0.1", "Sintesi integrata della Lezione 0.2", "Prova finale di padronanza",
  "Rubrica di valutazione", "Criteri di completamento della lezione",
]);

function displayBlock(block) {
  if (block.type === "table") return block;
  if (block.numbered) return { type: "list-item", text: block.text };
  if (block.text.includes("\n")) return { type: "diagram", text: block.text };
  if (headingLabels.has(block.text) || /^\d+\.\s/.test(block.text) && block.text.length < 120) return { type: "heading", text: block.text };
  if (/^(?:LEZIONE |OBIETTIVO|REGOLA DI STUDIO|METODO|AUTOVERIFICA|SOLUZIONI|PASSAGGIO SUCCESSIVO)/.test(block.text)) {
    return { type: "callout", text: block.text };
  }
  return { type: "paragraph", text: block.text };
}

function numberedTextsBetween(blocks, startText, endText) {
  const start = blocks.findIndex((block) => paragraphText(block) === startText);
  const end = blocks.findIndex((block, index) => index > start && paragraphText(block) === endText);
  if (start < 0 || end < 0) return [];
  return blocks.slice(start + 1, end).filter((block) => block.type === "paragraph" && block.numbered).map((block) => block.text);
}

function parseQuiz(chapterBlocks, lessonId, chapterNumber, chapterTitle, sectionId) {
  const start = chapterBlocks.findIndex((block) => paragraphText(block) === "Quiz");
  const solutionIndex = chapterBlocks.findIndex((block, index) => index > start && paragraphText(block).startsWith("SOLUZIONI"));
  if (start < 0 || solutionIndex < 0) throw new Error(`Quiz non riconosciuto in ${lessonId}, capitolo ${chapterNumber}`);
  const solution = paragraphText(chapterBlocks[solutionIndex]);
  const answers = new Map([...solution.matchAll(/(\d+):\s*([A-D])/g)].map((match) => [Number(match[1]), match[2]]));
  const questions = [];
  let current = null;
  for (const block of chapterBlocks.slice(start + 1, solutionIndex)) {
    if (block.type !== "paragraph") continue;
    const questionMatch = block.text.match(/^(\d+)\.\s+(.+)/s);
    const choiceMatch = block.text.match(/^([A-D])\.\s+(.+)/s);
    if (questionMatch) {
      current = { number: Number(questionMatch[1]), prompt: questionMatch[2], choices: [] };
      questions.push(current);
    } else if (choiceMatch && current) {
      current.choices.push({ letter: choiceMatch[1], text: block.text });
    }
  }
  return questions.map((question) => {
    const answer = answers.get(question.number);
    const correctChoice = question.choices.findIndex((choice) => choice.letter === answer);
    if (question.choices.length !== 4 || correctChoice < 0) throw new Error(`Soluzione quiz incompleta in ${lessonId}, capitolo ${chapterNumber}`);
    return {
      id: `programming-${lessonId.replace(".", "-")}-chapter-${chapterNumber}-quiz-${question.number}`,
      concept: chapterTitle,
      prompt: question.prompt,
      choices: question.choices.map((choice) => choice.text),
      correctChoice,
      explanation: solution,
      reviewSectionId: sectionId,
    };
  });
}

function parseExercises(chapterBlocks, lessonId, chapterNumber, chapterTitle) {
  const guidedStart = chapterBlocks.findIndex((block) => paragraphText(block) === "Esercizio guidato");
  const verificationIndex = chapterBlocks.findIndex((block, index) => index > guidedStart && paragraphText(block).startsWith("AUTOVERIFICA"));
  const autonomousStart = chapterBlocks.findIndex((block, index) => index > guidedStart && paragraphText(block) === "Esercizi autonomi");
  const quizStart = chapterBlocks.findIndex((block, index) => index > autonomousStart && paragraphText(block) === "Quiz");
  if ([guidedStart, verificationIndex, autonomousStart, quizStart].some((index) => index < 0)) {
    throw new Error(`Esercizi non riconosciuti in ${lessonId}, capitolo ${chapterNumber}`);
  }
  const guidedSteps = chapterBlocks.slice(guidedStart + 1, verificationIndex)
    .filter((block) => block.type === "paragraph" && block.numbered)
    .map((block) => block.text);
  const autonomous = chapterBlocks.slice(autonomousStart + 1, quizStart)
    .filter((block) => block.type === "paragraph" && block.numbered)
    .map((block, index) => ({
      id: `programming-${lessonId.replace(".", "-")}-chapter-${chapterNumber}-autonomous-${index + 1}`,
      kind: "autonomous",
      lessonId,
      chapterNumber,
      title: chapterTitle,
      prompt: block.text,
    }));
  return {
    guided: {
      id: `programming-${lessonId.replace(".", "-")}-chapter-${chapterNumber}-guided`,
      kind: "guided",
      lessonId,
      chapterNumber,
      title: chapterTitle,
      prompt: guidedSteps.join("\n"),
      autoverification: paragraphText(chapterBlocks[verificationIndex]),
    },
    autonomous,
  };
}

function parseFinalAssessment(blocks, lessonId) {
  const start = blocks.findIndex((block) => paragraphText(block) === "Prova finale di padronanza");
  const rubric = blocks.findIndex((block, index) => index > start && paragraphText(block) === "Rubrica di valutazione");
  const completion = blocks.findIndex((block, index) => index > rubric && paragraphText(block) === "Criteri di completamento della lezione");
  if ([start, rubric, completion].some((index) => index < 0)) throw new Error(`Prova finale non riconosciuta in ${lessonId}`);
  const prompt = paragraphText(blocks[start + 1]);
  const deliverables = blocks.slice(start + 2, rubric).filter((block) => block.type === "paragraph" && block.numbered).map((block) => block.text);
  const rubricTable = blocks.slice(rubric + 1, completion).find((block) => block.type === "table")?.rows ?? [];
  const completionCriteria = blocks.slice(completion + 1).filter((block) => block.type === "paragraph" && block.numbered).map((block) => block.text);
  return { lessonId, title: "Prova finale di padronanza", prompt, deliverables, rubric: rubricTable, completionCriteria };
}

function parseLesson(id, filename, hash, blocks) {
  const chapterStarts = blocks.flatMap((block, index) => paragraphText(block).match(new RegExp(`^LEZIONE ${id.replace(".", "\\.")}\\s*·\\s*CAPITOLO (\\d+) DI 10$`)) ? [index] : []);
  if (chapterStarts.length !== 10) throw new Error(`${filename}: attesi 10 capitoli, trovati ${chapterStarts.length}`);
  const titleMarker = blocks.findIndex((block) => paragraphText(block) === `Lezione ${id}`);
  const title = paragraphText(blocks[titleMarker + 1]);
  if (!title) throw new Error(`${filename}: titolo non riconosciuto`);

  const intro = blocks.slice(0, chapterStarts[0]);
  const sections = [{
    id: `programming-${id.replace(".", "-")}-introduction`,
    lessonId: id,
    chapterNumber: 0,
    title: `Lezione ${id} · ${title}`,
    blocks: intro.map(displayBlock),
  }];
  const chapters = [];
  for (let index = 0; index < chapterStarts.length; index += 1) {
    const chapterBlocks = blocks.slice(chapterStarts[index], chapterStarts[index + 1] ?? blocks.length);
    const chapterNumber = index + 1;
    const chapterTitle = paragraphText(chapterBlocks[1]);
    const sectionId = `programming-${id.replace(".", "-")}-chapter-${chapterNumber}`;
    const exercises = parseExercises(chapterBlocks, id, chapterNumber, chapterTitle);
    chapters.push({
      number: chapterNumber,
      title: chapterTitle,
      sectionId,
      exercises,
      quiz: parseQuiz(chapterBlocks, id, chapterNumber, chapterTitle, sectionId),
    });
    sections.push({ id: sectionId, lessonId: id, chapterNumber, title: chapterTitle, blocks: chapterBlocks.map(displayBlock) });
  }

  const objectivesHeading = blocks.some((block) => paragraphText(block) === `Risultati di apprendimento della Lezione ${id}`)
    ? `Risultati di apprendimento della Lezione ${id}`
    : "Risultati di apprendimento";
  const objectives = numberedTextsBetween(blocks, objectivesHeading, "Mappa della lezione");
  const glossary = blocks.flatMap((block) => block.type === "table" && block.rows[0]?.[0] === "Termine" ? block.rows.slice(1) : []);
  const summaryHeading = `Sintesi integrata della Lezione ${id}`;
  const summaryIndex = blocks.findIndex((block) => paragraphText(block) === summaryHeading);
  const summary = summaryIndex >= 0 ? [paragraphText(blocks[summaryIndex + 1])] : [];
  return {
    id,
    title,
    source: { filename, sha256: hash },
    metrics: {
      paragraphs: blocks.filter((block) => block.type === "paragraph").length,
      tables: blocks.filter((block) => block.type === "table").length,
      textCharacters: blocks.reduce((sum, block) => sum + (block.type === "paragraph" ? block.text.length : block.rows.flat().join("").length), 0),
    },
    objectives,
    sections,
    chapters,
    glossary,
    summary,
    finalAssessment: parseFinalAssessment(blocks, id),
  };
}

const lessons = [];
for (const source of sources) {
  const bytes = await readFile(source.path);
  const zip = await JSZip.loadAsync(bytes);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) throw new Error(`${source.path}: word/document.xml non trovato`);
  lessons.push(parseLesson(source.id, basename(source.path), createHash("sha256").update(bytes).digest("hex"), parseDocumentXml(documentXml)));
}

const artifact = {
  schemaVersion: 1,
  course: "Programmazione da Zero",
  module: "Modulo 0",
  lessons,
};
await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(`Generato ${outputPath}`);
for (const lesson of lessons) {
  const exercises = lesson.chapters.flatMap((chapter) => [chapter.exercises.guided, ...chapter.exercises.autonomous]);
  const quiz = lesson.chapters.flatMap((chapter) => chapter.quiz);
  console.log(`Lezione ${lesson.id}: ${lesson.sections.length} sezioni, ${exercises.length} esercizi, ${quiz.length} domande, ${lesson.glossary.length} voci di glossario`);
}

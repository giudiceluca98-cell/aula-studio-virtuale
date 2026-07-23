(() => {
  "use strict";

  const course = window.AULA_OFFICIAL_COURSE_PAYLOAD;
  if (!course?.lessons?.length) {
    console.error("Pacchetto didattico ufficiale non disponibile");
    return;
  }

  const lessons = new Map(course.lessons.map((lesson) => [lesson.id, lesson]));
  const progressKey = "aula-demo-official-course-progress-v1";
  const lessonKey = "aula-demo-official-course-current-v1";
  const quizAnswers = {};
  let currentLessonId = localStorage.getItem(lessonKey) || course.lessons[0].id;
  let isApplyingLesson = false;
  let hasInitialized = false;

  const escape = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const safeId = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, "-");

  function loadProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function writeProgress(value) {
    try {
      localStorage.setItem(progressKey, JSON.stringify(value));
    } catch {
      console.warn("Il browser non consente di salvare i progressi del corso");
    }
  }

  function currentLessonProgress() {
    const all = loadProgress();
    return all[currentLessonId] || {};
  }

  function saveCurrentLessonProgress() {
    if (isApplyingLesson || !lessons.has(currentLessonId)) return;
    const all = loadProgress();
    all[currentLessonId] = {
      currentSection: Number(state.currentSection || 0),
      completedSections: [...state.completedSections],
      exerciseSaved: Boolean(state.exerciseSaved),
      exerciseDrafts: state.exerciseDrafts || {},
      exerciseCompletedIds: state.exerciseCompletedIds || [],
      activeExerciseId: state.activeExerciseId || "",
      quizCorrect: Boolean(state.quizCorrect),
      quizAnswers: quizAnswers[currentLessonId] || {},
      projectSubmitted: Boolean(state.projectSubmitted),
      projectText: document.getElementById("projectText")?.value || currentLessonProgress().projectText || "",
    };
    writeProgress(all);
    localStorage.setItem(lessonKey, currentLessonId);
  }

  function renderTable(rows) {
    if (!Array.isArray(rows) || !rows.length) return "";
    const [head, ...body] = rows;
    return `
      <div class="official-course-table-wrap">
        <table class="official-course-table">
          <thead><tr>${head.map((cell) => `<th>${escape(cell)}</th>`).join("")}</tr></thead>
          <tbody>${body.map((row) =>
            `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`
          ).join("")}</tbody>
        </table>
      </div>
    `;
  }

  function quizMarkup(question, compact = false) {
    const questionId = safeId(question.id);
    const savedAnswers =
      quizAnswers[currentLessonId] || currentLessonProgress().quizAnswers || {};
    const selectedChoice = savedAnswers[question.id];
    return `
      <article class="official-quiz-question" data-official-question="${escape(question.id)}">
        <h3>${escape(question.prompt)}</h3>
        <div class="official-quiz-options">
          ${question.choices.map((choice, index) => `
            <button
              class="quiz-option ${Number(selectedChoice) === index ? "selected" : ""}"
              type="button"
              onclick="aulaOfficialQuizSelect('${escape(question.id)}', ${index}, this)"
            >${escape(choice)}</button>
          `).join("")}
        </div>
        <div class="callout official-quiz-feedback" id="officialQuizFeedback-${questionId}" hidden></div>
        ${compact ? "" : `<small>Concetto: ${escape(question.concept)}</small>`}
      </article>
    `;
  }

  function renderBlocks(blocks, lesson, section) {
    const chapter = lesson.chapters.find(
      (item) => Number(item.number) === Number(section.chapterNumber)
    );
    let html = "";
    let list = [];
    let skippingTextQuiz = false;

    const flushList = () => {
      if (!list.length) return;
      html += `<ul>${list.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`;
      list = [];
    };

    for (const block of blocks) {
      const text = String(block.text || "");
      if (block.type === "heading" && text.trim().toLowerCase() === "quiz" && chapter?.quiz?.length) {
        flushList();
        skippingTextQuiz = true;
        html += `
          <section class="official-inline-quiz">
            <h2>Quiz del capitolo</h2>
            ${chapter.quiz.map((question) => quizMarkup(question, true)).join("")}
          </section>
        `;
        continue;
      }
      if (
        skippingTextQuiz &&
        block.type === "heading" &&
        text.trim().toLowerCase().startsWith("glossario")
      ) {
        skippingTextQuiz = false;
      } else if (skippingTextQuiz) {
        continue;
      }

      if (block.type === "list-item") {
        list.push(text);
        continue;
      }
      flushList();

      if (block.type === "heading") html += `<h2>${escape(text)}</h2>`;
      else if (block.type === "paragraph") html += `<p>${escape(text)}</p>`;
      else if (block.type === "callout") html += `<div class="callout">${escape(text)}</div>`;
      else if (block.type === "diagram") html += `<pre class="code-block">${escape(text)}</pre>`;
      else if (block.type === "table") html += renderTable(block.rows);
    }
    flushList();
    return html;
  }

  function sectionsForLesson(lesson) {
    return lesson.sections.map((section, index) => ({
      label: `Lezione ${lesson.id} · Sezione ${index + 1} di ${lesson.sections.length}`,
      title: section.title,
      html: `
        <div class="document-section-label">Lezione ${escape(lesson.id)} · Sezione ${index + 1} di ${lesson.sections.length}</div>
        ${index === 0 ? `<h1>${escape(lesson.title)}</h1>` : ""}
        ${renderBlocks(section.blocks, lesson, section)}
      `,
    }));
  }

  function exercisesForLesson(lesson) {
    return lesson.chapters.flatMap((chapter) => {
      const guided = chapter.exercises?.guided;
      const autonomous = Array.isArray(chapter.exercises?.autonomous)
        ? chapter.exercises.autonomous
        : [];
      const verification = guided?.autoverification || "";
      return [guided, ...autonomous].filter(Boolean).map((exercise) => ({
        id: exercise.id,
        kind: exercise.kind === "guided" ? "Guidato" : "Autonomo",
        title: exercise.title || chapter.title,
        prompt: exercise.prompt,
        goal: verification || chapter.title,
        placeholder: "Scrivi qui la tua risposta completa…",
        minimumChars: 40,
        hint: verification || "Rileggi la consegna e verifica ogni punto richiesto.",
        solutionHtml: verification
          ? `<h4>Criterio ufficiale di autoverifica</h4><p>${escape(verification)}</p>`
          : `<p>Confronta la risposta con la consegna ufficiale prima di considerarla completa.</p>`,
        solutionSpeech: verification || "Confronta la risposta con tutti i punti della consegna ufficiale.",
      }));
    });
  }

  function quizThreshold(lesson, questions) {
    const criteria = Array.isArray(lesson.finalAssessment?.completionCriteria)
      ? lesson.finalAssessment.completionCriteria.join(" ")
      : "";
    const match = criteria.match(/almeno\s+(\d+)\s*\/\s*(\d+)/i);
    if (match && Number(match[2]) === questions.length) return Number(match[1]);
    return Math.ceil(questions.length * 0.8);
  }

  function quizTemplate(lesson) {
    const questions = lesson.chapters.flatMap((chapter) => chapter.quiz);
    const threshold = quizThreshold(lesson, questions);
    const savedAnswers =
      quizAnswers[currentLessonId] || currentLessonProgress().quizAnswers || {};
    const correctCount = questions.filter(
      (question) =>
        Number(savedAnswers[question.id]) === Number(question.correctChoice)
    ).length;
    return `
      <div class="document-section-label">Lezione ${escape(lesson.id)} · Quiz</div>
      <h1>Verifica finale della lezione</h1>
      <p>Rispondi a tutte le domande. Soglia ufficiale di completamento: <strong>${threshold}/${questions.length}</strong>.</p>
      <div class="official-quiz-summary" id="officialQuizSummary">${correctCount}/${questions.length} risposte corrette · soglia ${threshold}</div>
      ${questions.map((question) => quizMarkup(question)).join("")}
    `;
  }

  function projectTemplate(lesson) {
    const assessment = lesson.finalAssessment;
    const pythonProject = course.pythonProjects.find(
      (project) => project.lessonId === lesson.id
    );
    const saved = currentLessonProgress();
    if (!assessment && !pythonProject) {
      return `
        <div class="document-section-label">Lezione ${escape(lesson.id)} · Progetto</div>
        <h1>Progetto non ancora disponibile</h1>
      `;
    }
    return `
      <div class="document-section-label">Lezione ${escape(lesson.id)} · Python Project</div>
      ${pythonProject ? `
        <h1>${escape(pythonProject.title)}</h1>
        <p><strong>Livello:</strong> ${escape(pythonProject.difficulty)}</p>
        <p>${escape(pythonProject.goal)}</p>
        <h2>Concetti utilizzati</h2>
        <ul>${pythonProject.concepts.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>
        <h2>Istruzioni</h2>
        <ol>${pythonProject.instructions.map((item) => `<li>${escape(item)}</li>`).join("")}</ol>
        <h2>Codice di partenza</h2>
        <pre class="code-block"><code>${escape(pythonProject.starterCode)}</code></pre>
        <div class="callout"><strong>Risultato atteso:</strong> ${escape(pythonProject.expectedResult)}</div>
      ` : ""}
      ${assessment ? `
        <h2>${escape(assessment.title)}</h2>
        <p>${escape(assessment.prompt)}</p>
        <h3>Consegna</h3>
        <ul>${assessment.deliverables.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>
        <h3>Rubrica di valutazione</h3>
        ${renderTable(assessment.rubric)}
        <h3>Criteri di completamento</h3>
        <ul>${assessment.completionCriteria.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>
      ` : ""}
      <div class="project-box">
        <label for="projectText"><strong>Elaborato</strong></label>
        <textarea
          class="notes-textarea"
          id="projectText"
          placeholder="Scrivi qui il progetto…"
          oninput="aulaOfficialProjectDraft(this.value)"
        >${escape(saved.projectText || "")}</textarea>
        <button class="primary-small" type="button" onclick="submitProject()">Consegna progetto</button>
      </div>
    `;
  }

  function glossaryTemplate(lesson) {
    return `
      <div class="document-section-label">Lezione ${escape(lesson.id)} · Glossario</div>
      <h1>Glossario della lezione</h1>
      <dl class="official-glossary">
        ${lesson.glossary.map(([term, definition]) => `
          <div><dt>${escape(term)}</dt><dd>${escape(definition)}</dd></div>
        `).join("")}
      </dl>
    `;
  }

  function buildSidebar() {
    const container = document.getElementById("lessonSidebarContent");
    if (!container) return;
    const grouped = new Map();
    for (const lesson of course.lessons) {
      const moduleId = lesson.id.split(".")[0];
      if (!grouped.has(moduleId)) grouped.set(moduleId, []);
      grouped.get(moduleId).push(lesson);
    }

    container.innerHTML = [...grouped.entries()].map(([moduleId, moduleLessons]) => `
      <div class="module-title">Modulo ${escape(moduleId)}</div>
      ${moduleLessons.map((lesson) => `
        <button
          class="lesson-item ${lesson.id === currentLessonId ? "active" : ""}"
          type="button"
          data-official-lesson="${escape(lesson.id)}"
          onclick="selectLesson('${escape(lesson.id)}', this)"
        >
          <span class="lesson-number">Lezione ${escape(lesson.id)}</span>
          <strong>${escape(lesson.title)}</strong>
          <span class="lesson-status">${escape(statusForLesson(lesson.id, lesson.sections.length))}</span>
        </button>
      `).join("")}
    `).join("");
  }

  function statusForLesson(id, totalSections) {
    const saved = loadProgress()[id];
    const completed = Array.isArray(saved?.completedSections)
      ? saved.completedSections.length
      : 0;
    return completed
      ? `${completed}/${totalSections} sezioni comprese`
      : "Non iniziata";
  }

  function updateSidebarStatuses() {
    for (const lesson of course.lessons) {
      const button = document.querySelector(`[data-official-lesson="${lesson.id}"]`);
      const status = button?.querySelector(".lesson-status");
      if (status) status.textContent = statusForLesson(lesson.id, lesson.sections.length);
      button?.classList.toggle("active", lesson.id === currentLessonId);
    }
  }

  function restoreLessonProgress(lesson, exercises) {
    const saved = loadProgress()[lesson.id] || {};
    state.currentSection = Math.min(
      lesson.sections.length - 1,
      Math.max(0, Number(saved.currentSection || 0))
    );
    state.completedSections = new Set(
      (saved.completedSections || []).filter(
        (index) => Number.isInteger(index) && index >= 0 && index < lesson.sections.length
      )
    );
    state.exerciseDrafts = saved.exerciseDrafts || {};
    state.exerciseCompletedIds = (saved.exerciseCompletedIds || []).filter((id) =>
      exercises.some((exercise) => exercise.id === id)
    );
    state.exerciseSaved = Boolean(saved.exerciseSaved || state.exerciseCompletedIds.length);
    state.activeExerciseId = exercises.some((exercise) => exercise.id === saved.activeExerciseId)
      ? saved.activeExerciseId
      : exercises[0]?.id || "";
    state.quizCorrect = Boolean(saved.quizCorrect);
    quizAnswers[lesson.id] = saved.quizAnswers || {};
    state.projectSubmitted = Boolean(saved.projectSubmitted);
    state.audioSelectedSections = lesson.sections.map((_, index) => index);
  }

  function applyLesson(id, button) {
    const lesson = lessons.get(id);
    if (!lesson) return;
    const shouldNotify = hasInitialized;
    if (hasInitialized) saveCurrentLessonProgress();
    if (audioLessonState.speaking) stopAudioLesson(false);
    if (exerciseSpeechState.speaking) stopExerciseSpeech(false);

    isApplyingLesson = true;
    currentLessonId = lesson.id;
    localStorage.setItem(lessonKey, currentLessonId);
    const sections = sectionsForLesson(lesson);
    const exercises = exercisesForLesson(lesson);
    lessonSections.splice(0, lessonSections.length, ...sections);
    exerciseDefinitions.splice(0, exerciseDefinitions.length, ...exercises);
    viewTemplates.quiz = quizTemplate(lesson);
    viewTemplates.project = projectTemplate(lesson);
    viewTemplates.glossary = glossaryTemplate(lesson);
    restoreLessonProgress(lesson, exercises);

    document.querySelectorAll(".lesson-item").forEach((item) => item.classList.remove("active"));
    button?.classList.add("active");
    document.getElementById("selectedMaterialTitle").textContent = lesson.title;
    document.getElementById("selectedMaterialDescription").textContent =
      lesson.summary?.[0] || `Lezione ufficiale ${lesson.id} di Programmazione da zero.`;
    document.getElementById("courseLessonTitle").textContent = lesson.title;
    const kicker = document.querySelector(".course-kicker");
    if (kicker) kicker.textContent =
      `Programmazione da Zero · Modulo ${lesson.id.split(".")[0]} · Lezione ${lesson.id}`;
    const courseMeta = document.querySelector(".course-overview .course-meta");
    if (courseMeta) {
      courseMeta.textContent =
        `${lesson.sections.length} sezioni · ${exercises.length} esercizi · ${lesson.chapters.flatMap((chapter) => chapter.quiz).length} domande · Italiano`;
    }

    state.currentView = "lesson";
    document.querySelectorAll(".content-tab").forEach((tab) =>
      tab.classList.toggle("active", tab.dataset.view === "lesson")
    );
    renderAudioPageSelection();
    renderLessonSection();
    updateProgress();
    updateSidebarStatuses();
    isApplyingLesson = false;
    hasInitialized = true;
    saveCurrentLessonProgress();
    if (shouldNotify) showToast(`Lezione ${lesson.id} aperta`);
  }

  window.aulaOfficialQuizSelect = (questionId, choiceIndex, button) => {
    const lesson = lessons.get(currentLessonId);
    const questions = lesson.chapters.flatMap((chapter) => chapter.quiz);
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;
    const article = button.closest(".official-quiz-question");
    article?.querySelectorAll(".quiz-option").forEach((option) =>
      option.classList.remove("selected")
    );
    button.classList.add("selected");
    quizAnswers[currentLessonId] ||= {};
    quizAnswers[currentLessonId][questionId] = Number(choiceIndex);

    const correct = Number(choiceIndex) === Number(question.correctChoice);
    const feedback = document.getElementById(`officialQuizFeedback-${safeId(questionId)}`);
    if (feedback) {
      feedback.hidden = false;
      feedback.innerHTML = correct
        ? `<strong>Risposta corretta</strong> Hai riconosciuto il concetto “${escape(question.concept)}”.`
        : `<strong>Da ripassare</strong> Rivedi il concetto “${escape(question.concept)}”.`;
    }

    const correctCount = questions.filter(
      (item) => Number(quizAnswers[currentLessonId][item.id]) === Number(item.correctChoice)
    ).length;
    const threshold = quizThreshold(lesson, questions);
    state.quizCorrect = correctCount >= threshold;
    const summary = document.getElementById("officialQuizSummary");
    if (summary) {
      summary.textContent =
        `${correctCount}/${questions.length} risposte corrette · soglia ${threshold}`;
    }
    updateProgress();
    saveCurrentLessonProgress();
  };

  window.aulaOfficialProjectDraft = (value) => {
    const all = loadProgress();
    all[currentLessonId] ||= {};
    all[currentLessonId].projectText = String(value || "");
    writeProgress(all);
  };

  const baseSaveState = window.saveState;
  window.saveState = function saveStateWithOfficialCourse() {
    saveCurrentLessonProgress();
    return baseSaveState();
  };

  const baseUpdateProgress = window.updateProgress;
  window.updateProgress = function updateOfficialCourseProgress() {
    const result = baseUpdateProgress();
    if (!isApplyingLesson) {
      saveCurrentLessonProgress();
      updateSidebarStatuses();
    }
    return result;
  };

  const baseBuildExercisesTemplate = window.buildExercisesTemplate;
  window.buildExercisesTemplate = function buildOfficialExercisesTemplate() {
    return baseBuildExercisesTemplate().replace(
      "Lezione 0.1 · Esercizi",
      `Lezione ${currentLessonId} · Esercizi`
    );
  };

  window.selectLesson = applyLesson;

  const style = document.createElement("style");
  style.dataset.officialCourse = "true";
  style.textContent = `
    .official-course-table-wrap{max-width:100%;overflow:auto;margin:16px 0}
    .official-course-table{width:100%;border-collapse:collapse;font-size:.94em}
    .official-course-table th,.official-course-table td{padding:10px;border:1px solid var(--line);text-align:left;vertical-align:top}
    .official-course-table th{background:var(--surface-strong)}
    .official-inline-quiz,.official-quiz-question{display:grid;gap:10px;margin:18px 0}
    .official-quiz-question{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
    .official-quiz-options{display:grid;gap:8px}
    .official-quiz-summary{position:sticky;top:0;z-index:2;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-strong)}
    .official-glossary{display:grid;gap:12px}
    .official-glossary>div{padding:14px;border:1px solid var(--line);border-radius:12px}
    .official-glossary dt{font-weight:800}.official-glossary dd{margin:6px 0 0;color:var(--muted)}
  `;
  document.head.appendChild(style);

  window.AULA_OFFICIAL_COURSE = {
    version: course.schemaVersion,
    totals: course.totals,
    currentLesson: () => currentLessonId,
    lessons: course.lessons.map(({ id, title }) => ({ id, title })),
  };

  if (!lessons.has(currentLessonId)) currentLessonId = course.lessons[0].id;
  buildSidebar();
  applyLesson(
    currentLessonId,
    document.querySelector(`[data-official-lesson="${currentLessonId}"]`)
  );
})();

import type {
  ParticipantSummary,
  StudyRoomSummary,
} from "./types";

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function formatStudyDuration(minutes: number): string {
  const safeMinutes = Number.isFinite(minutes)
    ? Math.max(0, Math.round(minutes))
    : 0;
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

function participantLines(participant: ParticipantSummary): string[] {
  const lines = [`${clean(participant.displayName) || "Partecipante"}`];
  const location = [participant.course, participant.chapter, participant.lesson]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(clean)
    .join(" · ");
  if (location) lines.push(`- Percorso attuale: ${location}`);
  if (participant.currentFocus?.trim()) {
    lines.push(`- Attivita rilevata: ${clean(participant.currentFocus)}`);
  }
  if (participant.progressPercentage != null) {
    const percentage = Math.min(100, Math.max(0, participant.progressPercentage));
    lines.push(`- Progresso rilevato: ${Math.round(percentage)}%`);
  } else {
    lines.push("- Progresso rilevato: non ancora disponibile");
  }
  if (participant.manualProgressPercentage != null) {
    const manualPercentage = Math.min(100, Math.max(0, participant.manualProgressPercentage));
    lines.push(`- Indicazione manuale: ${Math.round(manualPercentage)}%`);
  }
  lines.push(`- Tempo studiato: ${formatStudyDuration(participant.studyMinutes)}`);
  lines.push(`- Esercizi completati: ${Math.max(0, participant.exercisesCompleted)}`);

  const completedItems = participant.completedItems?.map(clean).filter(Boolean) ?? [];
  if (completedItems.length) {
    lines.push(`- Completati automaticamente: ${completedItems.join("; ")}`);
  }
  const pendingItems = participant.pendingItems?.map(clean).filter(Boolean) ?? [];
  if (pendingItems.length) {
    lines.push(`- Da completare o riprendere: ${pendingItems.join("; ")}`);
  }
  if (participant.lastMaterialOpened?.trim()) {
    lines.push(`- Ultimo materiale aperto: ${clean(participant.lastMaterialOpened)}`);
  }

  const difficulties = participant.difficulties?.map(clean).filter(Boolean) ?? [];
  lines.push(
    difficulties.length
      ? `- Difficoltà: ${difficulties.join("; ")}`
      : "- Difficoltà: nessuna segnalata",
  );
  const notes = participant.notes?.map(clean).filter(Boolean) ?? [];
  lines.push(notes.length ? `- Note: ${notes.join("; ")}` : "- Note: nessuna");
  const goals = participant.nextGoals?.map(clean).filter(Boolean) ?? [];
  lines.push(
    goals.length
      ? `- Prossimi obiettivi: ${goals.join("; ")}`
      : "- Prossimi obiettivi: da definire insieme",
  );
  return lines;
}

/** Creates the plain-text, copyable output used by “Genera riepilogo per Tatiana”. */
export function generateSessionSummary(
  summary: StudyRoomSummary,
  recipient = "Tatiana",
): string {
  const lines = [
    `Riepilogo per ${clean(recipient) || "Tatiana"}`,
    `Stanza: ${clean(summary.roomName) || "Aula studio"}`,
  ];

  if (summary.generatedAt && Number.isFinite(Date.parse(summary.generatedAt))) {
    lines.push(
      `Aggiornato: ${new Intl.DateTimeFormat("it-IT", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Rome",
      }).format(new Date(summary.generatedAt))}`,
    );
  }

  lines.push("", "Progressi dei partecipanti");
  if (summary.participants.length === 0) {
    lines.push("Nessun progresso registrato.");
  } else {
    summary.participants.forEach((participant, index) => {
      if (index > 0) lines.push("");
      lines.push(...participantLines(participant));
    });
  }

  const sharedNotes = summary.sharedNotes?.map(clean).filter(Boolean) ?? [];
  if (sharedNotes.length) {
    lines.push("", "Note condivise", ...sharedNotes.map((note) => `- ${note}`));
  }

  const nextGoals = summary.nextGoals?.map(clean).filter(Boolean) ?? [];
  if (nextGoals.length) {
    lines.push(
      "",
      "Obiettivi condivisi successivi",
      ...nextGoals.map((goal) => `- ${goal}`),
    );
  }

  return lines.join("\n");
}

export async function copySessionSummary(
  text: string,
  writeText: (value: string) => Promise<void> = (value) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return Promise.reject(new Error("Clipboard API is not available."));
    }
    return navigator.clipboard.writeText(value);
  },
): Promise<void> {
  await writeText(text);
}

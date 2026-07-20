export type UiStatus = "online" | "studying" | "break" | "away" | "in_call" | "offline";

export interface UiMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  status: UiStatus;
  current_activity: string | null;
  last_seen_at: string;
  device_label: string;
}

export interface UiCourse { id: string; room_id: string; title: string; description: string | null; created_by?: string | null; created_at: string }
export interface UiMaterial { id: string; room_id: string; course_id: string | null; type: "link" | "pdf" | "file" | "course"; title: string; url: string | null; storage_path: string | null; description?: string | null; metadata?: Record<string, unknown>; access_mode?: "internal" | "embedded" | "import-required" | "external-unmonitored" | "unsupported"; monitoring_level?: "full" | "partial" | "opened-only" | "none"; internal_viewer?: "pdf" | "text" | "document" | "presentation" | "video" | "web-article" | "exercise" | null; import_status?: "ready" | "pending" | "failed" | "not-required"; internal_resource_id?: string | null; created_by: string; created_at: string }
export interface UiProgress { id: string; room_id: string; user_id: string; course_id: string; chapter: string | null; lesson: string | null; progress_percentage: number; exercises_completed: number; score: number | null; study_minutes: number; notes: string | null; next_goal: string | null; updated_at: string }
export interface UiTask { id: string; room_id: string; assigned_to: string | null; assignment_mode?: "everyone" | "single" | "selected"; title: string; description?: string | null; completed: boolean; completed_by?: string | null; completed_at?: string | null; priority: "low" | "medium" | "high"; due_at: string | null; created_at: string; stage_id?: string | null; task_type?: "lesson" | "exercise" | "project" | "assessment" | null; order_index?: number | null; completion_criteria?: string[]; estimated_minutes?: number | null; learning_path_id?: string | null }
export interface UiMessage { id: string; room_id: string; sender_id: string; content: string; created_at: string }
export interface UiNote { id: string; room_id: string; user_id: string; content: string; is_private: boolean; created_at: string; updated_at: string }
export interface UiActivity { id: string; room_id: string; user_id: string; event_type: string; data: Record<string, unknown>; created_at: string }
export interface UiSession { id: string; room_id: string; user_id: string; mode?: "free" | "pomodoro_focus" | "pomodoro_break"; started_at: string; paused_at: string | null; resumed_at?: string | null; ended_at: string | null; total_seconds: number; status: "running" | "paused" | "completed" }
export interface UiCallSession { id: string; room_id: string; started_by: string; call_kind: "direct" | "group"; status: "waiting" | "active" | "ended" | "cancelled"; created_at: string; started_at: string | null; ended_at: string | null }
export interface UiCallParticipant { call_id: string; room_id: string; user_id: string; state: "invited" | "joined" | "declined" | "left"; invited_by: string; invited_at: string; joined_at: string | null; left_at: string | null }

export interface RoomViewData {
  room: { id: string; name: string; invite_code: string };
  currentUserId: string;
  members: UiMember[];
  courses: UiCourse[];
  materials: UiMaterial[];
  progress: UiProgress[];
  tasks: UiTask[];
  messages: UiMessage[];
  notes: UiNote[];
  activities: UiActivity[];
  sessions: UiSession[];
  calls: UiCallSession[];
  callParticipants: UiCallParticipant[];
}

export function makeDemoData(): RoomViewData {
  const now = Date.now();
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

  return {
    room: { id: "demo", name: "Python insieme", invite_code: "AULA24" },
    currentUserId: "demo-marco",
    members: [
      { user_id: "demo-marco", display_name: "Marco", avatar_url: null, role: "owner", status: "studying", current_activity: "Lezione 4 · Funzioni", last_seen_at: minutesAgo(0), device_label: "Desktop" },
      { user_id: "demo-tatiana", display_name: "Tatiana", avatar_url: null, role: "member", status: "online", current_activity: "Ripasso degli esercizi", last_seen_at: minutesAgo(1), device_label: "Tablet" },
    ],
    courses: [
      { id: "course-python", room_id: "demo", title: "Python for Everybody", description: "Fondamenti, dati e primi programmi.", created_at: minutesAgo(5000) },
      { id: "course-git", room_id: "demo", title: "Git essenziale", description: "Versionare e condividere il lavoro.", created_at: minutesAgo(4000) },
    ],
    materials: [
      { id: "mat-1", room_id: "demo", course_id: "course-python", type: "link", title: "Why Program?", url: "https://www.py4e.com/lessons/intro", storage_path: null, description: "Lezione introduttiva e video", created_by: "demo-marco", created_at: minutesAgo(1200) },
      { id: "mat-2", room_id: "demo", course_id: "course-python", type: "pdf", title: "Esercizi · Capitolo 1", url: null, storage_path: "demo/esercizi-capitolo-1.pdf", description: "Set di esercizi condiviso", created_by: "demo-tatiana", created_at: minutesAgo(960) },
      { id: "mat-3", room_id: "demo", course_id: "course-python", type: "link", title: "Visualizzatore Python", url: "https://pythontutor.com/", storage_path: null, description: "Per seguire l'esecuzione riga per riga", created_by: "demo-marco", created_at: minutesAgo(700) },
    ],
    progress: [
      { id: "prog-1", room_id: "demo", user_id: "demo-marco", course_id: "course-python", chapter: "Capitolo 1", lesson: "Perche programmare?", progress_percentage: 68, exercises_completed: 7, score: 86, study_minutes: 312, notes: "Ripassare input e conversioni", next_goal: "Terminare gli esercizi del capitolo 1", updated_at: minutesAgo(8) },
      { id: "prog-2", room_id: "demo", user_id: "demo-tatiana", course_id: "course-python", chapter: "Capitolo 1", lesson: "Variabili e tipi", progress_percentage: 54, exercises_completed: 5, score: 82, study_minutes: 268, notes: "Fare altri due esercizi", next_goal: "Completare il quiz sulle variabili", updated_at: minutesAgo(15) },
    ],
    tasks: [
      { id: "task-1", room_id: "demo", assigned_to: null, title: "Finire gli esercizi 1–5", completed: false, priority: "high", due_at: new Date(now + 86_400_000).toISOString(), created_at: minutesAgo(800) },
      { id: "task-2", room_id: "demo", assigned_to: "demo-tatiana", title: "Rivedere il quiz del capitolo", completed: true, priority: "medium", due_at: null, created_at: minutesAgo(600) },
      { id: "task-3", room_id: "demo", assigned_to: "demo-marco", title: "Condividere appunti sulle funzioni", completed: false, priority: "low", due_at: null, created_at: minutesAgo(300) },
    ],
    messages: [
      { id: "msg-1", room_id: "demo", sender_id: "demo-tatiana", content: "Io parto dagli esercizi del capitolo 1 👋", created_at: minutesAgo(34) },
      { id: "msg-2", room_id: "demo", sender_id: "demo-marco", content: "Perfetto, io finisco la lezione sulle funzioni.", created_at: minutesAgo(31) },
      { id: "msg-3", room_id: "demo", sender_id: "demo-tatiana", content: "Quando vuoi confrontiamo l'esercizio 4.", created_at: minutesAgo(4) },
    ],
    notes: [
      { id: "note-1", room_id: "demo", user_id: "demo-tatiana", content: "Una funzione evita di ripetere lo stesso blocco di istruzioni.", is_private: false, created_at: minutesAgo(210), updated_at: minutesAgo(210) },
      { id: "note-2", room_id: "demo", user_id: "demo-marco", content: "Ricordarsi: input() restituisce sempre una stringa.", is_private: false, created_at: minutesAgo(90), updated_at: minutesAgo(90) },
    ],
    activities: [
      { id: "act-1", room_id: "demo", user_id: "demo-tatiana", event_type: "exercise_completed", data: { label: "ha completato l'esercizio 5" }, created_at: minutesAgo(6) },
      { id: "act-2", room_id: "demo", user_id: "demo-marco", event_type: "material_opened", data: { label: "ha aperto Why Program?" }, created_at: minutesAgo(9) },
      { id: "act-3", room_id: "demo", user_id: "demo-tatiana", event_type: "progress_updated", data: { label: "ha aggiornato il progresso al 54%" }, created_at: minutesAgo(15) },
    ],
    sessions: [
      { id: "session-1", room_id: "demo", user_id: "demo-marco", mode: "pomodoro_focus", started_at: minutesAgo(180), resumed_at: minutesAgo(180), paused_at: null, ended_at: minutesAgo(155), total_seconds: 1500, status: "completed" },
      { id: "session-2", room_id: "demo", user_id: "demo-marco", mode: "free", started_at: minutesAgo(95), resumed_at: minutesAgo(95), paused_at: null, ended_at: minutesAgo(50), total_seconds: 2700, status: "completed" },
      { id: "session-3", room_id: "demo", user_id: "demo-tatiana", mode: "pomodoro_focus", started_at: minutesAgo(65), resumed_at: minutesAgo(65), paused_at: null, ended_at: minutesAgo(40), total_seconds: 1500, status: "completed" },
    ],
    calls: [
      { id: "call-demo", room_id: "demo", started_by: "demo-tatiana", call_kind: "direct", status: "waiting", created_at: minutesAgo(2), started_at: null, ended_at: null },
    ],
    callParticipants: [
      { call_id: "call-demo", room_id: "demo", user_id: "demo-tatiana", state: "joined", invited_by: "demo-tatiana", invited_at: minutesAgo(2), joined_at: minutesAgo(2), left_at: null },
      { call_id: "call-demo", room_id: "demo", user_id: "demo-marco", state: "invited", invited_by: "demo-tatiana", invited_at: minutesAgo(2), joined_at: null, left_at: null },
    ],
  };
}

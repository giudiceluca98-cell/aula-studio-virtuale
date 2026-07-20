/** Shared domain types. Database-shaped records intentionally use snake_case. */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UUID = string;
export type ISODateString = string;

export type PresenceStatus =
  | "online"
  | "studying"
  | "break"
  | "away"
  | "in_call"
  | "offline";

export type StudySessionStatus =
  | "running"
  | "paused"
  | "completed"
  | "cancelled";
export type MaterialType = "link" | "pdf" | "file";
export type TaskPriority = "low" | "medium" | "high";

export interface Profile {
  id: UUID;
  display_name: string;
  avatar_url: string | null;
  created_at: ISODateString;
}

export interface StudyRoom {
  id: UUID;
  name: string;
  invite_code: string;
  created_by: UUID;
  created_at: ISODateString;
}

export interface RoomMember {
  room_id: UUID;
  user_id: UUID;
  role: "owner" | "admin" | "member";
  joined_at: ISODateString;
}

export interface PresenceRecord {
  room_id: UUID;
  user_id: UUID;
  status: PresenceStatus;
  current_activity: string | null;
  last_seen_at: ISODateString;
  device_label?: string | null;
  sharing_enabled?: boolean;
  last_activity_at?: ISODateString;
  disconnected_at?: ISODateString | null;
  updated_at?: ISODateString;
}

export interface Course {
  id: UUID;
  room_id: UUID;
  title: string;
  description: string | null;
  created_by?: UUID;
  created_at: ISODateString;
}

export interface Material {
  id: UUID;
  room_id: UUID;
  course_id: UUID | null;
  type: MaterialType;
  title: string;
  description?: string | null;
  url: string | null;
  storage_path: string | null;
  created_by: UUID;
  created_at: ISODateString;
}

export interface ProgressEntry {
  id: UUID;
  room_id: UUID;
  user_id: UUID;
  course_id: UUID;
  chapter: string | null;
  lesson: string | null;
  progress_percentage: number;
  exercises_completed: number;
  score: number | null;
  study_minutes: number;
  notes: string | null;
  next_goal?: string | null;
  updated_at: ISODateString;
}

export interface StudySession {
  id: UUID;
  room_id: UUID;
  user_id: UUID;
  started_at: ISODateString;
  paused_at: ISODateString | null;
  last_resumed_at?: ISODateString | null;
  ended_at: ISODateString | null;
  total_seconds: number;
  status: StudySessionStatus;
}

export interface StudyTask {
  id: UUID;
  room_id: UUID;
  assigned_to: UUID | null;
  created_by?: UUID;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  due_at: ISODateString | null;
  created_at: ISODateString;
}

export interface Message {
  id: UUID;
  room_id: UUID;
  sender_id: UUID;
  content: string;
  client_id?: UUID;
  reply_to_id?: UUID | null;
  created_at: ISODateString;
}

export interface SharedNote {
  id: UUID;
  room_id: UUID;
  author_id: UUID;
  content: string;
  visibility: "shared" | "private";
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ActivityEvent {
  id: UUID;
  room_id: UUID;
  actor_id: UUID | null;
  event_type: string;
  entity_type?: string | null;
  entity_id?: UUID | null;
  summary?: string | null;
  payload: Json;
  created_at: ISODateString;
}

export interface CallSignal {
  id: number;
  room_id: UUID;
  call_id: UUID;
  sender_id: UUID;
  recipient_id: UUID | null;
  signal_type:
    | "offer"
    | "answer"
    | "ice_candidate"
    | "renegotiate"
    | "hangup";
  payload: Json;
  created_at: ISODateString;
}

export interface CallParticipant {
  call_id: UUID;
  room_id: UUID;
  user_id: UUID;
  state: "invited" | "joined" | "declined" | "left";
  invited_by: UUID;
  invited_at: ISODateString;
  joined_at: ISODateString | null;
  left_at: ISODateString | null;
}

export type RealtimeTable =
  | "room_members"
  | "presence"
  | "courses"
  | "materials"
  | "progress_entries"
  | "study_sessions"
  | "tasks"
  | "task_assignees"
  | "messages"
  | "message_reads"
  | "shared_notes"
  | "activity_events"
  | "material_reader_progress"
  | "session_summaries"
  | "call_sessions"
  | "call_participants"
  | "call_signals";

export type RealtimeDatabaseEvent = "INSERT" | "UPDATE" | "DELETE";
export type RealtimeConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "error";

export interface RawPostgresChangePayload {
  schema?: string;
  table: string;
  eventType: RealtimeDatabaseEvent;
  commit_timestamp?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  errors?: string[] | null;
}

export interface RoomRealtimeEvent<TRecord = Record<string, unknown>> {
  id: string;
  roomId: UUID;
  table: RealtimeTable;
  type: RealtimeDatabaseEvent;
  record: TRecord | null;
  previous: Partial<TRecord> | null;
  /** PostgreSQL commit timestamp; never generated from the browser clock. */
  serverTimestamp: ISODateString;
}

export interface PresenceMeta {
  userId: UUID;
  sessionId: string;
  status: Exclude<PresenceStatus, "offline">;
  currentActivity: string | null;
  deviceLabel: "Desktop" | "Tablet" | "Mobile" | "Unknown";
  /** Timestamp returned by touch_presence(); never supplied by the browser clock. */
  lastHeartbeatAt: ISODateString;
}

export interface RoomPresenceParticipant {
  userId: UUID;
  status: PresenceStatus;
  currentActivity: string | null;
  deviceLabel: PresenceMeta["deviceLabel"];
  lastSeenAt: ISODateString;
  isOnline: boolean;
  deviceCount: number;
  /** Local deadline used only to avoid UI flicker after a temporary disconnect. */
  offlineAfter: number | null;
}

export interface SessionAutosaveDraft {
  sessionId: UUID;
  roomId: UUID;
  /** Server-issued value returned when the session is created. */
  startedAt: ISODateString;
  lessonsCompleted: string[];
  exercisesCompleted: number;
  lastMaterialId: UUID | null;
  lastResourceOpened?: string | null;
  notesAdded: number;
  timerStatus: Exclude<StudySessionStatus, "cancelled">;
  /** Display-only estimate. The server remains authoritative for elapsed time. */
  clientElapsedSeconds: number;
  /** Hint for leave handling; it can only affect this authenticated user's row. */
  hasOtherActiveConnection?: boolean;
}

export type AutosaveReason =
  | "periodic"
  | "hidden"
  | "online"
  | "pagehide"
  | "manual";

export interface SessionSaveEnvelope {
  draft: SessionAutosaveDraft;
  revision: number;
  reason: AutosaveReason;
  clientSentAt: ISODateString;
}

export interface ParticipantSummary {
  displayName: string;
  course?: string | null;
  chapter?: string | null;
  lesson?: string | null;
  currentFocus?: string | null;
  progressPercentage?: number | null;
  manualProgressPercentage?: number | null;
  studyMinutes: number;
  exercisesCompleted: number;
  completedItems?: string[];
  pendingItems?: string[];
  lastMaterialOpened?: string | null;
  difficulties?: string[];
  notes?: string[];
  nextGoals?: string[];
}

export interface StudyRoomSummary {
  roomName: string;
  generatedAt?: ISODateString;
  participants: ParticipantSummary[];
  sharedNotes?: string[];
  nextGoals?: string[];
}

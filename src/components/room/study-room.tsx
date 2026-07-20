"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Circle,
  Copy,
  File as FileIcon,
  FileText,
  Link2,
  ListChecks,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minus,
  MoreVertical,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Plus,
  MessageCircle,
  Send,
  Settings,
  Sparkles,
  Square,
  StickyNote,
  Target,
  Trash2,
  Upload,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { useRoomPresence } from "@/hooks/use-room-presence";
import { useAutosaveSession } from "@/hooks/use-autosave-session";
import { useAudioCall } from "@/hooks/use-audio-call";
import { copySessionSummary, generateSessionSummary } from "@/lib/session-summary";
import type { CourseRemovalImpact, MaterialRemovalImpact } from "@/lib/room-content-removal";
import {
  makeDemoData,
  type RoomViewData,
  type UiActivity,
  type UiCallSession,
  type UiMaterial,
  type UiMember,
  type UiMessage,
  type UiSession,
  type UiStatus,
} from "./demo-data";
import { RoomContentRemovalDialog } from "./room-content-removal-dialog";
import { MaterialWorkspaceViewer } from "./material-workspace-viewer";

const statusLabels: Record<UiStatus, string> = {
  online: "Online ora",
  studying: "Sta studiando",
  break: "In pausa",
  away: "Assente",
  in_call: "In chiamata",
  offline: "Offline",
};

const statusColors: Record<UiStatus, string> = {
  online: "bg-sky",
  studying: "bg-moss-500",
  break: "bg-apricot",
  away: "bg-amber-400",
  in_call: "bg-violet-500",
  offline: "bg-black/20",
};

const activityLabels: Record<string, string> = {
  session_started: "ha iniziato una sessione",
  session_paused: "ha messo in pausa la sessione",
  session_completed: "ha concluso una sessione",
  progress_updated: "ha aggiornato i progressi",
  exercise_completed: "ha completato un esercizio",
  task_created: "ha aggiunto un'attivita",
  task_completed: "ha completato un'attivita",
  task_reopened: "ha ripreso un'attivita",
  material_opened: "ha aperto un materiale",
  material_resumed: "ha ripreso un materiale",
  material_closed: "ha interrotto un materiale",
  reading_started: "ha iniziato a leggere",
  reading_completed: "ha completato una lettura",
  video_started: "ha avviato un video",
  video_completed: "ha completato un video",
  note_created: "ha aggiunto una nota",
  user_left_room: "ha lasciato la stanza",
};

const NO_TIMER_SESSION_ID = "11111111-1111-4111-8111-111111111111";

type RoomTool = "courses" | "materials" | "checklist" | "progress" | "notes" | "participants" | "activity" | "timer" | "chat";
type RemovalTarget =
  | { kind: "course"; impact: CourseRemovalImpact }
  | { kind: "material"; impact: MaterialRemovalImpact };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 45) return "ora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min fa`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h fa`;
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(value));
}

function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":")
    : [minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
}

function isExerciseTask(title: string) {
  return /\b(esercizi?|quiz|test|problemi?|challenge|pratica)\b/i.test(title);
}

function isTaskTrackedForUser(task: RoomViewData["tasks"][number], userId: string) {
  if (task.assigned_to === userId) return true;
  return !task.assigned_to && (!task.completed || task.completed_by === userId);
}

function isTaskCompletedByUser(task: RoomViewData["tasks"][number], userId: string) {
  if (!task.completed) return false;
  return task.assigned_to === userId || task.completed_by === userId;
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(https?:\/\/[^\s]+)/gi);
  return <>{parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>;
    try {
      const url = new URL(part);
      return <a key={index} href={url.toString()} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-current/30 underline-offset-2">{url.hostname}</a>;
    } catch { return <span key={index}>{part}</span>; }
  })}</>;
}

function panelTitle(title: string, action?: React.ReactNode) {
  return <div className="flex items-center justify-between"><h2 className="eyebrow">{title}</h2>{action}</div>;
}

export function StudyRoom({ roomId }: { roomId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = roomId === "demo";
  const liveEnabled = !isDemo && isSupabaseConfigured();
  const liveClient = useMemo(() => liveEnabled ? createClient() : null, [liveEnabled]);
  const [data, setData] = useState<RoomViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(isDemo ? "course-python" : null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(isDemo ? "mat-1" : null);
  const [chatDraft, setChatDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("everyone");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [sharePresence, setSharePresence] = useState(true);
  const [progressDraft, setProgressDraft] = useState(0);
  const [progressChapter, setProgressChapter] = useState("");
  const [progressLesson, setProgressLesson] = useState("");
  const [progressExercises, setProgressExercises] = useState("0");
  const [progressScore, setProgressScore] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [progressNextGoal, setProgressNextGoal] = useState("");
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [timerMode, setTimerMode] = useState<"libero" | "pomodoro">("pomodoro");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [callPanelOpen, setCallPanelOpen] = useState(false);
  const [callPanelMinimized, setCallPanelMinimized] = useState(false);
  const [callMuted, setCallMuted] = useState(true);
  const [callVolume, setCallVolume] = useState(70);
  const [callInvitees, setCallInvitees] = useState<string[]>([]);
  const [speakerBlocked, setSpeakerBlocked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTool, setActiveTool] = useState<RoomTool | null>(null);
  const [courseMenuId, setCourseMenuId] = useState<string | null>(null);
  const [materialMenuId, setMaterialMenuId] = useState<string | null>(null);
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [removalLoading, setRemovalLoading] = useState(false);
  const lastMessageAt = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const enteredRoomAt = useRef(Date.now());
  const preferencesApplied = useRef(false);
  const uiPreferencesApplied = useRef(false);
  const remoteAudioElements = useRef(new Map<string, HTMLAudioElement>());

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? null : current), 3200);
  }, []);

  const refreshRoom = useCallback(async () => {
    if (!liveClient) return;
    try {
      const { data: auth, error: authError } = await liveClient.auth.getUser();
      if (authError || !auth.user) { router.replace("/login"); return; }

      const [roomResult, memberResult, presenceResult, courseResult, materialResult, progressResult, sessionResult, taskResult, messageResult, noteResult, activityResult, preferenceResult, callResult, callParticipantResult] = await Promise.all([
        liveClient.from("study_rooms").select("id,name,invite_code").eq("id", roomId).single(),
        liveClient.from("room_members").select("room_id,user_id,role,joined_at").eq("room_id", roomId).is("left_at", null),
        liveClient.from("presence").select("room_id,user_id,status,current_activity,last_seen_at,device_label").eq("room_id", roomId),
        liveClient.from("courses").select("*").eq("room_id", roomId).is("archived_at", null).order("created_at"),
        liveClient.from("materials").select("*").eq("room_id", roomId).is("archived_at", null).order("created_at", { ascending: false }),
        liveClient.from("progress_entries").select("*").eq("room_id", roomId).order("updated_at", { ascending: false }),
        liveClient.from("study_sessions").select("*").eq("room_id", roomId).order("started_at", { ascending: false }).limit(30),
        liveClient.from("tasks").select("*").eq("room_id", roomId).is("archived_at", null).order("order_index", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }),
        liveClient.from("messages").select("*").eq("room_id", roomId).is("deleted_at", null).order("created_at", { ascending: true }).limit(100),
        liveClient.from("shared_notes").select("*").eq("room_id", roomId).order("updated_at", { ascending: false }).limit(50),
        liveClient.from("activity_events").select("*").eq("room_id", roomId).order("created_at", { ascending: false }).limit(100),
        liveClient.from("user_room_preferences").select("share_presence,default_private_notes").eq("room_id", roomId).eq("user_id", auth.user.id).maybeSingle(),
        liveClient.from("call_sessions").select("id,room_id,started_by,call_kind,status,created_at,started_at,ended_at").eq("room_id", roomId).in("status", ["waiting", "active"]).order("created_at", { ascending: false }).limit(5),
        liveClient.from("call_participants").select("call_id,room_id,user_id,state,invited_by,invited_at,joined_at,left_at").eq("room_id", roomId),
      ]);

      if (roomResult.error || !roomResult.data) {
        setAccessError("Stanza non trovata o accesso non autorizzato.");
        setLoading(false);
        return;
      }
      const rawMembers = (memberResult.data ?? []) as Array<{ user_id: string; role: "owner" | "admin" | "member" }>;
      const memberIds = rawMembers.map((member) => member.user_id);
      const { data: profiles } = memberIds.length
        ? await liveClient.from("profiles").select("id,display_name,avatar_url").in("id", memberIds)
        : { data: [] };
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      const presenceMap = new Map(((presenceResult.data ?? []) as Array<Record<string, unknown>>).map((presence) => [String(presence.user_id), presence]));
      const members: UiMember[] = rawMembers.map((member) => {
        const profile = profileMap.get(member.user_id);
        const presence = presenceMap.get(member.user_id);
        return {
          user_id: member.user_id,
          display_name: String(profile?.display_name ?? "Partecipante"),
          avatar_url: profile?.avatar_url ?? null,
          role: member.role,
          status: (presence?.status as UiStatus | undefined) ?? "offline",
          current_activity: String(presence?.current_activity ?? "") || null,
          last_seen_at: String(presence?.last_seen_at ?? new Date(0).toISOString()),
          device_label: String(presence?.device_label ?? "Dispositivo"),
        };
      });

      setData({
        room: roomResult.data,
        currentUserId: auth.user.id,
        members,
        courses: (courseResult.data ?? []) as RoomViewData["courses"],
        materials: (materialResult.data ?? []) as RoomViewData["materials"],
        progress: (progressResult.data ?? []) as RoomViewData["progress"],
        sessions: ((sessionResult.data ?? []) as Array<Record<string, unknown>>).map((session) => ({
          id: String(session.id),
          room_id: String(session.room_id),
          user_id: String(session.user_id),
          mode: (session.mode as UiSession["mode"] | undefined) ?? "free",
          started_at: String(session.started_at),
          paused_at: session.paused_at ? String(session.paused_at) : null,
          resumed_at: session.last_resumed_at ? String(session.last_resumed_at) : null,
          ended_at: session.ended_at ? String(session.ended_at) : null,
          total_seconds: Number(session.total_seconds ?? 0),
          status: session.status === "running" || session.status === "paused" ? session.status : "completed",
        })),
        tasks: (taskResult.data ?? []) as RoomViewData["tasks"],
        messages: (messageResult.data ?? []) as RoomViewData["messages"],
        notes: ((noteResult.data ?? []) as Array<Record<string, unknown>>).map((note) => ({
          id: String(note.id),
          room_id: String(note.room_id),
          user_id: String(note.author_id),
          content: String(note.content),
          is_private: note.visibility === "private",
          created_at: String(note.created_at),
          updated_at: String(note.updated_at),
        })),
        activities: ((activityResult.data ?? []) as Array<Record<string, unknown>>).map((activity) => ({
          id: String(activity.id),
          room_id: String(activity.room_id),
          user_id: String(activity.actor_id ?? ""),
          event_type: String(activity.event_type),
          data: {
            ...((activity.payload && typeof activity.payload === "object") ? activity.payload as Record<string, unknown> : {}),
            label: activity.summary ?? undefined,
          },
          created_at: String(activity.created_at),
        })),
        calls: ((callResult.data ?? []) as Array<Record<string, unknown>>).map((call) => ({
          id: String(call.id),
          room_id: String(call.room_id),
          started_by: String(call.started_by),
          call_kind: call.call_kind === "group" ? "group" : "direct",
          status: call.status === "active" ? "active" : "waiting",
          created_at: String(call.created_at),
          started_at: call.started_at ? String(call.started_at) : null,
          ended_at: call.ended_at ? String(call.ended_at) : null,
        } satisfies UiCallSession)),
        callParticipants: ((callParticipantResult.data ?? []) as Array<Record<string, unknown>>).map((participant) => ({
          call_id: String(participant.call_id),
          room_id: String(participant.room_id),
          user_id: String(participant.user_id),
          state: participant.state === "joined" || participant.state === "declined" || participant.state === "left" ? participant.state : "invited",
          invited_by: String(participant.invited_by),
          invited_at: String(participant.invited_at),
          joined_at: participant.joined_at ? String(participant.joined_at) : null,
          left_at: participant.left_at ? String(participant.left_at) : null,
        })),
      });
      setSharePresence(preferenceResult.data?.share_presence ?? true);
      if (!preferencesApplied.current) {
        setNotePrivate(preferenceResult.data?.default_private_notes ?? false);
        preferencesApplied.current = true;
      }
      setSelectedCourseId((current) => current ?? courseResult.data?.[0]?.id ?? null);
      setSelectedMaterialId((current) => current ?? materialResult.data?.[0]?.id ?? null);
      setAccessError(null);
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Connessione alla stanza non riuscita.");
    } finally {
      setLoading(false);
    }
  }, [liveClient, roomId, router]);

  useEffect(() => {
    if (isDemo) {
      setData(makeDemoData());
      setLoading(false);
      return;
    }
    if (liveEnabled) void refreshRoom();
  }, [isDemo, liveEnabled, refreshRoom]);
  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refreshRoom(), 90);
  }, [refreshRoom]);

  const realtime = useRoomRealtime({
    roomId: liveEnabled ? roomId : null,
    enabled: liveEnabled,
    client: liveClient ?? undefined,
    onEvent: scheduleRefresh,
    onError: (error) => console.warn("Realtime room reconnecting", error.message),
  });

  const presence = useRoomPresence({
    roomId: liveEnabled ? roomId : null,
    userId: data?.currentUserId,
    enabled: liveEnabled && Boolean(data?.currentUserId),
    sharingEnabled: sharePresence,
    client: liveClient ?? undefined,
    onError: (error) => console.warn("Presence update failed", error.message),
  });

  useEffect(() => {
    if (!presence.participants.length) return;
    setData((current) => current ? {
      ...current,
      members: current.members.map((member) => {
        const ephemeral = presence.participants.find((participant) => participant.userId === member.user_id);
        return ephemeral ? {
          ...member,
          status: ephemeral.status as UiStatus,
          current_activity: ephemeral.currentActivity,
          last_seen_at: ephemeral.lastSeenAt,
          device_label: ephemeral.deviceLabel,
        } : member;
      }),
    } : current);
  }, [presence.participants]);

  const roomMessages = data?.messages;
  const roomCurrentUserId = data?.currentUserId;
  useEffect(() => {
    if (!roomMessages || !roomCurrentUserId) return;
    const storageKey = `aula:last-read:${roomId}:${roomCurrentUserId}`;
    const lastRead = Number(window.localStorage.getItem(storageKey) ?? 0);
    const unread = roomMessages.filter((message) => message.sender_id !== roomCurrentUserId && Date.parse(message.created_at) > lastRead);
    setUnreadCount(unread.length);
    if (!unread.length || document.visibilityState !== "visible" || activeTool !== "chat") return;
    const timer = window.setTimeout(() => {
      const newest = Math.max(...unread.map((message) => Date.parse(message.created_at)));
      window.localStorage.setItem(storageKey, String(newest));
      setUnreadCount(0);
      if (liveClient) {
        void liveClient.from("message_reads").upsert(
          unread.map((message) => ({ message_id: message.id, room_id: roomId, user_id: roomCurrentUserId })),
          { onConflict: "message_id,user_id" },
        );
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [activeTool, liveClient, roomCurrentUserId, roomId, roomMessages]);

  useEffect(() => {
    if (!data?.currentUserId || uiPreferencesApplied.current) return;
    const key = `aula:room-ui:${roomId}:${data.currentUserId}`;
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
      const tools: RoomTool[] = ["courses", "materials", "checklist", "progress", "notes", "participants", "activity", "timer", "chat"];
      if (typeof saved.activeTool === "string" && tools.includes(saved.activeTool as RoomTool)) setActiveTool(saved.activeTool as RoomTool);
      if (typeof saved.selectedCourseId === "string") setSelectedCourseId(saved.selectedCourseId);
      if (typeof saved.selectedMaterialId === "string") setSelectedMaterialId(saved.selectedMaterialId);
    } catch { /* Ignore invalid local preferences and keep safe defaults. */ }
    uiPreferencesApplied.current = true;
  }, [data?.currentUserId, roomId]);

  useEffect(() => {
    if (!data?.currentUserId || !uiPreferencesApplied.current) return;
    window.localStorage.setItem(`aula:room-ui:${roomId}:${data.currentUserId}`, JSON.stringify({
      activeTool,
      selectedCourseId,
      selectedMaterialId,
    }));
  }, [activeTool, data?.currentUserId, roomId, selectedCourseId, selectedMaterialId]);

  useEffect(() => {
    if (!data) return;
    if (selectedCourseId && !data.courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(data.courses[0]?.id ?? null);
    }
    if (selectedMaterialId && !data.materials.some((material) => material.id === selectedMaterialId)) {
      setSelectedMaterialId(null);
      showToast("Il materiale aperto è stato rimosso dall’aula.");
    }
  }, [data, selectedCourseId, selectedMaterialId, showToast]);

  useEffect(() => {
    const requested = searchParams.get("materialId");
    if (!data || !requested) return;
    const material = data.materials.find((item) => item.id === requested);
    if (!material) return;
    setSelectedMaterialId(material.id);
    if (material.course_id) setSelectedCourseId(material.course_id);
  }, [data, searchParams]);

  useEffect(() => {
    const closeTransientUi = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || removalTarget) return;
      setCourseMenuId(null);
      setMaterialMenuId(null);
      if (activeTool) setActiveTool(null);
    };
    document.addEventListener("keydown", closeTransientUi);
    return () => document.removeEventListener("keydown", closeTransientUi);
  }, [activeTool, removalTarget]);

  const selectedCourse = data?.courses.find((course) => course.id === selectedCourseId) ?? data?.courses[0] ?? null;
  const courseMaterials = data?.materials.filter((material) => !selectedCourse || material.course_id === selectedCourse.id) ?? [];
  const selectedMaterial = data?.materials.find((material) => material.id === selectedMaterialId) ?? courseMaterials[0] ?? null;
  const currentUserId = data?.currentUserId ?? "";
  const self = data?.members.find((member) => member.user_id === currentUserId) ?? null;
  const currentProgress = data?.progress.find((entry) => entry.user_id === currentUserId && entry.course_id === selectedCourse?.id) ?? null;
  const activeSession = data?.sessions.find((session) => session.user_id === currentUserId && session.status !== "completed") ?? null;
  const activeCall = data?.calls.find((call) =>
    data.callParticipants.some((participant) =>
      participant.call_id === call.id
      && participant.user_id === currentUserId
      && (participant.state === "invited" || participant.state === "joined"),
    ),
  ) ?? null;
  const activeCallParticipants = data?.callParticipants.filter((participant) => participant.call_id === activeCall?.id) ?? [];
  const selfCallParticipant = activeCallParticipants.find((participant) => participant.user_id === currentUserId) ?? null;
  const joinedCall = selfCallParticipant?.state === "joined";
  const incomingCall = selfCallParticipant?.state === "invited";
  const joinedPeerIds = activeCallParticipants
    .filter((participant) => participant.state === "joined" && participant.user_id !== currentUserId)
    .map((participant) => participant.user_id);
  const activeCallMembers = activeCallParticipants
    .map((participant) => data?.members.find((member) => member.user_id === participant.user_id))
    .filter((member): member is UiMember => Boolean(member));
  const callStarter = data?.members.find((member) => member.user_id === activeCall?.started_by) ?? null;
  const callableMembers = data?.members.filter((member) => member.user_id !== currentUserId) ?? [];
  const roomNotes = data?.notes;
  const selectedMaterialIdForSave = selectedMaterial?.id ?? null;
  const selectedResourceForSave = selectedMaterial
    ? (selectedMaterial.url ?? selectedMaterial.title)
    : null;
  const activeSessionId = activeSession?.id;
  const activeSessionStatus = activeSession?.status;
  const hasOtherActiveConnection = (presence.participants.find((participant) => participant.userId === currentUserId)?.deviceCount ?? 0) > 1;
  const sessionStudyMinutes = Math.round((data?.sessions
    .filter((session) => session.user_id === currentUserId)
    .reduce((total, session) => total + (session.id === activeSession?.id ? elapsedSeconds : session.total_seconds), 0) ?? 0) / 60);
  const currentTrackedTasks = data?.tasks.filter((task) => isTaskTrackedForUser(task, currentUserId)) ?? [];
  const currentCompletedTasks = currentTrackedTasks.filter((task) => isTaskCompletedByUser(task, currentUserId));
  const automaticTaskProgress = currentTrackedTasks.length
    ? Math.round((currentCompletedTasks.length / currentTrackedTasks.length) * 100)
    : 0;

  const audioCall = useAudioCall({
    roomId,
    callId: activeCall?.id ?? null,
    currentUserId,
    joined: joinedCall,
    peerIds: joinedPeerIds,
    muted: callMuted,
    enabled: liveEnabled,
    client: liveClient,
    onError: showToast,
  });

  useEffect(() => {
    if (!incomingCall || !activeCall) return;
    setCallPanelOpen(true);
    setCallPanelMinimized(false);
  }, [activeCall, incomingCall]);

  useEffect(() => {
    for (const element of remoteAudioElements.current.values()) {
      element.volume = callVolume / 100;
    }
  }, [callVolume, audioCall.remoteStreams]);

  useEffect(() => {
    if (activeCall) return;
    setCallMuted(true);
    setSpeakerBlocked(false);
  }, [activeCall]);

  const { patchDraft: patchAutosaveDraft, flush: flushAutosave } = useAutosaveSession({
    initialDraft: {
      sessionId: activeSession?.id ?? NO_TIMER_SESSION_ID,
      roomId,
      startedAt: activeSession?.started_at ?? new Date(0).toISOString(),
      lessonsCompleted: currentProgress?.lesson ? [currentProgress.lesson] : [],
      exercisesCompleted: currentProgress?.exercises_completed ?? 0,
      lastMaterialId: selectedMaterial?.id ?? null,
      lastResourceOpened: selectedMaterial
        ? (selectedMaterial.url ?? selectedMaterial.title)
        : null,
      notesAdded: data?.notes.filter((note) => note.user_id === currentUserId).length ?? 0,
      timerStatus: activeSession?.status ?? "completed",
      clientElapsedSeconds: elapsedSeconds,
      hasOtherActiveConnection,
    },
    enabled: liveEnabled && Boolean(activeSession),
  });

  useEffect(() => {
    setProgressDraft(currentProgress?.progress_percentage ?? 0);
    setProgressChapter(currentProgress?.chapter ?? "");
    setProgressLesson(currentProgress?.lesson ?? "");
    setProgressExercises(String(currentProgress?.exercises_completed ?? 0));
    setProgressScore(currentProgress?.score == null ? "" : String(currentProgress.score));
    setProgressNotes(currentProgress?.notes ?? "");
    setProgressNextGoal(currentProgress?.next_goal ?? "");
  }, [currentProgress?.id, currentProgress?.progress_percentage, currentProgress?.chapter, currentProgress?.lesson, currentProgress?.exercises_completed, currentProgress?.score, currentProgress?.notes, currentProgress?.next_goal, selectedCourse?.id]);
  useEffect(() => {
    function calculate(session: UiSession | null) {
      if (!session) return 0;
      if (session.status !== "running") return session.total_seconds;
      const anchor = Date.parse(session.resumed_at ?? session.started_at);
      return session.total_seconds + Math.max(0, Math.floor((Date.now() - anchor) / 1000));
    }
    setElapsedSeconds(calculate(activeSession));
    if (activeSession?.status !== "running") return;
    const interval = setInterval(() => setElapsedSeconds(calculate(activeSession)), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (activeSession?.mode) setTimerMode(activeSession.mode === "pomodoro_focus" ? "pomodoro" : "libero");
  }, [activeSession?.id, activeSession?.mode]);

  useEffect(() => {
    if (!roomNotes || !activeSessionId || !activeSessionStatus || !liveEnabled) return;
    patchAutosaveDraft({
      lessonsCompleted: currentProgress?.lesson ? [currentProgress.lesson] : [],
      exercisesCompleted: currentProgress?.exercises_completed ?? 0,
      lastMaterialId: selectedMaterialIdForSave,
      lastResourceOpened: selectedResourceForSave,
      notesAdded: roomNotes.filter((note) => note.user_id === currentUserId).length,
      timerStatus: activeSessionStatus,
      clientElapsedSeconds: elapsedSeconds,
      hasOtherActiveConnection,
    });
  }, [activeSessionId, activeSessionStatus, currentProgress?.lesson, currentProgress?.exercises_completed, currentUserId, elapsedSeconds, hasOtherActiveConnection, liveEnabled, patchAutosaveDraft, roomNotes, selectedMaterialIdForSave, selectedResourceForSave]);

  useEffect(() => {
    if (!roomNotes || !currentUserId || !liveEnabled || activeSessionId) return;
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      const payload = {
        event: "user_left_room",
        roomId,
        sessionId: NO_TIMER_SESSION_ID,
        revision: 1,
        clientSentAt: new Date().toISOString(),
        data: {
          durationSeconds: Math.max(0, Math.round((Date.now() - enteredRoomAt.current) / 1000)),
          lessonsCompleted: currentProgress?.lesson ? [currentProgress.lesson] : [],
          exercisesCompleted: currentProgress?.exercises_completed ?? 0,
          lastMaterialId: selectedMaterialIdForSave,
          lastResourceOpened: selectedResourceForSave,
          notesAdded: roomNotes.filter((note) => note.user_id === currentUserId).length,
          finalTimerStatus: "completed",
          hasOtherActiveConnection,
        },
      };
      navigator.sendBeacon("/api/session/leave", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [activeSessionId, currentProgress?.exercises_completed, currentProgress?.lesson, currentUserId, hasOtherActiveConnection, liveEnabled, roomId, roomNotes, selectedMaterialIdForSave, selectedResourceForSave]);

  function mutateDemo(mutator: (draft: RoomViewData) => RoomViewData) {
    setData((current) => current ? mutator(current) : current);
  }

  async function updateStatus(status: UiStatus, activityText: string | null = null) {
    if (!data || status === "offline") return;
    if (isDemo) {
      mutateDemo((current) => ({ ...current, members: current.members.map((member) => member.user_id === current.currentUserId ? { ...member, status, current_activity: activityText, last_seen_at: new Date().toISOString() } : member) }));
    } else {
      await presence.setPresence(status, activityText);
    }
  }

  async function addActivity(eventType: string, label: string, details: Record<string, unknown> = {}) {
    if (!data) return;
    if (isDemo) {
      const activity: UiActivity = { id: crypto.randomUUID(), room_id: roomId, user_id: data.currentUserId, event_type: eventType, data: { ...details, label }, created_at: new Date().toISOString() };
      mutateDemo((current) => ({ ...current, activities: [activity, ...current.activities] }));
    } else if (liveClient) {
      const { error } = await liveClient.from("activity_events").insert({ room_id: roomId, actor_id: data.currentUserId, event_type: eventType, summary: label.slice(0, 500), payload: { ...details, label } });
      if (error) console.warn("Activity tracking failed", error.message);
    }
  }

  async function timerAction(action: "start" | "pause" | "resume" | "complete") {
    if (!data || actionPending) return;
    setActionPending(`timer-${action}`);
    try {
      if (isDemo) {
        const now = new Date().toISOString();
        mutateDemo((current) => {
          const existing = current.sessions.find((session) => session.user_id === current.currentUserId && session.status !== "completed");
          if (action === "start") {
            const next: UiSession = { id: crypto.randomUUID(), room_id: roomId, user_id: current.currentUserId, mode: timerMode === "pomodoro" ? "pomodoro_focus" : "free", started_at: now, resumed_at: now, paused_at: null, ended_at: null, total_seconds: 0, status: "running" };
            return { ...current, sessions: [next, ...current.sessions] };
          }
          if (!existing) return current;
          const accumulated = existing.status === "running" ? existing.total_seconds + Math.max(0, Math.floor((Date.now() - Date.parse(existing.resumed_at ?? existing.started_at)) / 1000)) : existing.total_seconds;
          return { ...current, sessions: current.sessions.map((session) => session.id !== existing.id ? session : action === "pause" ? { ...session, total_seconds: accumulated, status: "paused", paused_at: now } : action === "resume" ? { ...session, status: "running", resumed_at: now, paused_at: null } : { ...session, total_seconds: accumulated, status: "completed", ended_at: now }) };
        });
      } else if (liveClient) {
        if (action === "complete") await flushAutosave("manual").catch(() => undefined);
        if (action === "start") {
          const { error } = await liveClient.rpc("start_study_session", { p_room_id: roomId, p_mode: timerMode === "pomodoro" ? "pomodoro_focus" : "free" }); if (error) throw error;
        } else if (activeSession) {
          const { error } = await liveClient.rpc(`${action}_study_session`, { p_session_id: activeSession.id }); if (error) throw error;
        }
        await refreshRoom();
      }
      const eventMap = { start: "session_started", pause: "session_paused", resume: "session_started", complete: "session_completed" } as const;
      if (isDemo) {
        await addActivity(
          eventMap[action],
          action === "complete" ? "ha concluso una sessione" : action === "pause" ? "ha fatto una pausa" : "ha iniziato a studiare",
          {
            courseTitle: selectedCourse?.title ?? null,
            lesson: currentProgress?.lesson ?? null,
            materialTitle: selectedMaterial?.title ?? null,
          },
        );
      }
      if (action === "start" || action === "resume") await updateStatus("studying", selectedCourse ? `${selectedCourse.title} · ${selectedMaterial?.title ?? currentProgress?.lesson ?? "Focus"}` : "Sessione di studio");
      if (action === "pause") await updateStatus("break", "Pausa breve");
      if (action === "complete") await updateStatus("online", null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Timer non aggiornato.");
    } finally { setActionPending(null); }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !chatDraft.trim() || actionPending) return;
    if (chatDraft.length > 1000) { showToast("Il messaggio supera 1.000 caratteri."); return; }
    if (Date.now() - lastMessageAt.current < 1200) { showToast("Aspetta un istante prima di inviare di nuovo."); return; }
    const content = chatDraft.trim();
    setActionPending("chat");
    try {
      if (isDemo) {
        const message: UiMessage = { id: crypto.randomUUID(), room_id: roomId, sender_id: data.currentUserId, content, created_at: new Date().toISOString() };
        mutateDemo((current) => ({ ...current, messages: [...current.messages, message] }));
      } else if (liveClient) {
        const { error } = await liveClient.from("messages").insert({ room_id: roomId, sender_id: data.currentUserId, content });
        if (error) throw error;
      } else {
        throw new Error("Chat non disponibile.");
      }
      lastMessageAt.current = Date.now();
      setChatDraft((current) => current.trim() === content ? "" : current);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Messaggio non inviato: la bozza e rimasta al suo posto.");
    } finally {
      setActionPending(null);
    }
  }

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !taskDraft.trim() || actionPending) return;
    const title = taskDraft.trim();
    const assignedTo = taskAssignedTo === "everyone" ? null : taskAssignedTo;
    const dueAt = taskDueAt ? new Date(`${taskDueAt}T23:59:59`).toISOString() : null;
    const priority = taskPriority;
    setActionPending("task");
    try {
      if (isDemo) {
        mutateDemo((current) => ({ ...current, tasks: [{ id: crypto.randomUUID(), room_id: roomId, assigned_to: assignedTo, assignment_mode: assignedTo ? "single" : "everyone", title, completed: false, completed_by: null, completed_at: null, priority, due_at: dueAt, created_at: new Date().toISOString() }, ...current.tasks] }));
      } else if (liveClient) {
        const { error } = await liveClient.from("tasks").insert({ room_id: roomId, created_by: data.currentUserId, assigned_to: assignedTo, assignment_mode: assignedTo ? "single" : "everyone", title, priority, due_at: dueAt });
        if (error) throw error;
      } else {
        throw new Error("Checklist non disponibile.");
      }
      await addActivity("task_created", `ha aggiunto ${title}`, {
        taskTitle: title,
        assignedTo,
        priority,
      });
      setTaskDraft((current) => current.trim() === title ? "" : current);
      setTaskAssignedTo((current) => current === taskAssignedTo ? "everyone" : current);
      setTaskPriority((current) => current === priority ? "medium" : current);
      setTaskDueAt((current) => current === taskDueAt ? "" : current);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Attivita non salvata: la bozza e rimasta al suo posto.");
    } finally {
      setActionPending(null);
    }
  }

  async function toggleTask(id: string, completed: boolean) {
    if (!data) return;
    const task = data.tasks.find((item) => item.id === id);
    if (!task) return;
    try {
      if (isDemo) {
        const completedAt = completed ? new Date().toISOString() : null;
        mutateDemo((current) => ({
          ...current,
          tasks: current.tasks.map((item) => item.id === id
            ? { ...item, completed, completed_by: completed ? current.currentUserId : null, completed_at: completedAt }
            : item),
        }));
      } else if (liveClient) {
        const { error } = await liveClient.from("tasks").update({ completed }).eq("id", id).eq("room_id", roomId);
        if (error) throw error;
      }
      await addActivity(
        completed ? "task_completed" : "task_reopened",
        completed ? `ha completato ${task.title}` : `ha ripreso ${task.title}`,
        { taskId: task.id, taskTitle: task.title, completed, exerciseLike: isExerciseTask(task.title) },
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Attivita non aggiornata.");
    }
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !noteDraft.trim() || actionPending) return;
    const content = noteDraft.trim();
    setActionPending("note");
    try {
      if (isDemo) {
        const now = new Date().toISOString();
        mutateDemo((current) => ({ ...current, notes: [{ id: crypto.randomUUID(), room_id: roomId, user_id: current.currentUserId, content, is_private: notePrivate, created_at: now, updated_at: now }, ...current.notes] }));
      } else if (liveClient) {
        const { error } = await liveClient.from("shared_notes").insert({ room_id: roomId, author_id: data.currentUserId, content, visibility: notePrivate ? "private" : "shared" });
        if (error) throw error;
      } else {
        throw new Error("Appunti non disponibili.");
      }
      setNoteDraft((current) => current.trim() === content ? "" : current);
      await addActivity("note_created", "ha aggiunto una nota");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Nota non salvata: la bozza e rimasta al suo posto.");
    } finally {
      setActionPending(null);
    }
  }

  async function saveProgress() {
    if (!data || !selectedCourse || actionPending) return;
    const exercisesCompleted = Number(progressExercises);
    const score = progressScore.trim() === "" ? null : Number(progressScore);
    if (!Number.isInteger(exercisesCompleted) || exercisesCompleted < 0 || (score !== null && (!Number.isFinite(score) || score < 0))) {
      showToast("Controlla esercizi e punteggio: devono essere numeri positivi.");
      return;
    }
    const payload = {
      room_id: roomId,
      user_id: data.currentUserId,
      course_id: selectedCourse.id,
      chapter: progressChapter.trim() || null,
      lesson: progressLesson.trim() || null,
      progress_percentage: progressDraft,
      exercises_completed: exercisesCompleted,
      score,
      study_minutes: 0,
      notes: progressNotes.trim() || null,
      next_goal: progressNextGoal.trim() || null,
    };
    setActionPending("progress");
    try {
      if (isDemo) {
        mutateDemo((current) => {
          const exists = current.progress.some((entry) => entry.user_id === current.currentUserId && entry.course_id === selectedCourse.id);
          const updated = current.progress.map((entry) => entry.user_id === current.currentUserId && entry.course_id === selectedCourse.id ? { ...entry, ...payload, updated_at: new Date().toISOString() } : entry);
          return exists ? { ...current, progress: updated } : { ...current, progress: [...updated, { id: crypto.randomUUID(), ...payload, updated_at: new Date().toISOString() }] };
        });
      } else if (liveClient) {
        const { error } = await liveClient.from("progress_entries").upsert(payload, { onConflict: "room_id,user_id,course_id" });
        if (error) throw error;
      } else {
        throw new Error("Progressi non disponibili.");
      }
      await addActivity("progress_updated", `ha aggiornato manualmente il progresso al ${progressDraft}%`, {
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        progressPercentage: progressDraft,
        exercisesCompleted,
        chapter: progressChapter.trim() || null,
        lesson: progressLesson.trim() || null,
      });
      showToast("Progresso salvato");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Progresso non salvato: i campi non sono stati cancellati.");
    } finally {
      setActionPending(null);
    }
  }

  async function addCourse() {
    if (!data) return;
    const title = window.prompt("Titolo del nuovo corso")?.trim();
    if (!title) return;
    if (isDemo) {
      const id = crypto.randomUUID();
      mutateDemo((current) => ({ ...current, courses: [...current.courses, { id, room_id: roomId, title, description: null, created_at: new Date().toISOString() }] }));
      setSelectedCourseId(id);
    } else if (liveClient) {
      const { data: course, error } = await liveClient.from("courses").insert({ room_id: roomId, title, created_by: data.currentUserId }).select().single();
      if (error) showToast(error.message); else if (course) setSelectedCourseId(course.id);
    }
  }

  async function addLinkMaterial(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !materialTitle.trim() || !materialUrl.trim() || actionPending) return;
    const title = materialTitle.trim();
    const urlDraft = materialUrl.trim();
    let safeUrl: URL;
    try { safeUrl = new URL(urlDraft); if (!['http:', 'https:'].includes(safeUrl.protocol)) throw new Error(); }
    catch { showToast("Inserisci un link http o https valido."); return; }
    const payload = { room_id: roomId, course_id: selectedCourse?.id ?? null, type: "link" as const, title, url: safeUrl.toString(), storage_path: null, created_by: data.currentUserId, created_at: new Date().toISOString() };
    setActionPending("material-link");
    try {
      if (isDemo) {
        const material: UiMaterial = { id: crypto.randomUUID(), ...payload };
        mutateDemo((current) => ({ ...current, materials: [material, ...current.materials] }));
        setSelectedMaterialId(material.id);
      } else if (liveClient) {
        const { data: material, error } = await liveClient.from("materials").insert(payload).select().single();
        if (error) throw error;
        if (!material) throw new Error("Il materiale non e stato restituito dal server.");
        setSelectedMaterialId(material.id);
      } else {
        throw new Error("Materiali non disponibili.");
      }
      setMaterialTitle((current) => current.trim() === title ? "" : current);
      setMaterialUrl((current) => current.trim() === urlDraft ? "" : current);
      setMaterialFormOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Link non salvato: i campi non sono stati cancellati.");
    } finally {
      setActionPending(null);
    }
  }

  async function uploadMaterial(file: File | undefined) {
    if (!file || !data || !liveClient) { if (isDemo) showToast("L'upload reale si attiva collegando Supabase Storage."); return; }
    const allowed = new Set(["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]);
    if (!allowed.has(file.type) || file.size > 10 * 1024 * 1024) { showToast("File non ammesso: PDF, TXT, DOCX o PPTX fino a 10 MB."); return; }
    setActionPending("upload");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${roomId}/${data.currentUserId}/${crypto.randomUUID()}.${extension}`;
    let uploaded = false;
    try {
      const { error: uploadError } = await liveClient.storage.from("study-materials").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploaded = true;
      const { error } = await liveClient.from("materials").insert({ room_id: roomId, course_id: selectedCourse?.id ?? null, type: file.type === "application/pdf" ? "pdf" : "file", title: file.name.slice(0, 120), storage_path: path, created_by: data.currentUserId });
      if (error) {
        const { error: rollbackError } = await liveClient.storage.from("study-materials").remove([path]);
        uploaded = Boolean(rollbackError);
        if (rollbackError) console.warn("Material upload rollback failed", rollbackError.message);
        throw error;
      }
      showToast("File condiviso");
    } catch (error) {
      if (uploaded) {
        const { error: rollbackError } = await liveClient.storage.from("study-materials").remove([path]);
        if (rollbackError) console.warn("Material upload cleanup failed", rollbackError.message);
      }
      showToast(error instanceof Error ? error.message : "File non condiviso.");
    } finally {
      setActionPending(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function openMaterial(material: UiMaterial) {
    setSelectedMaterialId(material.id);
    if (material.course_id) setSelectedCourseId(material.course_id);
    setActiveTool(null);
  }

  async function requestCourseRemoval(course: RoomViewData["courses"][number]) {
    setCourseMenuId(null);
    setRemovalLoading(true);
    try {
      if (isDemo) {
        const pathIds = new Set(data?.tasks.map((task) => task.learning_path_id).filter(Boolean) ?? []);
        setRemovalTarget({ kind: "course", impact: {
          id: course.id,
          title: course.title,
          materialCount: data?.materials.filter((material) => material.course_id === course.id).length ?? 0,
          taskCount: data?.tasks.filter((task) => task.learning_path_id && pathIds.has(task.learning_path_id)).length ?? 0,
          progressCount: data?.progress.filter((entry) => entry.course_id === course.id).length ?? 0,
          importedFromCatalog: false,
          alreadyRemoved: false,
        } });
        return;
      }
      const response = await fetch(`/api/rooms/${roomId}/courses/${course.id}`, { credentials: "same-origin" });
      const payload = await response.json() as { impact?: CourseRemovalImpact; error?: string };
      if (!response.ok || !payload.impact) throw new Error(payload.error === "not_authorized" ? "Non hai il permesso di rimuovere questo corso." : "Impossibile analizzare il corso.");
      setRemovalTarget({ kind: "course", impact: payload.impact });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Impossibile preparare la rimozione.");
    } finally {
      setRemovalLoading(false);
    }
  }

  async function requestMaterialRemoval(material: UiMaterial) {
    setMaterialMenuId(null);
    setRemovalLoading(true);
    try {
      if (isDemo) {
        setRemovalTarget({ kind: "material", impact: {
          id: material.id,
          title: material.title,
          type: material.type,
          courseTitle: data?.courses.find((course) => course.id === material.course_id)?.title ?? null,
          readerProgressCount: 0,
          noteCount: 0,
          checklistCount: 0,
          importedFromCatalog: Boolean(material.metadata?.catalog_material_id),
          uploadedFile: Boolean(material.storage_path),
          alreadyRemoved: false,
        } });
        return;
      }
      const response = await fetch(`/api/rooms/${roomId}/materials/${material.id}`, { credentials: "same-origin" });
      const payload = await response.json() as { impact?: MaterialRemovalImpact; error?: string };
      if (!response.ok || !payload.impact) throw new Error(payload.error === "not_authorized" ? "Non hai il permesso di rimuovere questo materiale." : "Impossibile analizzare il materiale.");
      setRemovalTarget({ kind: "material", impact: payload.impact });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Impossibile preparare la rimozione.");
    } finally {
      setRemovalLoading(false);
    }
  }

  async function confirmContentRemoval(mode?: "course_only" | "course_and_contents") {
    if (!removalTarget || removalLoading) return;
    setRemovalLoading(true);
    const target = removalTarget;
    try {
      if (isDemo) {
        if (target.kind === "material") {
          mutateDemo((current) => ({ ...current, materials: current.materials.filter((material) => material.id !== target.impact.id) }));
          if (selectedMaterialId === target.impact.id) setSelectedMaterialId(null);
        } else {
          mutateDemo((current) => ({
            ...current,
            courses: current.courses.filter((course) => course.id !== target.impact.id),
            materials: mode === "course_and_contents"
              ? current.materials.filter((material) => material.course_id !== target.impact.id)
              : current.materials.map((material) => material.course_id === target.impact.id ? { ...material, course_id: null } : material),
          }));
        }
        setRemovalTarget(null);
        showToast("Contenuto rimosso dalla demo.");
        return;
      }
      const endpoint = target.kind === "course"
        ? `/api/rooms/${roomId}/courses/${target.impact.id}`
        : `/api/rooms/${roomId}/materials/${target.impact.id}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
        headers: target.kind === "course" ? { "content-type": "application/json" } : undefined,
        body: target.kind === "course" ? JSON.stringify({ mode: mode ?? "course_only" }) : undefined,
      });
      const payload = await response.json() as { cleanup?: { pending?: number }; error?: string };
      if (!response.ok) throw new Error(payload.error === "not_authorized" ? "Non hai il permesso di rimuovere questo contenuto." : "Rimozione non riuscita.");
      if (target.kind === "material" && selectedMaterialId === target.impact.id) setSelectedMaterialId(null);
      setRemovalTarget(null);
      await refreshRoom();
      showToast(payload.cleanup?.pending ? "Contenuto rimosso. La pulizia del file verrà ritentata." : "Contenuto rimosso dall’aula.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Rimozione non riuscita.");
    } finally {
      setRemovalLoading(false);
    }
  }

  const automaticSummaryText = (() => {
    if (!data) return "";
    return generateSessionSummary({
      roomName: data.room.name,
      generatedAt: new Date().toISOString(),
      participants: data.members.map((member) => {
        const progress = data.progress.find((entry) => entry.user_id === member.user_id && (!selectedCourse || entry.course_id === selectedCourse.id));
        const assignedTasks = data.tasks.filter((task) => isTaskTrackedForUser(task, member.user_id));
        const completedTasks = assignedTasks.filter((task) => isTaskCompletedByUser(task, member.user_id));
        const pendingTasks = assignedTasks.filter((task) => !task.completed);
        const taskProgress = assignedTasks.length ? Math.round((completedTasks.length / assignedTasks.length) * 100) : null;
        const memberActivities = data.activities.filter((activity) => activity.user_id === member.user_id);
        const materialActivities = memberActivities.filter((activity) => activity.data.materialId || activity.event_type.startsWith("material_") || activity.event_type.startsWith("reading_") || activity.event_type.startsWith("video_") || activity.event_type.startsWith("exercise_"));
        const latestMaterialActivities = materialActivities.filter((activity, index, all) => all.findIndex((candidate) => String(candidate.data.materialId ?? candidate.data.label ?? candidate.id) === String(activity.data.materialId ?? activity.data.label ?? activity.id)) === index);
        const lastMaterialActivity = materialActivities[0];
        const lastMaterialLabel = lastMaterialActivity
          ? (typeof lastMaterialActivity.data.materialTitle === "string"
            ? lastMaterialActivity.data.materialTitle
            : String(lastMaterialActivity.data.label ?? "").replace(/^ha (?:aperto|ripreso|interrotto|iniziato a leggere|messo in pausa|completato|iniziato a guardare)\s+/i, ""))
          : null;
        const materialPercentage = latestMaterialActivities.reduce<number | null>((highest, activity) => {
          const value = Number(activity.data.completionPercentage);
          if (!Number.isFinite(value)) return highest;
          return Math.max(highest ?? 0, Math.min(100, Math.max(0, value)));
        }, null);
        const materialActiveSeconds = latestMaterialActivities.reduce((total, activity) => {
          const value = Number(activity.data.activeSeconds);
          return total + (Number.isFinite(value) ? Math.max(0, value) : 0);
        }, 0);
        const completedMaterialLabels = latestMaterialActivities
          .filter((activity) => ["reading_completed", "video_completed", "exercise_completed"].includes(activity.event_type))
          .map((activity) => String(activity.data.label ?? "").replace(/^ha completato\s+/i, ""))
          .filter(Boolean);
        const pendingMaterialLabels = latestMaterialActivities
          .filter((activity) => !["reading_completed", "video_completed", "exercise_completed"].includes(activity.event_type))
          .map((activity) => String(activity.data.label ?? "").replace(/^ha (?:aperto|ripreso|interrotto|iniziato a leggere|messo in pausa|iniziato a guardare|sta studiando)\s+/i, ""))
          .filter(Boolean);
        const studySeconds = data.sessions
          .filter((session) => session.user_id === member.user_id)
          .reduce((total, session) => total + (session.id === activeSession?.id ? elapsedSeconds : session.total_seconds), 0);
        const manualPercentage = progress?.progress_percentage ?? null;
        const automaticPercentage = materialPercentage ?? taskProgress ?? manualPercentage;
        const nextGoals = [
          progress?.next_goal,
          ...pendingTasks.map((task) => task.title),
        ].filter((goal): goal is string => Boolean(goal));
        return {
          displayName: member.display_name,
          course: selectedCourse?.title,
          chapter: progress?.chapter,
          lesson: progress?.lesson,
          currentFocus: member.current_activity ?? progress?.lesson ?? lastMaterialLabel,
          progressPercentage: automaticPercentage,
          manualProgressPercentage: taskProgress == null ? null : manualPercentage,
          studyMinutes: Math.round(Math.max(studySeconds, materialActiveSeconds) / 60),
          exercisesCompleted: Math.max(
            progress?.exercises_completed ?? 0,
            completedTasks.filter((task) => isExerciseTask(task.title)).length,
          ),
          completedItems: [...new Set([...completedTasks.map((task) => task.title), ...completedMaterialLabels])].slice(0, 4),
          pendingItems: [...new Set([...pendingTasks.map((task) => task.title), ...pendingMaterialLabels])].slice(0, 4),
          lastMaterialOpened: lastMaterialLabel,
          difficulties: progress?.notes ? [progress.notes] : [],
          nextGoals: [...new Set(nextGoals)].slice(0, 2),
        };
      }),
      sharedNotes: data.notes.filter((note) => !note.is_private).slice(0, 5).map((note) => note.content),
      nextGoals: data.tasks.filter((task) => !task.completed && !task.assigned_to).slice(0, 3).map((task) => task.title),
    });
  })();

  function toggleCallInvitee(userId: string) {
    setCallInvitees((current) => {
      if (current.includes(userId)) return current.filter((id) => id !== userId);
      if (current.length >= 6) {
        showToast("Una chiamata può includere al massimo 7 persone.");
        return current;
      }
      return [...current, userId];
    });
  }

  async function prepareCall() {
    if (!data || actionPending || activeCall) return;
    const invitees = callInvitees.filter((userId) =>
      data.members.some((member) => member.user_id === userId && userId !== data.currentUserId),
    );
    if (!invitees.length) {
      showToast("Scegli almeno una persona da chiamare.");
      return;
    }
    setActionPending("call");
    try {
      const now = new Date().toISOString();
      if (isDemo) {
        const callId = crypto.randomUUID();
        const call: UiCallSession = {
          id: callId,
          room_id: roomId,
          started_by: data.currentUserId,
          call_kind: invitees.length === 1 ? "direct" : "group",
          status: "waiting",
          created_at: now,
          started_at: null,
          ended_at: null,
        };
        mutateDemo((current) => ({
          ...current,
          calls: [call, ...current.calls],
          callParticipants: [
            { call_id: callId, room_id: roomId, user_id: current.currentUserId, state: "joined", invited_by: current.currentUserId, invited_at: now, joined_at: now, left_at: null },
            ...invitees.map((userId) => ({ call_id: callId, room_id: roomId, user_id: userId, state: "invited" as const, invited_by: current.currentUserId, invited_at: now, joined_at: null, left_at: null })),
            ...current.callParticipants,
          ],
        }));
      } else if (liveClient) {
        await audioCall.prepareMicrophone();
        setCallMuted(false);
        const { data: createdCallId, error } = await liveClient.rpc("create_study_call", {
          p_room_id: roomId,
          p_invitee_ids: invitees,
        });
        if (error) throw error;
        if (!createdCallId) throw new Error("La chiamata non è stata creata.");
        await refreshRoom();
      } else {
        throw new Error("Chiamata non disponibile.");
      }
      setCallInvitees([]);
      await updateStatus("in_call", "Chiamata in uscita");
      const names = data.members.filter((member) => invitees.includes(member.user_id)).map((member) => member.display_name);
      showToast(`Sto chiamando ${names.join(", ")}.`);
    } catch (error) {
      audioCall.stopMedia();
      showToast(error instanceof Error ? error.message : "Chiamata non avviata.");
    } finally {
      setActionPending(null);
    }
  }

  async function respondToCall(accept: boolean) {
    if (!data || !activeCall || !incomingCall || actionPending) return;
    setActionPending("call");
    try {
      if (accept && !isDemo) {
        await audioCall.prepareMicrophone();
        setCallMuted(false);
      }
      if (isDemo) {
        const now = new Date().toISOString();
        mutateDemo((current) => ({
          ...current,
          calls: current.calls.map((call) => call.id === activeCall.id
            ? { ...call, status: accept ? "active" : "cancelled", started_at: accept ? (call.started_at ?? now) : call.started_at, ended_at: accept ? null : now }
            : call),
          callParticipants: current.callParticipants.map((participant) => participant.call_id === activeCall.id && participant.user_id === current.currentUserId
            ? { ...participant, state: accept ? "joined" : "declined", joined_at: accept ? now : participant.joined_at, left_at: accept ? null : now }
            : participant),
        }));
      } else if (liveClient) {
        const { error } = await liveClient.rpc("respond_to_study_call", {
          p_call_id: activeCall.id,
          p_accept: accept,
        });
        if (error) throw error;
        await refreshRoom();
      } else {
        throw new Error("Chiamata non disponibile.");
      }
      if (accept) {
        await updateStatus("in_call", "In chiamata");
        showToast("Chiamata accettata. Collegamento audio in corso…");
      } else {
        audioCall.stopMedia();
        showToast("Chiamata rifiutata.");
      }
    } catch (error) {
      if (accept) audioCall.stopMedia();
      showToast(error instanceof Error ? error.message : "Non è stato possibile rispondere.");
    } finally {
      setActionPending(null);
    }
  }

  async function endCall() {
    if (!data || !activeCall || actionPending) return;
    setActionPending("call");
    try {
      await audioCall.hangUpPeers(activeCall.id, joinedPeerIds);
      const endedAt = new Date().toISOString();
      if (isDemo) {
        mutateDemo((current) => ({
          ...current,
          calls: current.calls.map((call) => call.id === activeCall.id
            ? { ...call, status: "ended", ended_at: endedAt }
            : call),
          callParticipants: current.callParticipants.map((participant) => participant.call_id === activeCall.id && (activeCall.call_kind === "direct" || participant.user_id === current.currentUserId)
            ? { ...participant, state: "left", left_at: endedAt }
            : participant),
        }));
      } else if (liveClient) {
        const { error } = await liveClient.rpc("leave_study_call", { p_call_id: activeCall.id });
        if (error) throw error;
        await refreshRoom();
      } else {
        throw new Error("Chiamata non disponibile.");
      }
      setCallMuted(true);
      await updateStatus("online", null);
      showToast(activeCall.call_kind === "group" ? "Hai lasciato la chiamata." : "Chiamata terminata.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Non è stato possibile chiudere la chiamata.");
    } finally {
      setActionPending(null);
    }
  }

  function bindRemoteAudio(userId: string, stream: MediaStream, element: HTMLAudioElement | null) {
    if (!element) {
      remoteAudioElements.current.delete(userId);
      return;
    }
    remoteAudioElements.current.set(userId, element);
    if (element.srcObject !== stream) element.srcObject = stream;
    element.volume = callVolume / 100;
    void element.play().then(() => setSpeakerBlocked(false)).catch(() => setSpeakerBlocked(true));
  }

  async function activateSpeaker() {
    const results = await Promise.allSettled(
      [...remoteAudioElements.current.values()].map((element) => element.play()),
    );
    setSpeakerBlocked(results.some((result) => result.status === "rejected"));
  }

  if (loading) return <main className="grid min-h-screen place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-moss-700" /><p className="mt-3 text-sm text-black/45">Apro la stanza…</p></div></main>;
  if (accessError || !data) return <main className="grid min-h-screen place-items-center px-5"><div className="panel max-w-md p-8 text-center"><WifiOff className="mx-auto text-apricot" /><h1 className="mt-4 text-xl font-bold">Non posso aprire questa stanza</h1><p className="mt-2 text-sm leading-6 text-black/48">{accessError ?? "Configura Supabase oppure usa la stanza demo."}</p><Link href="/dashboard" className="button-primary mt-6"><ArrowLeft size={15} /> Torna alle stanze</Link></div></main>;

  const connectionState = isDemo ? "connected" : realtime.connectionState;

  return (
    <main className="min-h-screen bg-[#f1f2ed] p-2 sm:p-3 lg:h-screen lg:overflow-hidden">
      {toast && <div role="status" className="fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-center text-xs font-semibold text-white shadow-soft">{toast}</div>}

      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1800px] flex-col overflow-hidden rounded-[1.6rem] border border-black/[0.07] bg-paper shadow-soft lg:h-[calc(100vh-1.5rem)] lg:min-h-0">
        <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" aria-label="Torna alle stanze" className="grid size-9 shrink-0 place-items-center rounded-xl border border-black/[0.07] bg-white text-black/50 hover:text-ink"><ArrowLeft size={17} /></Link>
            <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-moss-700">Aula condivisa · {data.room.invite_code}</p><h1 className="truncate text-base font-bold sm:text-lg">{data.room.name}</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={clsx("hidden items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold sm:flex", connectionState === "connected" ? "bg-moss-50 text-moss-700" : "bg-amber-50 text-amber-700")}>
              {connectionState === "connected" ? <Wifi size={14} /> : <WifiOff size={14} />}{connectionState === "connected" ? "In sincronia" : connectionState === "offline" ? "Offline · salvo in locale" : "Riconnessione…"}
            </div>
            <Link href={`/catalog?roomId=${roomId}`} aria-label="Apri catalogo" className="button-secondary px-3">
              <BookOpen size={15} />
              <span className="hidden md:inline">Catalogo</span>
            </Link>
            <button
              onClick={() => {
                if (callPanelOpen) {
                  setCallPanelOpen(false);
                  return;
                }
                setCallPanelOpen(true);
                setCallPanelMinimized(false);
              }}
              aria-expanded={callPanelOpen}
              aria-controls="call-control-panel"
              aria-label="Chiamata"
              className={clsx("button-secondary relative px-3", callPanelOpen && "border-moss-300 bg-moss-50 text-moss-800")}
            >
              <Phone size={15} />
              <span className="hidden md:inline">Chiamata</span>
              {activeCall && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-moss-500" />}
            </button>
            <button onClick={() => setSummaryOpen(true)} aria-label="Apri riepilogo automatico per Tatiana" className="button-primary px-3"><Sparkles size={15} /><span className="hidden md:inline">Riepilogo per Tatiana</span></button>
            <Link href={`/room/${roomId}/settings`} aria-label="Impostazioni" className="grid size-10 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/50 hover:text-ink"><Settings size={17} /></Link>
          </div>
        </header>

        <nav aria-label="Strumenti dell’aula" className="border-b border-black/[0.06] bg-white/90 px-2 py-2 sm:px-4">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {([
              ["courses", "Corsi", <BookOpen key="courses" size={14} />],
              ["materials", "Materiali", <FileText key="materials" size={14} />],
              ["checklist", "Checklist", <ListChecks key="checklist" size={14} />],
              ["progress", "Progressi", <Target key="progress" size={14} />],
              ["notes", "Appunti", <StickyNote key="notes" size={14} />],
              ["participants", "Partecipanti", <Users key="participants" size={14} />],
              ["activity", "Attività recente", <Activity key="activity" size={14} />],
              ["timer", "Timer", <Clock3 key="timer" size={14} />],
              ["chat", "Chat", <span key="chat" className="relative"><MessageCircle size={14} />{unreadCount > 0 && <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-apricot px-1 text-[7px] font-black text-ink">{unreadCount}</span>}</span>],
            ] as Array<[RoomTool, string, React.ReactNode]>).map(([tool, label, icon]) => (
              <button key={tool} onClick={() => setActiveTool((current) => current === tool ? null : tool)} aria-expanded={activeTool === tool} aria-controls={`room-tool-${tool}`} className={clsx("flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500", activeTool === tool ? "border-moss-300 bg-moss-50 text-moss-800" : "border-transparent bg-black/[0.025] text-black/55 hover:bg-black/[0.05]")}>{icon}{label}</button>
            ))}
          </div>
        </nav>

        <div className={clsx("relative grid flex-1 bg-black/[0.04] lg:min-h-0", ["courses", "materials", "checklist"].includes(activeTool ?? "") && "lg:grid-cols-[340px_minmax(0,1fr)]", ["participants", "activity", "timer", "chat"].includes(activeTool ?? "") && "lg:grid-cols-[minmax(0,1fr)_340px]")}> 
          <aside id="room-tool-left" aria-label="Pannello strumenti" className={clsx("fixed inset-x-2 bottom-2 top-[9.5rem] z-50 space-y-px overflow-y-auto rounded-2xl border border-black/[0.08] bg-white shadow-2xl lg:static lg:z-auto lg:rounded-none lg:border-0 lg:shadow-none", !["courses", "materials", "checklist"].includes(activeTool ?? "") && "hidden")}>
            <section id="room-tool-courses" className={clsx("bg-white/95 p-5", activeTool !== "courses" && "hidden")}>
              {panelTitle("Corsi", <div className="flex gap-1"><button onClick={addCourse} aria-label="Aggiungi corso" className="grid size-8 place-items-center rounded-lg bg-moss-50 text-moss-700 hover:bg-moss-100"><Plus size={14} /></button><button onClick={() => setActiveTool(null)} aria-label="Chiudi corsi" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
              <div className="mt-4 space-y-2">
                {data.courses.map((course) => {
                  const entries = data.progress.filter((entry) => entry.course_id === course.id);
                  const average = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.progress_percentage, 0) / entries.length) : 0;
                  const canRemove = isDemo || self?.role === "owner" || self?.role === "admin" || course.created_by === data.currentUserId;
                  return <article key={course.id} className={clsx("relative flex items-stretch rounded-2xl border transition", selectedCourse?.id === course.id ? "border-moss-200 bg-moss-50" : "border-transparent bg-white hover:border-black/[0.06]")}><button onClick={() => { setSelectedCourseId(course.id); const first = data.materials.find((material) => material.course_id === course.id); setSelectedMaterialId(first?.id ?? null); setActiveTool("materials"); }} className="min-w-0 flex-1 p-3.5 text-left"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-bold">{course.title}</p><span className="text-[10px] font-bold text-moss-700">{average}%</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/[0.07]"><div className="h-full rounded-full bg-moss-500 transition-all" style={{ width: `${average}%` }} /></div></button>{canRemove && <div className="relative flex items-start p-2"><button onClick={() => setCourseMenuId((current) => current === course.id ? null : course.id)} aria-label={`Azioni corso ${course.title}`} aria-expanded={courseMenuId === course.id} className="grid size-8 place-items-center rounded-lg text-black/35 hover:bg-black/[0.05] hover:text-ink"><MoreVertical size={15} /></button>{courseMenuId === course.id && <div className="absolute right-2 top-10 z-20 w-48 rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl"><button onClick={() => void requestCourseRemoval(course)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-red-700 hover:bg-red-50"><Trash2 size={13} />Rimuovi dall’aula</button></div>}</div>}</article>;
                })}
                {!data.courses.length && <p className="rounded-xl bg-black/[0.025] p-3 text-xs leading-5 text-black/40">Aggiungi il primo corso per organizzare materiali e progressi.</p>}
              </div>
            </section>

            <section id="room-tool-materials" className={clsx("bg-white/95 p-5", activeTool !== "materials" && "hidden")}>
              {panelTitle("Materiali", <div className="flex gap-1"><button onClick={() => setMaterialFormOpen((value) => !value)} aria-label="Aggiungi link" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45 hover:text-moss-700"><Link2 size={13} /></button><button onClick={() => fileInput.current?.click()} aria-label="Carica file" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45 hover:text-moss-700">{actionPending === "upload" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}</button><input ref={fileInput} type="file" accept=".pdf,.txt,.docx,.pptx" className="hidden" onChange={(event) => void uploadMaterial(event.target.files?.[0])} /><button onClick={() => setActiveTool(null)} aria-label="Chiudi materiali" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
              {materialFormOpen && <form onSubmit={addLinkMaterial} className="mt-3 space-y-2 rounded-xl bg-moss-50 p-3"><input className="field py-2 text-xs" placeholder="Titolo" maxLength={120} value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} required /><input className="field py-2 text-xs" placeholder="https://…" type="url" maxLength={2000} value={materialUrl} onChange={(event) => setMaterialUrl(event.target.value)} required /><button className="button-primary w-full py-2 text-xs">Aggiungi link</button></form>}
              <div className="mt-4 space-y-1.5">
                {courseMaterials.map((material) => { const canRemove = isDemo || self?.role === "owner" || self?.role === "admin" || material.created_by === data.currentUserId; return <article key={material.id} className={clsx("relative flex items-center rounded-xl transition", selectedMaterial?.id === material.id ? "bg-ink text-white" : "hover:bg-black/[0.035]")}><button onClick={() => { setSelectedMaterialId(material.id); setActiveTool(null); }} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left"><span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg", selectedMaterial?.id === material.id ? "bg-white/10" : material.type === "link" ? "bg-sky/20 text-[#477483]" : "bg-[#f4e5d7] text-[#9a5d2b]")}>{material.type === "link" ? <Link2 size={14} /> : material.type === "pdf" ? <FileText size={14} /> : <FileIcon size={14} />}</span><span className="min-w-0"><span className="block truncate text-[11px] font-bold">{material.title}</span><span className={clsx("mt-0.5 block text-[9px]", selectedMaterial?.id === material.id ? "text-white/45" : "text-black/35")}>{material.monitoring_level === "full" ? "Monitoraggio completo" : material.monitoring_level === "partial" ? "Monitoraggio parziale" : material.import_status === "pending" ? "Importazione richiesta" : material.type.toUpperCase()}</span></span></button>{canRemove && <div className="relative pr-2"><button onClick={() => setMaterialMenuId((current) => current === material.id ? null : material.id)} aria-label={`Azioni materiale ${material.title}`} aria-expanded={materialMenuId === material.id} className={clsx("grid size-8 place-items-center rounded-lg", selectedMaterial?.id === material.id ? "text-white/55 hover:bg-white/10" : "text-black/35 hover:bg-black/[0.05]")}><MoreVertical size={15} /></button>{materialMenuId === material.id && <div className="absolute right-2 top-9 z-20 w-48 rounded-xl border border-black/[0.08] bg-white p-1.5 text-ink shadow-xl"><button onClick={() => void openMaterial(material)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold hover:bg-black/[0.035]"><BookOpen size={13} />Studia nel workspace</button><button onClick={() => void requestMaterialRemoval(material)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-red-700 hover:bg-red-50"><Trash2 size={13} />Rimuovi dall’aula</button></div>}</div>}</article>; })}
                {!courseMaterials.length && <p className="py-3 text-center text-[11px] text-black/35">Nessun materiale</p>}
              </div>
            </section>

            <section id="room-tool-checklist" className={clsx("bg-white/95 p-5", activeTool !== "checklist" && "hidden")}>
              {panelTitle("Checklist", <div className="flex items-center gap-2"><span className="text-[10px] font-semibold text-black/35">{data.tasks.filter((task) => task.completed).length}/{data.tasks.length}</span><button onClick={() => setActiveTool(null)} aria-label="Chiudi checklist" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
              <form onSubmit={addTask} className="mt-3 space-y-2 rounded-2xl bg-black/[0.025] p-2.5">
                <div className="flex gap-1.5"><input className="field py-2 text-xs" value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} maxLength={180} placeholder="Nuova attivita…" required /><button disabled={actionPending === "task"} aria-label="Aggiungi attivita" className="grid size-9 shrink-0 place-items-center rounded-xl bg-moss-700 text-white disabled:opacity-50">{actionPending === "task" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}</button></div>
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="text-[8px] font-bold uppercase tracking-wide text-black/35">Assegna a<select data-testid="task-assignee" value={taskAssignedTo} onChange={(event) => setTaskAssignedTo(event.target.value)} className="mt-1 w-full rounded-lg border-black/[0.07] bg-white py-1.5 pl-2 pr-6 text-[10px] font-semibold normal-case tracking-normal focus:border-moss-500 focus:ring-moss-500/20"><option value="everyone">Entrambi</option>{data.members.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select></label>
                  <label className="text-[8px] font-bold uppercase tracking-wide text-black/35">Priorita<select data-testid="task-priority" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as "low" | "medium" | "high")} className="mt-1 w-full rounded-lg border-black/[0.07] bg-white py-1.5 pl-2 pr-6 text-[10px] font-semibold normal-case tracking-normal focus:border-moss-500 focus:ring-moss-500/20"><option value="low">Bassa</option><option value="medium">Media</option><option value="high">Alta</option></select></label>
                </div>
                <label className="block text-[8px] font-bold uppercase tracking-wide text-black/35">Scadenza facoltativa<input data-testid="task-due-at" type="date" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} className="mt-1 w-full rounded-lg border-black/[0.07] bg-white px-2 py-1.5 text-[10px] font-semibold normal-case tracking-normal focus:border-moss-500 focus:ring-moss-500/20" /></label>
              </form>
              <div className="mt-3 space-y-1">
                {data.tasks.map((task) => {
                  const assignee = data.members.find((member) => member.user_id === task.assigned_to);
                   return <label key={task.id} className="flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 hover:bg-black/[0.025]"><input className="sr-only" type="checkbox" checked={task.completed} onChange={(event) => void toggleTask(task.id, event.target.checked)} /><span className={clsx("mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border", task.completed ? "border-moss-600 bg-moss-600 text-white" : "border-black/20")}>{task.completed && <Check size={11} strokeWidth={3} />}</span><span className="min-w-0"><span className={clsx("block text-[11px] font-semibold leading-4", task.completed && "text-black/35 line-through")}>{task.title}</span>{task.description && <span className="mt-0.5 line-clamp-2 block text-[9px] leading-4 text-black/42">{task.description}</span>}<span className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-black/35"><span className={clsx("size-1.5 rounded-full", task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-apricot" : "bg-sky")} />{task.task_type && <span className="font-bold uppercase tracking-wide text-moss-700">{task.task_type === "lesson" ? "Lezione" : task.task_type === "exercise" ? "Esercizio" : task.task_type === "project" ? "Progetto" : "Verifica"}</span>}{task.estimated_minutes ? <span>· {task.estimated_minutes} min</span> : null}<span>· {assignee ? assignee.display_name : "Entrambi"}</span>{task.due_at ? ` · ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(new Date(task.due_at))}` : ""}</span></span></label>;
                })}
              </div>
            </section>
          </aside>

          <section id="room-workspace" aria-label="Area di lavoro" className="min-w-0 space-y-px bg-black/[0.05] lg:overflow-y-auto">
            <div className={clsx("min-h-full bg-paper p-4 sm:p-6", (activeTool === "progress" || activeTool === "notes") && "hidden")}>
              <div className="overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white shadow-card">
                <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] p-5 sm:p-6">
                  <div className="min-w-0"><p className="eyebrow">Materiale selezionato</p><h2 className="mt-2 truncate font-[family-name:var(--font-serif)] text-2xl font-medium sm:text-3xl">{selectedMaterial?.title ?? "Scegli un materiale"}</h2><p className="mt-2 text-xs leading-5 text-black/42">{selectedMaterial?.description ?? selectedCourse?.description ?? "Tutto quello che serve per la prossima sessione."}</p></div>
                </div>
                {!selectedMaterial && <div className="relative grid min-h-[240px] place-items-center overflow-hidden bg-[#eef1ea] p-7 text-center sm:min-h-[290px]">
                  <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "radial-gradient(#7ca575 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} />
                  <div className="relative max-w-md">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-moss-700 shadow-card"><FileText size={22} /></span>
                    <p className="mt-5 text-sm font-bold">{selectedCourse ? `Continua ${selectedCourse.title}` : "Prepara la tua area di studio"}</p>
                    <p className="mt-2 text-xs leading-5 text-black/42">{selectedCourse ? "Scegli il prossimo materiale oppure controlla le attività previste per questo corso." : "Apri i corsi, aggiungi una risorsa o prepara la checklist della prossima sessione."}</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2"><button onClick={() => setActiveTool("courses")} className="button-secondary px-3 py-2 text-[10px]"><BookOpen size={13} /> Corsi</button><button onClick={() => setActiveTool("materials")} className="button-primary px-3 py-2 text-[10px]"><FileText size={13} /> Materiali</button><button onClick={() => setActiveTool("checklist")} className="button-secondary px-3 py-2 text-[10px]"><ListChecks size={13} /> Checklist</button></div>
                  </div>
                </div>}
                {selectedMaterial && isDemo && <div className="grid min-h-[360px] place-items-center bg-[#eef1ea] p-7 text-center"><div><BookOpen className="mx-auto text-moss-700" /><p className="mt-3 text-sm font-bold">Viewer interno disponibile con Supabase</p><p className="mt-1 text-xs text-black/45">La demo non scarica risorse esterne né file privati.</p></div></div>}
                {selectedMaterial && !isDemo && <MaterialWorkspaceViewer roomId={roomId} material={selectedMaterial} onUploadRequested={() => fileInput.current?.click()} onChooseAlternative={() => setActiveTool("materials")} />}
              </div>
            </div>

            <div id="room-tool-progress" className={clsx("min-h-full gap-px bg-black/[0.05] md:grid-cols-2", activeTool === "progress" ? "grid" : "hidden")}>
              <section className="bg-white/80 p-5 sm:p-6">
                {panelTitle("Il tuo progresso", <div className="flex items-center gap-2"><span className="rounded-full bg-moss-50 px-2.5 py-1 text-[10px] font-bold text-moss-700">{progressDraft}% manuale</span><button onClick={() => setActiveTool(null)} aria-label="Chiudi progressi" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
                <form onSubmit={(event) => { event.preventDefault(); void saveProgress(); }} className="mt-5 space-y-3">
                  <div className="rounded-xl bg-sky/20 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold text-[#365d68]">Monitoraggio automatico attivo</span><strong className="text-xs text-[#365d68]">{currentCompletedTasks.length}/{currentTrackedTasks.length} · {automaticTaskProgress}%</strong></div><p className="mt-1 text-[9px] leading-4 text-[#365d68]/70">Timer, materiali e checklist aggiornano attivita recente e riepilogo senza compilare questo modulo.</p></div>
                  <div><input aria-label="Percentuale completata" type="range" min="0" max="100" value={progressDraft} onChange={(event) => setProgressDraft(Number(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-black/[0.08] accent-moss-600" /><div className="mt-2 flex justify-between text-[9px] font-semibold text-black/30"><span>Inizio</span><span>Meta</span><span>Completato</span></div></div>
                  <div className="flex items-center justify-between rounded-xl bg-moss-50 px-3 py-2.5"><span className="text-[10px] font-semibold text-moss-800">Tempo registrato dal timer</span><strong className="text-xs text-moss-800">{sessionStudyMinutes} min · {data.sessions.filter((session) => session.user_id === data.currentUserId).length} sessioni</strong></div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-[9px] font-semibold text-black/45">Capitolo<input className="field mt-1 py-2 text-xs" maxLength={160} value={progressChapter} onChange={(event) => setProgressChapter(event.target.value)} placeholder="Es. Capitolo 2" /></label>
                    <label className="text-[9px] font-semibold text-black/45">Lezione<input className="field mt-1 py-2 text-xs" maxLength={240} value={progressLesson} onChange={(event) => setProgressLesson(event.target.value)} placeholder="Lezione corrente" /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[9px] font-semibold text-black/45">Esercizi<input className="field mt-1 py-2 text-xs" type="number" min="0" step="1" value={progressExercises} onChange={(event) => setProgressExercises(event.target.value)} required /></label>
                    <label className="text-[9px] font-semibold text-black/45">Punteggio<input className="field mt-1 py-2 text-xs" type="number" min="0" step="0.01" value={progressScore} onChange={(event) => setProgressScore(event.target.value)} placeholder="—" /></label>
                  </div>
                  <label className="block text-[9px] font-semibold text-black/45">Note personali<textarea className="field mt-1 resize-y py-2 text-xs" rows={2} maxLength={8000} value={progressNotes} onChange={(event) => setProgressNotes(event.target.value)} placeholder="Difficolta, concetti da ripassare…" /></label>
                  <label className="block text-[9px] font-semibold text-black/45">Obiettivo successivo<textarea className="field mt-1 resize-y py-2 text-xs" rows={2} maxLength={1000} value={progressNextGoal} onChange={(event) => setProgressNextGoal(event.target.value)} placeholder="Il prossimo passo concreto" /></label>
                  <button type="submit" disabled={actionPending === "progress"} className="button-secondary w-full py-2 text-xs">{actionPending === "progress" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Salva aggiornamento</button>
                </form>
              </section>

              <section className="bg-white/80 p-5 sm:p-6">
                {panelTitle("Stessa direzione", <Target size={14} className="text-apricot" />)}
                <div className="mt-5 space-y-4">{data.members.slice(0, 3).map((member, index) => {
                  const value = data.progress.find((entry) => entry.user_id === member.user_id && entry.course_id === selectedCourse?.id)?.progress_percentage ?? 0;
                  return <div key={member.user_id}><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="flex items-center gap-2 font-bold"><span className={clsx("grid size-6 place-items-center rounded-full text-[8px]", index % 2 ? "bg-sky/30" : "bg-[#ead3c3]")}>{initials(member.display_name)}</span>{member.display_name}</span><span className="font-bold text-black/45">{value}%</span></div><div className="h-1.5 rounded-full bg-black/[0.06]"><div className={clsx("h-full rounded-full", index % 2 ? "bg-sky" : "bg-moss-500")} style={{ width: `${value}%` }} /></div></div>;
                })}</div>
                <p className="mt-5 rounded-xl bg-[#fff7ed] px-3 py-2.5 text-[10px] leading-4 text-[#81502d]">Ognuno al proprio ritmo. Il confronto serve solo a sostenervi.</p>
              </section>
            </div>

            <section id="room-tool-notes" className={clsx("min-h-full bg-white/80 p-5 sm:p-6", activeTool !== "notes" && "hidden")}>
              {panelTitle("Appunti", <div className="flex items-center gap-2"><span className="text-[10px] text-black/35">Condivisi salvo tua scelta</span><button onClick={() => setActiveTool(null)} aria-label="Chiudi appunti" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
              <form onSubmit={addNote} className="mt-4 rounded-2xl border border-black/[0.07] bg-white p-3"><textarea className="w-full resize-none border-0 bg-transparent p-1 text-sm placeholder:text-black/30 focus:ring-0" rows={2} maxLength={2000} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Scrivi una spiegazione, un dubbio o un collegamento…" /><div className="mt-2 flex items-center justify-between border-t border-black/[0.05] pt-2"><label className="flex items-center gap-2 text-[10px] font-semibold text-black/45"><input type="checkbox" checked={notePrivate} onChange={(event) => setNotePrivate(event.target.checked)} className="rounded border-black/15 text-moss-600 focus:ring-moss-500" /> Solo per me</label><button className="button-primary px-3 py-1.5 text-[10px]">Aggiungi nota</button></div></form>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{data.notes.filter((note) => !note.is_private || note.user_id === data.currentUserId).slice(0, 6).map((note) => { const author = data.members.find((member) => member.user_id === note.user_id); return <article key={note.id} className="rounded-2xl border border-black/[0.055] bg-[#fffefa] p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-moss-700">{note.is_private ? "Privata" : author?.display_name ?? "Partecipante"}</span><span className="text-[9px] text-black/30">{relativeTime(note.updated_at)}</span></div><p className="mt-2 text-xs leading-5 text-black/66">{note.content}</p></article>; })}</div>
            </section>
          </section>

          <aside id="room-tool-right" aria-label="Pannello informazioni" className={clsx("fixed inset-x-2 bottom-2 top-[9.5rem] z-50 space-y-px overflow-y-auto rounded-2xl border border-black/[0.08] bg-white shadow-2xl lg:static lg:z-auto lg:rounded-none lg:border-0 lg:shadow-none", !["participants", "activity", "timer", "chat"].includes(activeTool ?? "") && "hidden")}> 
            <section id="room-tool-participants" className={clsx("bg-white/95 p-5", activeTool !== "participants" && "hidden")}>
              {panelTitle("In aula", <div className="flex items-center gap-2"><span className="flex items-center gap-1.5 text-[10px] font-bold text-moss-700"><span className="presence-pulse size-1.5 rounded-full bg-moss-500" />{data.members.filter((member) => member.status !== "offline").length} presenti</span><button onClick={() => setActiveTool(null)} aria-label="Chiudi partecipanti" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
              <div className="mt-4 space-y-3">{data.members.map((member, index) => <div key={member.user_id} className="flex items-center gap-3"><div className={clsx("relative grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-bold", index % 2 ? "bg-sky/30" : "bg-[#ead3c3]")}>{initials(member.display_name)}<span className={clsx("absolute bottom-0 right-0 size-3 rounded-full border-2 border-white", statusColors[member.status])} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-bold">{member.display_name}{member.user_id === data.currentUserId ? " · tu" : ""}</p><span className="text-[8px] text-black/25">{member.device_label}</span></div><p className={clsx("mt-0.5 truncate text-[9px] font-semibold", member.status === "studying" ? "text-moss-700" : "text-black/38")}>{statusLabels[member.status]}{member.current_activity ? ` · ${member.current_activity}` : ""}</p></div></div>)}</div>
              <label className="mt-4 block"><span className="sr-only">Il mio stato</span><select disabled={!sharePresence} value={self?.status === "offline" ? "online" : self?.status ?? "online"} onChange={(event) => void updateStatus(event.target.value as UiStatus)} className="w-full rounded-xl border-black/[0.07] bg-black/[0.025] py-2 pl-3 pr-8 text-[10px] font-semibold focus:border-moss-500 focus:ring-moss-500/20 disabled:cursor-not-allowed disabled:opacity-50"><option value="online">Online</option><option value="studying">Sto studiando</option><option value="break">In pausa</option><option value="away">Assente</option><option value="in_call">In chiamata</option></select></label>
              {!sharePresence && <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[9px] leading-4 text-amber-800">La condivisione dello stato è disattivata nelle impostazioni.</p>}
            </section>

            <section id="room-tool-timer" className={clsx("relative bg-ink p-5 text-white", activeTool !== "timer" && "hidden")}>
              <button onClick={() => setActiveTool(null)} aria-label="Chiudi timer" className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-white/[0.07] text-white/55 hover:text-white"><X size={14} /></button>
              <div className="flex items-center justify-between gap-2 pr-9"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/45">Timer di studio</p><div className="flex rounded-lg bg-white/[0.07] p-0.5"><button disabled={Boolean(activeSession)} onClick={() => setTimerMode("pomodoro")} className={clsx("rounded-md px-2 py-1 text-[8px] font-bold disabled:cursor-not-allowed", timerMode === "pomodoro" && "bg-white text-ink")}>25 min</button><button disabled={Boolean(activeSession)} onClick={() => setTimerMode("libero")} className={clsx("rounded-md px-2 py-1 text-[8px] font-bold disabled:cursor-not-allowed", timerMode === "libero" && "bg-white text-ink")}>Libero</button></div></div>
              <p className="mt-5 text-center font-mono text-4xl font-medium tracking-tight">{formatClock(timerMode === "pomodoro" && activeSession ? Math.max(0, 25 * 60 - elapsedSeconds) : elapsedSeconds)}</p>
              <p className="mt-1 text-center text-[9px] text-white/38">{activeSession?.status === "running" ? "Sessione in corso · il server tiene il tempo" : activeSession?.status === "paused" ? "In pausa · il tempo e al sicuro" : timerMode === "pomodoro" ? "Pronto per un focus da 25 minuti" : "Pronto quando vuoi"}</p>
              <div className="mt-5 flex justify-center gap-2">{!activeSession && <button onClick={() => void timerAction("start")} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-bold text-ink"><Play size={13} fill="currentColor" /> Avvia</button>}{activeSession?.status === "running" && <button onClick={() => void timerAction("pause")} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-bold text-ink"><Pause size={13} fill="currentColor" /> Pausa</button>}{activeSession?.status === "paused" && <button onClick={() => void timerAction("resume")} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-bold text-ink"><Play size={13} fill="currentColor" /> Riprendi</button>}{activeSession && <button onClick={() => void timerAction("complete")} aria-label="Termina sessione" className="grid size-9 place-items-center rounded-xl border border-white/15 text-white/60 hover:text-white"><Square size={12} fill="currentColor" /></button>}</div>
              {data.members.some((member) => member.user_id !== data.currentUserId && member.status === "studying") && <p className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-moss-200"><Users size={11} /> Qualcuno sta studiando con te</p>}
            </section>

            <section id="room-tool-chat" className={clsx("min-h-[330px] flex-col bg-white/90 p-5", activeTool === "chat" ? "flex" : "hidden")}>
              {panelTitle("Chat", <div className="flex items-center gap-2"><span className={clsx("rounded-full px-2 py-0.5 text-[9px] font-bold", unreadCount ? "bg-apricot text-ink" : "bg-moss-100 text-moss-700")}>{unreadCount ? `${unreadCount} non lett${unreadCount === 1 ? "o" : "i"}` : "Live"}</span><button onClick={() => setActiveTool(null)} aria-label="Chiudi chat" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button></div>)}
              <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">{data.messages.slice(-30).map((message) => { const mine = message.sender_id === data.currentUserId; const author = data.members.find((member) => member.user_id === message.sender_id); return <div key={message.id} className={clsx("flex", mine ? "justify-end" : "justify-start")}><div className={clsx("max-w-[86%] rounded-2xl px-3 py-2.5 text-[11px] leading-4", mine ? "rounded-br-md bg-moss-700 text-white" : "rounded-bl-md bg-black/[0.045] text-black/70")}><p className={clsx("mb-1 text-[8px] font-bold", mine ? "text-white/55" : "text-moss-700")}>{mine ? "Tu" : author?.display_name ?? "Partecipante"} · {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at))}</p><p><MessageContent content={message.content} /></p></div></div>; })}</div>
              <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2 rounded-2xl border border-black/[0.07] bg-white p-1.5"><textarea aria-label="Messaggio" rows={1} maxLength={1000} value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Scrivi un messaggio…" className="max-h-24 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[11px] placeholder:text-black/30 focus:ring-0" /><button aria-label="Invia" className="grid size-8 shrink-0 place-items-center rounded-xl bg-moss-700 text-white"><Send size={13} /></button></form>
            </section>

            <section id="room-tool-activity" className={clsx("bg-white/95 p-5", activeTool !== "activity" && "hidden")}>
              {panelTitle("Attività recente", <button onClick={() => setActiveTool(null)} aria-label="Chiudi attività recente" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><X size={14} /></button>)}
              <div className="mt-4 space-y-3">{data.activities.slice(0, 7).map((item, index) => { const author = data.members.find((member) => member.user_id === item.user_id); const label = typeof item.data.label === "string" ? item.data.label : activityLabels[item.event_type] ?? "ha aggiornato la stanza"; return <div key={item.id} className="relative flex gap-3"><div className="relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-moss-50 text-moss-700">{item.event_type.includes("completed") ? <Check size={10} /> : item.event_type.includes("material") ? <BookOpen size={10} /> : <Circle size={7} fill="currentColor" />}</div>{index < Math.min(data.activities.length, 7) - 1 && <span className="absolute left-[11px] top-6 h-5 w-px bg-black/[0.07]" />}<div><p className="text-[10px] leading-4 text-black/55"><strong className="font-bold text-ink">{author?.display_name ?? "Partecipante"}</strong> {label.replace(/^(ha\s+)/, "")}</p><p className="mt-0.5 text-[8px] text-black/28">{relativeTime(item.created_at)}</p></div></div>; })}</div>
            </section>
          </aside>
        </div>
      </div>

      {callPanelOpen && <section id="call-control-panel" aria-label="Controlli chiamata" className={clsx("fixed right-3 top-24 z-[75] w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl transition-[width] sm:right-5", callPanelMinimized ? "sm:w-72" : "sm:w-[22rem]")}>
        {audioCall.remoteStreams.map(({ userId, stream }) => <audio key={userId} ref={(element) => bindRemoteAudio(userId, stream, element)} autoPlay playsInline className="hidden" />)}
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-ink px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className={clsx("grid size-8 place-items-center rounded-full", activeCall ? "bg-moss-500" : "bg-white/10")}><Phone size={14} /></span>
            <div><h2 className="text-xs font-bold">Chiamata</h2><p className="mt-0.5 text-[9px] text-white/50">{!activeCall ? "Scegli chi chiamare" : incomingCall ? `${callStarter?.display_name ?? "Un partecipante"} ti sta chiamando` : activeCall.status === "active" ? "Chiamata in corso" : "Chiamata in uscita…"}</p></div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCallPanelMinimized((minimized) => !minimized)} aria-label={callPanelMinimized ? "Espandi controlli chiamata" : "Minimizza controlli chiamata"} aria-expanded={!callPanelMinimized} className="grid size-8 place-items-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white">{callPanelMinimized ? <Maximize2 size={14} /> : <Minus size={15} />}</button>
            <button onClick={() => setCallPanelOpen(false)} aria-label="Chiudi controlli chiamata" className="grid size-8 place-items-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white"><X size={15} /></button>
          </div>
        </div>

        {!callPanelMinimized && <div className="space-y-4 p-4">
          {!activeCall && <>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[11px] font-bold">Chi vuoi chiamare?</p><p className="mt-0.5 text-[9px] text-black/40">Una persona oppure più persone insieme.</p></div>
              {callableMembers.length > 1 && <button onClick={() => setCallInvitees(callInvitees.length === Math.min(callableMembers.length, 6) ? [] : callableMembers.slice(0, 6).map((member) => member.user_id))} className="text-[9px] font-bold text-moss-700">{callInvitees.length === Math.min(callableMembers.length, 6) ? "Deseleziona" : "Seleziona tutti"}</button>}
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {callableMembers.map((member) => { const selected = callInvitees.includes(member.user_id); return <button key={member.user_id} onClick={() => toggleCallInvitee(member.user_id)} aria-pressed={selected} className={clsx("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", selected ? "border-moss-200 bg-moss-50" : "border-black/[0.06] bg-white hover:border-moss-100")}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ead3c3] text-[9px] font-bold">{initials(member.display_name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold">{member.display_name}</span><span className="mt-0.5 block text-[8px] text-black/38">{statusLabels[member.status]}</span></span><span className={clsx("grid size-5 place-items-center rounded-md border", selected ? "border-moss-600 bg-moss-600 text-white" : "border-black/10 text-transparent")}><Check size={11} /></span></button>; })}
              {!callableMembers.length && <p className="rounded-xl bg-black/[0.03] p-4 text-center text-[10px] leading-5 text-black/42">Invita prima un altro partecipante nella stanza.</p>}
            </div>
            <p className="rounded-xl bg-sky/15 px-3 py-2 text-[9px] leading-4 text-black/48"><Mic size={11} className="mr-1 inline" />Il browser chiederà il permesso del microfono prima di far squillare gli altri.</p>
            <button onClick={() => void prepareCall()} disabled={actionPending === "call" || !callInvitees.length} className="button-primary w-full py-2.5 text-xs">{actionPending === "call" ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />} {callInvitees.length > 1 ? `Avvia chiamata di gruppo (${callInvitees.length + 1})` : callInvitees.length === 1 ? `Chiama ${data.members.find((member) => member.user_id === callInvitees[0])?.display_name ?? "partecipante"}` : "Scegli un partecipante"}</button>
          </>}

          {activeCall && <>
            <div className="rounded-xl bg-moss-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">{activeCallMembers.slice(0, 4).map((member, index) => <span key={member.user_id} className={clsx("grid size-8 place-items-center rounded-full border-2 border-white text-[9px] font-bold", index % 2 ? "bg-sky/40" : "bg-[#ead3c3]")}>{initials(member.display_name)}</span>)}</div>
                <div className="min-w-0"><p className="truncate text-[11px] font-bold">{activeCall.call_kind === "group" ? "Chiamata di gruppo" : `Chiamata con ${activeCallMembers.find((member) => member.user_id !== currentUserId)?.display_name ?? callStarter?.display_name ?? "partecipante"}`}</p><p className="mt-0.5 text-[9px] text-black/40">Solo audio · nessuna registrazione.</p></div>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-black/[0.06] pt-2.5">{activeCallParticipants.map((participant) => { const member = data.members.find((item) => item.user_id === participant.user_id); const label = participant.state === "joined" ? "In chiamata" : participant.state === "invited" ? "Sta squillando" : participant.state === "declined" ? "Ha rifiutato" : "Ha lasciato"; return <div key={participant.user_id} className="flex items-center justify-between gap-2 text-[9px]"><span className="truncate font-semibold text-black/60">{participant.user_id === currentUserId ? "Tu" : member?.display_name ?? "Partecipante"}</span><span className={clsx("font-bold", participant.state === "joined" ? "text-moss-700" : participant.state === "invited" ? "text-amber-600" : "text-black/35")}>{label}</span></div>; })}</div>
            </div>

            {incomingCall && <div className="space-y-3">
              <p className="text-center text-[10px] leading-5 text-black/52"><strong>{callStarter?.display_name ?? "Un partecipante"}</strong> ti invita a una {activeCall.call_kind === "group" ? "chiamata di gruppo" : "chiamata vocale"}.</p>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => void respondToCall(false)} disabled={actionPending === "call"} className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[10px] font-bold text-red-700 disabled:opacity-50"><PhoneOff size={14} /> Rifiuta</button><button onClick={() => void respondToCall(true)} disabled={actionPending === "call"} className="button-primary justify-center py-2.5 text-xs">{actionPending === "call" ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />} Rispondi</button></div>
            </div>}

            {joinedCall && <>
              <p className="rounded-xl bg-black/[0.025] px-3 py-2 text-center text-[9px] text-black/45">{activeCall.status === "waiting" ? "Chiamata inviata · in attesa di una risposta" : audioCall.connectionState === "connected" ? "Audio collegato" : audioCall.connectionState === "error" ? "Problema di connessione audio" : "Collegamento audio in corso…"}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCallMuted((muted) => !muted)} aria-pressed={callMuted} className={clsx("flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-bold transition", callMuted ? "border-red-100 bg-red-50 text-red-700" : "border-moss-100 bg-moss-50 text-moss-800")}>{callMuted ? <MicOff size={14} /> : <Mic size={14} />}{callMuted ? "Riattiva" : "Muta"}</button>
                <div className="flex items-center gap-2 rounded-xl border border-black/[0.07] px-3 py-2.5">
                  {callVolume === 0 ? <VolumeX size={14} className="shrink-0 text-black/35" /> : <Volume2 size={14} className="shrink-0 text-black/45" />}
                  <input aria-label="Volume chiamata" type="range" min="0" max="100" step="5" value={callVolume} onChange={(event) => setCallVolume(Number(event.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-black/10 accent-moss-600" />
                  <span className="w-6 text-right text-[8px] font-bold text-black/35">{callVolume}</span>
                </div>
              </div>
              {speakerBlocked && <button onClick={() => void activateSpeaker()} className="button-secondary w-full justify-center py-2 text-[10px]"><Volume2 size={13} /> Attiva altoparlante</button>}
              <button onClick={() => void endCall()} disabled={actionPending === "call"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50">{actionPending === "call" ? <Loader2 size={14} className="animate-spin" /> : <PhoneOff size={14} />} {activeCall.status === "waiting" ? "Annulla chiamata" : activeCall.call_kind === "group" ? "Esci dalla chiamata" : "Termina chiamata"}</button>
            </>}
          </>}
        </div>}
      </section>}

      {summaryOpen && <div role="dialog" aria-modal="true" aria-labelledby="summary-title" className="fixed inset-0 z-[80] grid place-items-center bg-ink/55 p-4 backdrop-blur-sm"><div className="panel w-full max-w-2xl overflow-hidden"><div className="flex items-center justify-between border-b border-black/[0.06] p-5"><div><p className="eyebrow">Aggiornato automaticamente · senza AI</p><h2 id="summary-title" className="mt-1 text-lg font-bold">Riepilogo per Tatiana</h2></div><button onClick={() => setSummaryOpen(false)} aria-label="Chiudi" className="grid size-9 place-items-center rounded-xl bg-black/[0.035]"><X size={16} /></button></div><div className="max-h-[60vh] overflow-y-auto p-5"><pre className="whitespace-pre-wrap rounded-2xl bg-paper p-5 font-[family-name:var(--font-sans)] text-xs leading-6 text-black/65">{automaticSummaryText}</pre></div><div className="flex justify-end gap-2 border-t border-black/[0.06] p-4"><button onClick={() => setSummaryOpen(false)} className="button-secondary">Chiudi</button><button onClick={() => void copySessionSummary(automaticSummaryText).then(() => showToast("Riepilogo copiato"))} className="button-primary"><Copy size={14} /> Copia testo</button></div></div></div>}
      {removalTarget && <RoomContentRemovalDialog target={removalTarget} pending={removalLoading} onClose={() => setRemovalTarget(null)} onConfirm={(mode) => void confirmContentRemoval(mode)} />}
    </main>
  );
}

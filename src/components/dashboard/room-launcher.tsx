"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Check,
  Clipboard,
  Clock3,
  DoorOpen,
  Gauge,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Target,
  UsersRound,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { ThemeQuickToggle } from "@/components/theme/theme-quick-toggle";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

type RoomRole = "owner" | "admin" | "member";

type RoomCard = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  joined_at: string;
  role: RoomRole;
  memberCount: number;
  onlineCount: number;
};

type RecentActivity = {
  id: string;
  roomId: string;
  eventType: string;
  summary: string;
  createdAt: string;
};

type DashboardMetrics = {
  progress: number;
  exercises: number;
  focusSeconds: number;
};

const EMPTY_METRICS: DashboardMetrics = {
  progress: 0,
  exercises: 0,
  focusSeconds: 0,
};

const ROLE_LABELS: Record<RoomRole, string> = {
  owner: "Proprietario",
  admin: "Amministratore",
  member: "Partecipante",
};

const EVENT_LABELS: Record<string, string> = {
  session_started: "Sessione focus avviata",
  session_paused: "Sessione focus in pausa",
  session_completed: "Sessione focus completata",
  progress_updated: "Progresso aggiornato",
  exercise_completed: "Esercizio completato",
  material_opened: "Materiale aperto",
  material_resumed: "Materiale ripreso",
  note_created: "Nuovo appunto condiviso",
  task_created: "Attività aggiunta",
  task_completed: "Attività completata",
  task_reopened: "Attività riaperta",
  user_left_room: "Sessione conclusa",
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Di recente";
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("it", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

function formatFocusTime(totalSeconds: number) {
  const minutes = Math.max(0, Math.round(totalSeconds / 60));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return `${hours}h ${remainder.toString().padStart(2, "0")}m`;
}

function readRoom(
  room: Omit<RoomCard, "joined_at" | "role" | "memberCount" | "onlineCount"> | Array<Omit<RoomCard, "joined_at" | "role" | "memberCount" | "onlineCount">> | null,
) {
  return Array.isArray(room) ? room[0] ?? null : room;
}

export function RoomLauncher() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("Studente");
  const [catalogRoomId, setCatalogRoomId] = useState("");
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [inviteRoom, setInviteRoom] = useState<RoomCard | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"create" | "join" | "copy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }

      setDisplayName(
        String(
          auth.user.user_metadata.display_name ??
            auth.user.email?.split("@")[0] ??
            "Studente",
        ),
      );

      const { data, error: queryError } = await supabase
        .from("room_members")
        .select("role,joined_at,study_rooms(id,name,invite_code,created_at)")
        .eq("user_id", auth.user.id)
        .is("left_at", null)
        .order("joined_at", { ascending: false });

      if (queryError) {
        console.error("dashboard_rooms_load_failed", { code: queryError.code });
        setError("Non riesco a caricare le stanze. Riprova tra poco.");
        setLoading(false);
        return;
      }

      const flattened = (data ?? []).flatMap((row) => {
        const room = readRoom(
          row.study_rooms as unknown as
            | Omit<
                RoomCard,
                "joined_at" | "role" | "memberCount" | "onlineCount"
              >
            | Array<
                Omit<
                  RoomCard,
                  "joined_at" | "role" | "memberCount" | "onlineCount"
                >
              >
            | null,
        );
        if (!room) return [];
        return [
          {
            ...room,
            joined_at: String(row.joined_at ?? room.created_at),
            role: (row.role ?? "member") as RoomRole,
            memberCount: 1,
            onlineCount: 0,
          },
        ];
      });

      const roomIds = flattened.map((room) => room.id);
      if (!roomIds.length) {
        setRooms([]);
        setActivities([]);
        setMetrics(EMPTY_METRICS);
        setLoading(false);
        return;
      }

      const [
        membersResult,
        presenceResult,
        activityResult,
        progressResult,
        sessionsResult,
      ] = await Promise.all([
        supabase
          .from("room_members")
          .select("room_id,user_id")
          .in("room_id", roomIds)
          .is("left_at", null),
        supabase
          .from("presence")
          .select("room_id,user_id,status,last_seen_at")
          .in("room_id", roomIds),
        supabase
          .from("activity_events")
          .select("id,room_id,event_type,summary,created_at")
          .in("room_id", roomIds)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("progress_entries")
          .select("progress_percentage,exercises_completed")
          .eq("user_id", auth.user.id)
          .in("room_id", roomIds),
        supabase
          .from("study_sessions")
          .select("total_seconds")
          .eq("user_id", auth.user.id)
          .in("room_id", roomIds),
      ]);

      const membersByRoom = new Map<string, number>();
      for (const member of membersResult.data ?? []) {
        membersByRoom.set(
          member.room_id,
          (membersByRoom.get(member.room_id) ?? 0) + 1,
        );
      }

      const onlineByRoom = new Map<string, Set<string>>();
      for (const presence of presenceResult.data ?? []) {
        if (presence.status === "offline") continue;
        const lastSeenAt = new Date(presence.last_seen_at).getTime();
        if (
          !Number.isFinite(lastSeenAt) ||
          Date.now() - lastSeenAt > 2 * 60 * 1000
        ) {
          continue;
        }
        const users = onlineByRoom.get(presence.room_id) ?? new Set<string>();
        users.add(presence.user_id);
        onlineByRoom.set(presence.room_id, users);
      }

      const hydratedRooms = flattened.map((room) => ({
        ...room,
        memberCount: membersByRoom.get(room.id) ?? 1,
        onlineCount: onlineByRoom.get(room.id)?.size ?? 0,
      }));

      const progressRows = progressResult.data ?? [];
      const sessionRows = sessionsResult.data ?? [];
      setRooms(hydratedRooms);
      setCatalogRoomId((current) => current || hydratedRooms[0]?.id || "");
      setActivities(
        (activityResult.data ?? []).map((activity) => ({
          id: activity.id,
          roomId: activity.room_id,
          eventType: activity.event_type,
          summary:
            activity.summary ||
            EVENT_LABELS[activity.event_type] ||
            "Aggiornamento nella stanza",
          createdAt: activity.created_at,
        })),
      );
      setMetrics({
        progress: progressRows.length
          ? Math.round(
              progressRows.reduce(
                (sum, entry) => sum + Number(entry.progress_percentage ?? 0),
                0,
              ) / progressRows.length,
            )
          : 0,
        exercises: progressRows.reduce(
          (sum, entry) => sum + Number(entry.exercises_completed ?? 0),
          0,
        ),
        focusSeconds: sessionRows.reduce(
          (sum, session) => sum + Number(session.total_seconds ?? 0),
          0,
        ),
      });
      setLoading(false);
    })();
  }, [configured, router]);

  const roomNames = useMemo(
    () => new Map(rooms.map((room) => [room.id, room.name])),
    [rooms],
  );

  const catalogHref = catalogRoomId
    ? `/catalog?roomId=${encodeURIComponent(catalogRoomId)}`
    : "/catalog";

  async function createRoom(event: React.FormEvent) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName || !configured) return;
    if (normalizedName.length < 3) {
      setError("Il nome della stanza deve contenere almeno 3 caratteri.");
      return;
    }
    if (
      rooms.some(
        (room) => room.name.toLocaleLowerCase("it") === normalizedName.toLocaleLowerCase("it"),
      )
    ) {
      setError("Hai già una stanza con questo nome.");
      return;
    }

    setWorking("create");
    setError(null);
    const { data, error: rpcError } = await createClient().rpc(
      "create_study_room",
      { room_name: normalizedName },
    );
    setWorking(null);
    if (rpcError) {
      console.error("dashboard_room_create_failed", { code: rpcError.code });
      setError("Non è stato possibile creare la stanza. Riprova.");
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.id) router.push(`/room/${result.id}`);
  }

  async function joinRoom(event: React.FormEvent) {
    event.preventDefault();
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode || !configured) return;
    if (normalizedCode.length < 8) {
      setError("Il codice invito è troppo corto.");
      return;
    }

    setWorking("join");
    setError(null);
    const { data, error: rpcError } = await createClient().rpc(
      "join_study_room",
      { invite_code: normalizedCode },
    );
    setWorking(null);
    if (rpcError) {
      console.error("dashboard_room_join_failed", { code: rpcError.code });
      setError(
        "Il codice non è valido, è stato revocato oppure la stanza non è più disponibile.",
      );
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    const id = typeof result === "string" ? result : result?.room_id;
    if (id) router.push(`/room/${id}`);
  }

  async function copyInvite(room: RoomCard) {
    setWorking("copy");
    try {
      await navigator.clipboard.writeText(room.invite_code);
      setFeedback(`Codice di “${room.name}” copiato.`);
    } catch {
      setFeedback(`Codice: ${room.invite_code}`);
    } finally {
      setWorking(null);
    }
  }

  async function signOut() {
    if (configured) await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <main
      data-ui-surface="dark"
      data-ui-page="dashboard"
      className="min-h-screen px-5 py-5 sm:px-8 lg:px-12"
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-4"
        aria-label="Navigazione dashboard"
      >
        <Link href="/" className="flex items-center gap-3 font-bold">
          <AppLogo size="sm" showName priority />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="button-secondary hidden px-3.5 py-2 sm:inline-flex">
            Presentazione
          </Link>
          {rooms[0] && (
            <Link
              href={`/room/${rooms[0].id}`}
              className="button-secondary hidden px-3.5 py-2 md:inline-flex"
            >
              Apri aula
            </Link>
          )}
          <ThemeQuickToggle className="button-secondary px-3.5 py-2" />
          <button onClick={signOut} className="button-secondary px-3.5 py-2">
            <LogOut size={15} /> <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl py-12">
        <p className="eyebrow">La tua scrivania</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-4xl font-medium tracking-tight sm:text-5xl">
              Ciao, {displayName}.
            </h1>
            <p className="mt-2 text-sm text-black/48">
              Scegli una stanza, riprendi lo studio oppure aprine una nuova.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-black/40">
            <span
              className={`size-2 rounded-full ${
                configured ? "bg-moss-500" : "bg-apricot"
              }`}
            />
            {configured ? "Supabase collegato" : "Modalità anteprima"}
          </div>
        </div>

        {!configured && (
          <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-apricot/30 bg-[#fff7ed] p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold">Vuoi provare subito l’interfaccia?</p>
              <p className="mt-1 text-xs leading-5 text-black/48">
                La demo funziona localmente. Per account e sincronizzazione,
                configura le variabili indicate nel README.
              </p>
            </div>
            <Link href="/room/demo" className="button-primary shrink-0">
              Apri la demo <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              aria-label="Chiudi avviso"
              onClick={() => setError(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {feedback && (
          <div
            role="status"
            className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-moss-200 bg-moss-50 p-4 text-sm text-moss-800"
          >
            <span>{feedback}</span>
            <button
              type="button"
              aria-label="Chiudi conferma"
              onClick={() => setFeedback(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-moss-200 bg-moss-800 p-6 text-white shadow-card">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/12">
                  <Bot size={21} />
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-moss-100">
                    <Sparkles size={13} /> Nuovo percorso
                  </p>
                  <h2 className="mt-1 text-xl font-bold">Cosa vuoi studiare?</h2>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-white/65">
                    Esplora i materiali e crea con Eve una sequenza ordinata.
                    Scegli la stanza di destinazione prima di entrare nel Catalogo.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <label className="sr-only" htmlFor="catalog-room">
                  Stanza di destinazione del Catalogo
                </label>
                <select
                  id="catalog-room"
                  className="min-w-56 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white outline-none"
                  value={catalogRoomId}
                  onChange={(event) => setCatalogRoomId(event.target.value)}
                  disabled={!rooms.length}
                >
                  {!rooms.length && <option value="">Nessuna stanza</option>}
                  {rooms.map((room) => (
                    <option className="text-black" value={room.id} key={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <Link
                  href={catalogHref}
                  aria-disabled={!rooms.length}
                  className={`button-secondary shrink-0 border-white/10 bg-white/10 text-white shadow-none ${
                    rooms.length
                      ? "hover:bg-white hover:text-moss-900"
                      : "pointer-events-none opacity-45"
                  }`}
                >
                  Apri il Catalogo <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <p className="mt-3 text-[0.68rem] text-white/45">
              {rooms.length
                ? "Il percorso verrà importato nella stanza scelta, senza duplicati."
                : "Crea o raggiungi una stanza per poter importare un percorso."}
            </p>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Le tue stanze</h2>
            <span className="text-xs text-black/35">{rooms.length} attive</span>
          </div>

          {loading ? (
            <div
              className="mt-4 grid h-44 place-items-center panel"
              aria-busy="true"
              aria-label="Caricamento delle stanze"
            >
              <div className="flex items-center gap-3 text-sm text-black/45">
                <Loader2 className="animate-spin text-moss-600" />
                Caricamento…
              </div>
            </div>
          ) : rooms.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room, index) => (
                <article
                  key={room.id}
                  className="group panel flex min-h-64 flex-col p-5 transition hover:-translate-y-0.5 hover:border-moss-200"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${
                        index % 2 ? "bg-[#f4e5d7]" : "bg-moss-100"
                      }`}
                    >
                      <UsersRound size={18} />
                    </span>
                    <span className="rounded-full border border-black/8 bg-white/65 px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.08em] text-black/45">
                      {ROLE_LABELS[room.role]}
                    </span>
                  </div>
                  <h3 className="mt-5 font-bold">{room.name}</h3>
                  <p className="mt-1 font-mono text-[0.7rem] tracking-[0.08em] text-black/40">
                    {room.invite_code}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] text-black/48">
                    <span className="rounded-full bg-moss-50 px-2.5 py-1">
                      {room.onlineCount} online
                    </span>
                    <span className="rounded-full bg-black/[0.035] px-2.5 py-1">
                      {room.memberCount} partecipanti
                    </span>
                    <span className="rounded-full bg-black/[0.035] px-2.5 py-1">
                      {formatRelativeDate(room.joined_at)}
                    </span>
                  </div>
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                    <Link
                      href={`/room/${room.id}`}
                      className="button-primary justify-center px-3 py-2.5"
                    >
                      Apri
                    </Link>
                    <button
                      type="button"
                      className="button-secondary justify-center px-3 py-2.5"
                      onClick={() => setInviteRoom(room)}
                    >
                      Invito
                    </button>
                    <Link
                      href={`/room/${room.id}/settings`}
                      className="button-secondary justify-center px-3 py-2.5"
                      aria-label={`Gestisci ${room.name}`}
                    >
                      <Settings size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white/45 p-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-moss-100 text-moss-700">
                <DoorOpen size={21} />
              </span>
              <p className="mt-4 text-sm font-bold">Nessuna stanza ancora</p>
              <p className="mt-1 text-xs text-black/42">
                Creane una oppure entra con il codice di un amico.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <form onSubmit={createRoom} className="panel p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-moss-100 text-moss-700">
                <Plus size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Crea una stanza</h2>
                <p className="mt-1 text-xs leading-5 text-black/40">
                  Assegna un nome al nuovo spazio. Riceverai un codice privato
                  da condividere.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={3}
                maxLength={60}
                placeholder="Es. Preparazione esame"
                disabled={!configured}
                required
              />
              <button
                className="button-primary shrink-0"
                disabled={!configured || working !== null}
              >
                {working === "create" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Crea"
                )}
              </button>
            </div>
            <p className="mt-2 text-[0.68rem] text-black/35">
              Da 3 a 60 caratteri. Gli spazi iniziali e finali vengono rimossi.
            </p>
          </form>

          <form onSubmit={joinRoom} className="panel p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f4e5d7] text-[#9a5d2b]">
                <DoorOpen size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Entra con un invito</h2>
                <p className="mt-1 text-xs leading-5 text-black/40">
                  Inserisci il codice ricevuto da chi ha creato la stanza.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                className="field uppercase tracking-widest"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                minLength={8}
                maxLength={64}
                placeholder="CODICE INVITO"
                disabled={!configured}
                required
              />
              <button
                className="button-secondary shrink-0"
                disabled={!configured || working !== null}
              >
                {working === "join" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Entra"
                )}
              </button>
            </div>
            <p className="mt-2 text-[0.68rem] text-black/35">
              Il codice non distingue maiuscole e minuscole.
            </p>
          </form>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <article className="panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Cronologia condivisa</p>
                <h2 className="mt-1 text-lg font-bold">Attività recente</h2>
              </div>
              {rooms[0] && (
                <Link
                  href={`/room/${rooms[0].id}`}
                  className="button-secondary px-3 py-2"
                >
                  Apri aula <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <div className="mt-5 space-y-3">
              {activities.length ? (
                activities.slice(0, 4).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-2xl border border-black/[0.055] bg-white/55 p-3.5"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-moss-100 text-moss-700">
                      <Check size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold">{activity.summary}</p>
                      <p className="mt-1 truncate text-[0.68rem] text-black/40">
                        {roomNames.get(activity.roomId) ?? "Aula condivisa"}
                      </p>
                    </div>
                    <time className="shrink-0 text-[0.64rem] text-black/32">
                      {formatRelativeDate(activity.createdAt)}
                    </time>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-xs text-black/42">
                  Le nuove attività appariranno qui automaticamente.
                </div>
              )}
            </div>
          </article>

          <article className="panel p-6">
            <p className="eyebrow">Vista personale</p>
            <h2 className="mt-1 text-lg font-bold">Obiettivi della settimana</h2>
            <p className="mt-1 text-xs leading-5 text-black/40">
              Una vista rapida per scegliere il prossimo passo senza entrare
              subito nella stanza.
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: Gauge,
                  label: "Percorso personale",
                  value: `${metrics.progress}%`,
                },
                {
                  icon: Target,
                  label: "Esercizi completati",
                  value: String(metrics.exercises),
                },
                {
                  icon: Clock3,
                  label: "Tempo focus",
                  value: formatFocusTime(metrics.focusSeconds),
                },
              ].map(({ icon: Icon, label, value }, index) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-black/[0.055] bg-white/55 p-3.5"
                  key={label}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-black/[0.04] text-black/48">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-semibold">{label}</span>
                  <strong className="text-sm">{value}</strong>
                  <span className="text-[0.62rem] text-black/24">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: RotateCcw,
              title: "Riprendi rapidamente",
              text: "Torna all’ultima sezione letta e continua dal punto esatto in cui avevi interrotto.",
            },
            {
              icon: Gauge,
              title: "Progressi personali",
              text: "Controlla tempo, attività completate e obiettivi senza confonderli con quelli degli altri.",
            },
            {
              icon: Sparkles,
              title: "Suggerimenti di Eve",
              text: "Individua cosa ripassare e quale esercizio affrontare dopo in base al percorso corrente.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article className="panel p-5" key={title}>
              <span className="grid size-9 place-items-center rounded-xl bg-moss-100 text-moss-700">
                <Icon size={17} />
              </span>
              <h3 className="mt-4 text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-black/42">{text}</p>
            </article>
          ))}
        </section>
      </div>

      {inviteRoom && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setInviteRoom(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-dialog-title"
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#f8f5ed] p-6 text-black shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Codice invito attivo</p>
                <h2 id="invite-dialog-title" className="mt-1 text-xl font-bold">
                  {inviteRoom.name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Chiudi invito"
                className="button-secondary px-2.5 py-2.5"
                onClick={() => setInviteRoom(null)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-black/48">
              Condividi questo codice soltanto con le persone che vuoi far
              entrare nella stanza.
            </p>
            <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white px-4 py-4 text-center font-mono text-base font-bold tracking-[0.18em]">
              {inviteRoom.invite_code}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="button-primary justify-center"
                disabled={working === "copy"}
                onClick={() => void copyInvite(inviteRoom)}
              >
                <Clipboard size={15} /> Copia codice
              </button>
              <Link
                href={`/room/${inviteRoom.id}/settings`}
                className="button-secondary justify-center"
              >
                <Settings size={15} /> Gestisci invito
              </Link>
            </div>
            <p className="mt-3 text-[0.68rem] text-black/36">
              Solo il proprietario può revocare e rigenerare il codice dalle
              impostazioni della stanza.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

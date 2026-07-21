"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Bot, DoorOpen, Loader2, LogOut, Plus, Sparkles, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

type RoomCard = { id: string; name: string; invite_code: string; created_at: string };

export function RoomLauncher() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("Studente");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/login"); return; }
      setDisplayName(String(auth.user.user_metadata.display_name ?? auth.user.email?.split("@")[0] ?? "Studente"));
      const { data, error: queryError } = await supabase
        .from("room_members")
        .select("study_rooms(id,name,invite_code,created_at)")
        .eq("user_id", auth.user.id)
        .is("left_at", null)
        .order("joined_at", { ascending: false });
      if (queryError) setError(queryError.message);
      const flattened = (data ?? []).flatMap((row) => {
        const room = row.study_rooms as unknown as RoomCard | RoomCard[] | null;
        return Array.isArray(room) ? room : room ? [room] : [];
      });
      setRooms(flattened);
      setLoading(false);
    })();
  }, [configured, router]);

  async function createRoom(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !configured) return;
    setWorking("create"); setError(null);
    const { data, error: rpcError } = await createClient().rpc("create_study_room", { room_name: name.trim() });
    setWorking(null);
    if (rpcError) { setError(rpcError.message); return; }
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.id) router.push(`/room/${result.id}`);
  }

  async function joinRoom(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteCode.trim() || !configured) return;
    setWorking("join"); setError(null);
    const { data, error: rpcError } = await createClient().rpc("join_study_room", { invite_code: inviteCode.trim().toUpperCase() });
    setWorking(null);
    if (rpcError) { setError(rpcError.message); return; }
    const result = Array.isArray(data) ? data[0] : data;
    const id = typeof result === "string" ? result : result?.room_id;
    if (id) router.push(`/room/${id}`);
  }

  async function signOut() {
    if (configured) await createClient().auth.signOut();
    router.replace("/"); router.refresh();
  }

  return (
    <main data-ui-surface="dark" data-ui-page="dashboard" className="min-h-screen px-5 py-5 sm:px-8 lg:px-12">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-moss-800 text-white"><BookOpen size={18} /></span>Aula</Link>
        <button onClick={signOut} className="button-secondary px-3.5 py-2"><LogOut size={15} /> <span className="hidden sm:inline">Esci</span></button>
      </nav>

      <div className="mx-auto max-w-6xl py-12">
        <p className="eyebrow">La tua scrivania</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="font-[family-name:var(--font-serif)] text-4xl font-medium tracking-tight sm:text-5xl">Ciao, {displayName}.</h1><p className="mt-2 text-sm text-black/48">Scegli una stanza o aprine una nuova.</p></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-black/40"><span className={`size-2 rounded-full ${configured ? "bg-moss-500" : "bg-apricot"}`} />{configured ? "Supabase collegato" : "Modalita anteprima"}</div>
        </div>

        {!configured && <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-apricot/30 bg-[#fff7ed] p-5 sm:flex-row sm:items-center"><div><p className="text-sm font-bold">Vuoi provare subito l’interfaccia?</p><p className="mt-1 text-xs leading-5 text-black/48">La demo funziona localmente. Per account e sincronizzazione, configura le variabili indicate nel README.</p></div><Link href="/room/demo" className="button-primary shrink-0">Apri la demo <ArrowRight size={15} /></Link></div>}
        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {process.env.NEXT_PUBLIC_CATALOG_ENABLED === "1" && <Link href="/catalog" className="group mt-8 flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-moss-200 bg-moss-800 p-6 text-white shadow-card transition hover:-translate-y-0.5 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/12"><Bot size={21} /></span><div><p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-moss-100"><Sparkles size={13} /> Nuovo</p><h2 className="mt-1 text-xl font-bold">Cosa vuoi studiare?</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-white/65">Esplora materiali reali e crea con Eve un percorso ordinato da aggiungere alla tua aula.</p></div></div><span className="button-secondary shrink-0 border-white/10 bg-white/10 text-white shadow-none group-hover:bg-white group-hover:text-moss-900">Apri il Catalogo <ArrowRight size={15} /></span></Link>}

        <section className="mt-10">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Le tue stanze</h2><span className="text-xs text-black/35">{rooms.length} attive</span></div>
          {loading ? <div className="mt-4 grid h-40 place-items-center panel"><Loader2 className="animate-spin text-moss-600" /></div> : rooms.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rooms.map((room, index) => <Link href={`/room/${room.id}`} key={room.id} className="group panel p-5 transition hover:-translate-y-0.5 hover:border-moss-200"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${index % 2 ? "bg-[#f4e5d7]" : "bg-moss-100"}`}><UsersRound size={18} /></span><ArrowRight size={16} className="text-black/25 transition group-hover:translate-x-0.5 group-hover:text-moss-700" /></div><h3 className="mt-5 font-bold">{room.name}</h3><p className="mt-1 text-xs text-black/40">Codice {room.invite_code}</p></Link>)}</div> : <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white/45 p-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-moss-100 text-moss-700"><DoorOpen size={21} /></span><p className="mt-4 text-sm font-bold">Nessuna stanza ancora</p><p className="mt-1 text-xs text-black/42">Creane una oppure entra con il codice di un amico.</p></div>}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <form onSubmit={createRoom} className="panel p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-moss-100 text-moss-700"><Plus size={18} /></span><div><h2 className="text-sm font-bold">Crea una stanza</h2><p className="text-xs text-black/40">Riceverai un codice da condividere.</p></div></div><div className="mt-5 flex gap-2"><input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Es. Preparazione esame" disabled={!configured} required /><button className="button-primary shrink-0" disabled={!configured || working !== null}>{working === "create" ? <Loader2 size={16} className="animate-spin" /> : "Crea"}</button></div></form>
          <form onSubmit={joinRoom} className="panel p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f4e5d7] text-[#9a5d2b]"><DoorOpen size={18} /></span><div><h2 className="text-sm font-bold">Entra con un invito</h2><p className="text-xs text-black/40">Chiedi il codice a chi ha creato la stanza.</p></div></div><div className="mt-5 flex gap-2"><input className="field uppercase tracking-widest" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} minLength={8} maxLength={64} placeholder="CODICE INVITO" disabled={!configured} required /><button className="button-secondary shrink-0" disabled={!configured || working !== null}>{working === "join" ? <Loader2 size={16} className="animate-spin" /> : "Entra"}</button></div></form>
        </section>
      </div>
    </main>
  );
}

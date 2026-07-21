"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Loader2,
  LogOut,
  Palette,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { ThemeSelector } from "@/components/theme/theme-selector";

export function RoomSettings({ roomId }: { roomId: string }) {
  const router = useRouter();
  const demo = roomId === "demo";
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(!demo);
  const [roomName, setRoomName] = useState(demo ? "Python insieme" : "Stanza");
  const [inviteCode, setInviteCode] = useState(demo ? "AULA24" : "");
  const [role, setRole] = useState<"owner" | "admin" | "member">(demo ? "owner" : "member");
  const [sharePresence, setSharePresence] = useState(true);
  const [shareActivity, setShareActivity] = useState(true);
  const [defaultPrivateNotes, setDefaultPrivateNotes] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState("it");
  const [learningLanguage, setLearningLanguage] = useState("en");
  const [translationLanguage, setTranslationLanguage] = useState("it");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [annotationMode, setAnnotationMode] = useState<"adaptive" | "always" | "click" | "hidden">("adaptive");
  const [translationAiEnabled, setTranslationAiEnabled] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function say(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => current === message ? null : current), 3200);
  }

  useEffect(() => {
    if (demo) return;
    if (!configured) { setLoading(false); return; }
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/login"); return; }
      const [{ data: room }, { data: member }, { data: prefs }, { data: languagePrefs }] = await Promise.all([
        supabase.from("study_rooms").select("name,invite_code").eq("id", roomId).single(),
        supabase.from("room_members").select("role").eq("room_id", roomId).eq("user_id", auth.user.id).single(),
        supabase.from("user_room_preferences").select("share_presence,share_activity,default_private_notes").eq("room_id", roomId).eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("user_language_preferences").select("native_language,learning_languages,default_target_language,show_annotations,annotation_mode,ai_enabled").eq("user_id", auth.user.id).maybeSingle(),
      ]);
      if (room) { setRoomName(room.name); setInviteCode(room.invite_code); }
      if (member?.role) setRole(member.role as "owner" | "admin" | "member");
      if (prefs) { setSharePresence(prefs.share_presence); setShareActivity(prefs.share_activity); setDefaultPrivateNotes(prefs.default_private_notes); }
      if (languagePrefs) {
        const languages = Array.isArray(languagePrefs.learning_languages)
          ? languagePrefs.learning_languages.filter((value): value is string => typeof value === "string")
          : [];
        setNativeLanguage(languagePrefs.native_language);
        setLearningLanguage(languages[0] ?? "en");
        setTranslationLanguage(languagePrefs.default_target_language);
        setShowAnnotations(languagePrefs.show_annotations);
        setAnnotationMode(languagePrefs.annotation_mode as "adaptive" | "always" | "click" | "hidden");
        setTranslationAiEnabled(languagePrefs.ai_enabled);
      }
      setLoading(false);
    })();
  }, [configured, demo, roomId, router]);

  async function savePreference(field: "share_presence" | "share_activity" | "default_private_notes", value: boolean) {
    if (demo) { say("Preferenza salvata nella demo"); return; }
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("user_room_preferences").upsert({ room_id: roomId, user_id: auth.user.id, [field]: value }, { onConflict: "room_id,user_id" });
    if (error) say(error.message); else say("Preferenza salvata");
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteCode);
    say("Codice invito copiato");
  }

  async function saveLanguagePreferences(event: React.FormEvent) {
    event.preventDefault();
    if (demo) { say("Preferenze linguistiche salvate nella demo"); return; }
    setBusy("languages");
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(null); return; }
    const { error } = await supabase.from("user_language_preferences").upsert({
      user_id: auth.user.id,
      native_language: nativeLanguage,
      learning_languages: [learningLanguage],
      default_target_language: translationLanguage,
      show_annotations: showAnnotations,
      annotation_mode: annotationMode,
      ai_enabled: translationAiEnabled,
    }, { onConflict: "user_id" });
    setBusy(null);
    say(error ? error.message : "Preferenze linguistiche salvate");
  }

  async function rotateInvite() {
    if (demo) { setInviteCode("NUOVO42"); say("Invito precedente revocato nella demo"); return; }
    setBusy("invite");
    const { data, error } = await createClient().rpc("rotate_room_invite", { p_room_id: roomId });
    setBusy(null);
    if (error) say(error.message); else { const result = Array.isArray(data) ? data[0] : data; setInviteCode(typeof result === "string" ? result : result?.invite_code ?? inviteCode); say("Nuovo codice creato"); }
  }

  async function exportProgress() {
    setBusy("export");
    let payload: unknown = { room: roomName, exported_at: new Date().toISOString(), progress: [], sessions: [] };
    if (!demo) {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const [{ data: progress }, { data: sessions }] = await Promise.all([
        supabase.from("progress_entries").select("*").eq("room_id", roomId).eq("user_id", auth.user.id),
        supabase.from("study_sessions").select("*").eq("room_id", roomId).eq("user_id", auth.user.id),
      ]);
      payload = { room: roomName, user_id: auth.user.id, exported_at: new Date().toISOString(), progress, sessions };
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `progressi-${roomName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.json`; anchor.click();
    URL.revokeObjectURL(url); setBusy(null); say("Esportazione pronta");
  }

  async function leaveRoom() {
    if (!window.confirm("Vuoi davvero lasciare questa stanza? I tuoi progressi personali resteranno esportabili finche non elimini l'account.")) return;
    if (!demo) {
      setBusy("leave");
      const { error } = await createClient().rpc("leave_study_room", { room_id: roomId });
      if (error) { say(error.message); setBusy(null); return; }
    }
    router.replace("/dashboard"); router.refresh();
  }

  async function deleteAccount() {
    if (demo) { say("La demo non usa un account reale"); return; }
    const confirmation = window.prompt("Questa operazione e definitiva. Scrivi ELIMINA per confermare.");
    if (confirmation !== "ELIMINA") return;
    setBusy("delete");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" } });
    if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; say(body?.error ?? "Cancellazione non riuscita"); setBusy(null); return; }
    router.replace("/"); router.refresh();
  }

  async function deleteRoom() {
    if (demo) { say("La stanza demo si ricrea automaticamente"); return; }
    const confirmation = window.prompt("Elimina stanza, dati condivisi e file. Scrivi ELIMINA STANZA per confermare.");
    if (confirmation !== "ELIMINA STANZA") return;
    setBusy("delete-room");
    const response = await fetch(`/api/rooms/${roomId}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
    if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; say(body?.error ?? "Cancellazione non riuscita"); setBusy(null); return; }
    router.replace("/dashboard"); router.refresh();
  }

  if (loading) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-moss-700" /></main>;

  return (
    <main data-ui-surface="dark" data-ui-page="settings" className="min-h-screen px-5 py-5 sm:px-8 lg:px-12">
      {notice && <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-soft">{notice}</div>}
      <div className="mx-auto max-w-3xl">
        <Link href={`/room/${roomId}`} className="inline-flex items-center gap-2 text-xs font-bold text-black/45 hover:text-moss-700"><ArrowLeft size={14} /> Torna alla stanza</Link>
        <div className="mt-8"><p className="eyebrow">{roomName}</p><h1 className="mt-2 font-[family-name:var(--font-serif)] text-4xl font-medium tracking-tight sm:text-5xl">Impostazioni e privacy</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-black/48">Qui decidi cosa condividere. L’aula non osserva la navigazione esterna, non attiva audio o video e non raccoglie dati non necessari.</p></div>

        <section className="panel mt-9 overflow-hidden">
          <div className="border-b border-black/[0.06] p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-moss-100 text-moss-700"><Eye size={18} /></span><div><h2 className="text-sm font-bold">Cosa vede l’altra persona</h2><p className="mt-0.5 text-xs text-black/40">Controlli per questa stanza.</p></div></div></div>
          <div className="divide-y divide-black/[0.05]">
            <PreferenceRow icon={sharePresence ? Eye : EyeOff} title="Condividi il mio stato" description="Mostra online, studio, pausa, assenza o chiamata; nessuna cronologia del browser." checked={sharePresence} onChange={(value) => { setSharePresence(value); void savePreference("share_presence", value); }} />
            <PreferenceRow icon={RefreshCw} title="Condividi l'attivita recente" description="Mostra progressi, esercizi, materiali aperti nell'aula e inizio/fine sessione." checked={shareActivity} onChange={(value) => { setShareActivity(value); void savePreference("share_activity", value); }} />
            <PreferenceRow icon={UserRound} title="Note private per impostazione predefinita" description="Le nuove note saranno visibili solo a te, finche non scegli di condividerle." checked={defaultPrivateNotes} onChange={(value) => { setDefaultPrivateNotes(value); void savePreference("default_private_notes", value); }} />
          </div>
        </section>

        <section className="panel mt-5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-moss-100 text-moss-700"><Palette size={18} /></span><div><h2 className="text-sm font-bold">Temi</h2><p className="mt-0.5 text-xs text-black/40">Scegli l’aspetto dell’app. La preferenza è personale e si applica subito.</p></div></div>
          <div className="mt-5"><ThemeSelector /></div>
        </section>

        <form onSubmit={saveLanguagePreferences} className="panel mt-5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky/20 text-[#477483]"><Languages size={18} /></span><div><h2 className="text-sm font-bold">Lingue e traduzione adattiva</h2><p className="mt-0.5 text-xs text-black/40">Preferenze private valide in tutte le tue stanze.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <LanguageSelect label="La tua lingua" value={nativeLanguage} onChange={setNativeLanguage} />
            <LanguageSelect label="Lingua che studi" value={learningLanguage} onChange={setLearningLanguage} />
            <LanguageSelect label="Lingua delle traduzioni" value={translationLanguage} onChange={setTranslationLanguage} />
          </div>
          <label className="mt-4 block text-[10px] font-bold text-black/50">Visualizzazione annotazioni<select className="field mt-1.5 text-xs" value={annotationMode} onChange={(event) => setAnnotationMode(event.target.value as typeof annotationMode)}><option value="adaptive">Adattiva</option><option value="always">Mostra sempre</option><option value="click">Solo al click</option><option value="hidden">Nascoste</option></select></label>
          <div className="mt-4 divide-y divide-black/[0.05] rounded-2xl border border-black/[0.06]">
            <PreferenceRow icon={showAnnotations ? Eye : EyeOff} title="Mostra le annotazioni" description="Permette al lettore di visualizzare le traduzioni sopra le parole." checked={showAnnotations} onChange={setShowAnnotations} />
            <PreferenceRow icon={Languages} title="Consenti la traduzione AI" description="Se disattivata, il lettore usera soltanto memoria personale e cache disponibili." checked={translationAiEnabled} onChange={setTranslationAiEnabled} />
          </div>
          <button type="submit" disabled={busy === "languages"} className="button-primary mt-5 w-full sm:w-auto">{busy === "languages" ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />} Salva preferenze linguistiche</button>
        </form>

        <section className="panel mt-5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#f4e5d7] text-[#9a5d2b]"><KeyRound size={18} /></span><div><h2 className="text-sm font-bold">Invito della stanza</h2><p className="mt-0.5 text-xs text-black/40">Chi possiede il codice puo chiedere di entrare.</p></div></div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row"><div className="flex flex-1 items-center justify-between rounded-xl border border-black/[0.08] bg-paper px-4 py-3"><span className="font-mono text-sm font-bold tracking-[.2em]">{inviteCode || "••••••"}</span><button onClick={copyInvite} aria-label="Copia codice" className="text-black/35 hover:text-moss-700"><Copy size={16} /></button></div>{role === "owner" && <button onClick={rotateInvite} disabled={busy === "invite"} className="button-secondary">{busy === "invite" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Revoca e rigenera</button>}</div>
        </section>

        <section className="panel mt-5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky/20 text-[#477483]"><ShieldCheck size={18} /></span><div><h2 className="text-sm font-bold">I tuoi dati</h2><p className="mt-0.5 text-xs text-black/40">Portali con te o lascia la stanza.</p></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={exportProgress} disabled={busy === "export"} className="button-secondary justify-start p-4"><Download size={16} /><span className="text-left"><span className="block text-xs">Esporta i progressi</span><span className="mt-0.5 block text-[9px] font-normal text-black/38">File JSON leggibile e portabile</span></span></button><button onClick={leaveRoom} disabled={busy === "leave"} className="button-secondary justify-start p-4"><LogOut size={16} /><span className="text-left"><span className="block text-xs">Lascia la stanza</span><span className="mt-0.5 block text-[9px] font-normal text-black/38">Interrompi membership e presenza</span></span></button></div>
        </section>

        <section className="mt-5 divide-y divide-red-200 rounded-[1.4rem] border border-red-200 bg-red-50/75">
          {role === "owner" && <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><h2 className="text-sm font-bold text-red-800">Elimina questa stanza</h2><p className="mt-1 max-w-xl text-xs leading-5 text-red-700/65">Rimuove definitivamente dati condivisi, inviti e file della stanza per tutti.</p></div><button onClick={deleteRoom} disabled={busy === "delete-room"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100">{busy === "delete-room" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Elimina stanza</button></div>}
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><h2 className="text-sm font-bold text-red-800">Elimina il mio account</h2><p className="mt-1 max-w-xl text-xs leading-5 text-red-700/65">Operazione definitiva: profilo e dati personali vengono eliminati. Esporta prima ciò che vuoi conservare.</p></div><button onClick={deleteAccount} disabled={busy === "delete"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100">{busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Elimina account</button></div>
        </section>
      </div>
    </main>
  );
}

const LANGUAGE_OPTIONS = [
  ["it", "Italiano"],
  ["en", "Inglese"],
  ["es", "Spagnolo"],
  ["fr", "Francese"],
  ["de", "Tedesco"],
  ["pt", "Portoghese"],
  ["nl", "Olandese"],
  ["pl", "Polacco"],
  ["ru", "Russo"],
  ["ja", "Giapponese"],
  ["ko", "Coreano"],
  ["zh", "Cinese"],
] as const;

function LanguageSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-[10px] font-bold text-black/50">{label}<select className="field mt-1.5 text-xs" value={value} onChange={(event) => onChange(event.target.value)}>{LANGUAGE_OPTIONS.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>;
}

function PreferenceRow({ icon: Icon, title, description, checked, onChange }: { icon: typeof Eye; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-4 p-5 sm:p-6"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-black/[0.035] text-black/45"><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold">{title}</span><span className="mt-1 block text-[10px] leading-4 text-black/42">{description}</span></span><input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="relative h-6 w-11 shrink-0 rounded-full bg-black/10 transition peer-checked:bg-moss-600 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" aria-hidden="true" /></label>;
}

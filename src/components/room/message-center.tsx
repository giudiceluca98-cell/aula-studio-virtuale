"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, FileText, GripHorizontal, Info, MessageCircle, Minus, Paperclip, Plus, Search, Send, Smile, Users, X } from "lucide-react";
import clsx from "clsx";
import type { RoomViewData, UiMessageConversation } from "./demo-data";

function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Oggi";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" }).format(date);
}

function conversationMembers(conversation: UiMessageConversation, data: RoomViewData) {
  if (conversation.kind === "lobby") return data.members;
  const ids = data.messageConversationMembers
    .filter((member) => member.conversation_id === conversation.id && !member.left_at)
    .map((member) => member.user_id);
  return data.members.filter((member) => ids.includes(member.user_id));
}

function conversationTitle(conversation: UiMessageConversation, data: RoomViewData) {
  if (conversation.kind === "lobby") return "Lobby generale";
  if (conversation.kind === "group") return conversation.title ?? "Gruppo senza nome";
  return conversationMembers(conversation, data).find((member) => member.user_id !== data.currentUserId)?.display_name ?? "Chat privata";
}

function MessageText({ content }: { content: string }) {
  const parts = content.split(/(https?:\/\/[^\s]+)/gi);
  return <>{parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>;
    try {
      const url = new URL(part);
      return <a key={index} href={url.toString()} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-current/30 underline-offset-2">{url.hostname}</a>;
    } catch { return <span key={index}>{part}</span>; }
  })}</>;
}

export function MessageCenter({
  data,
  activeConversationId,
  onActiveConversation,
  draft,
  onDraft,
  unreadTotal,
  unreadByConversation,
  pending,
  schemaAvailable,
  onSend,
  onOpenAttachment,
  onCreate,
  onClose,
}: {
  data: RoomViewData;
  activeConversationId: string | null;
  onActiveConversation: (id: string) => void;
  draft: string;
  onDraft: (value: string) => void;
  unreadTotal: number;
  unreadByConversation: Record<string, number>;
  pending: boolean;
  schemaAvailable: boolean;
  onSend: (event: React.FormEvent, conversationId: string, files: File[]) => Promise<boolean>;
  onOpenAttachment: (path: string) => Promise<void>;
  onCreate: (kind: "private" | "group", title: string, participantIds: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "private" | "group">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<"private" | "group">("private");
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [files, setFiles] = useState<File[]>([]);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);

  const sorted = useMemo(() => [...data.messageConversations]
    .filter((conversation) => !conversation.archived_at)
    .filter((conversation) => filter === "all" || conversation.kind === "lobby" || conversation.kind === filter)
    .filter((conversation) => {
      if (!search.trim()) return true;
      const haystack = [conversationTitle(conversation, data), ...data.messages.filter((message) => (message.conversation_id ?? data.messageConversations.find((item) => item.kind === "lobby")?.id) === conversation.id).map((message) => message.content)].join(" ").toLocaleLowerCase("it");
      return haystack.includes(search.trim().toLocaleLowerCase("it"));
    })
    .sort((a, b) => Number(b.kind === "lobby") - Number(a.kind === "lobby") || Date.parse(b.updated_at) - Date.parse(a.updated_at)), [data, filter, search]);

  const active = data.messageConversations.find((conversation) => conversation.id === activeConversationId) ?? sorted[0] ?? null;
  const lobbyId = data.messageConversations.find((conversation) => conversation.kind === "lobby")?.id;
  const messages = active ? data.messages.filter((message) => (message.conversation_id ?? lobbyId) === active.id) : [];
  const participants = active ? conversationMembers(active, data) : [];
  const selectableMembers = data.members.filter((member) => member.user_id !== data.currentUserId);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("aula:message-center-state") ?? "{}") as { minimizedIds?: string[]; position?: { x: number; y: number } };
      if (Array.isArray(saved.minimizedIds)) setMinimizedIds(saved.minimizedIds.filter((id) => data.messageConversations.some((conversation) => conversation.id === id)));
      if (saved.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.y)) setPosition(saved.position);
    } catch { /* Stato locale facoltativo. */ }
  }, [data.messageConversations]);

  useEffect(() => {
    try { window.localStorage.setItem("aula:message-center-state", JSON.stringify({ minimizedIds, position })); } catch { /* Stato locale facoltativo. */ }
  }, [minimizedIds, position]);

  useEffect(() => {
    function move(event: PointerEvent) { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId || window.innerWidth < 768) return; setPosition({ x: drag.startX + event.clientX - drag.x, y: drag.startY + event.clientY - drag.y }); }
    function stop(event?: PointerEvent) { if (event && dragRef.current?.pointerId !== event.pointerId) return; dragRef.current = null; }
    function stopOnBlur() { dragRef.current = null; }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop); window.addEventListener("pointercancel", stop); window.addEventListener("blur", stopOnBlur);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); window.removeEventListener("blur", stopOnBlur); };
  }, []);

  if (minimized) return <div data-testid="minimized-chat-dock" className="fixed bottom-4 right-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">{minimizedIds.map((id) => { const conversation = data.messageConversations.find((item) => item.id === id); if (!conversation) return null; const title = conversationTitle(conversation, data); return <div key={id} className="flex items-center rounded-full bg-[#111917] text-white shadow-2xl"><button type="button" aria-label={`Apri chat ridotta ${title}`} onClick={() => { onActiveConversation(id); setMinimized(false); }} className="flex items-center gap-2 px-4 py-3 text-xs font-bold"><span className="grid size-6 place-items-center rounded-full bg-cyan-300/15 text-[8px] text-cyan-100">{conversation.kind === "lobby" ? <Users size={12} /> : initials(title)}</span><span className="max-w-36 truncate">{title}</span>{(unreadByConversation[id] ?? 0) > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-apricot px-1 text-[9px] text-ink">{unreadByConversation[id]}</span>}</button><button type="button" aria-label={`Chiudi chat ridotta ${title}`} onClick={() => setMinimizedIds((current) => current.filter((item) => item !== id))} className="mr-2 grid size-7 place-items-center rounded-full text-white/45 hover:bg-white/10"><X size={11} /></button></div>; })}<button type="button" onClick={() => setMinimized(false)} className="flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-bold text-white shadow-2xl"><MessageCircle size={15} /><span>Centro messaggi</span>{unreadTotal > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-apricot px-1 text-[9px] text-ink">{unreadTotal}</span>}</button></div>;

  async function createConversation() {
    if (createKind === "private" && selectedPeople.length !== 1) return;
    if (createKind === "group" && (selectedPeople.length < 2 || !groupTitle.trim())) return;
    await onCreate(createKind, groupTitle.trim(), selectedPeople);
    setCreateOpen(false); setGroupTitle(""); setSelectedPeople([]);
  }

  return <section data-testid="message-center-panel" aria-label="Centro messaggi" style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }} className="fixed inset-2 top-20 z-[75] mx-auto flex max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111917] text-white shadow-2xl sm:inset-5 sm:top-24">
    <header className="flex touch-none items-center justify-between border-b border-white/10 bg-[#18221f] px-4 py-3 md:cursor-grab" onPointerDown={(event) => { if ((event.target as HTMLElement).closest("button,input,select")) return; dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: position.x, startY: position.y }; }}>
      <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300/15 text-cyan-200"><MessageCircle size={17} /></span><div><h2 className="text-sm font-bold">Messaggi</h2><p className="text-[9px] text-white/45">Lobby generale, chat private e gruppi</p></div></div>
      <div className="flex items-center gap-1"><GripHorizontal size={14} className="hidden text-white/25 md:block" /><button type="button" disabled={!schemaAvailable} onClick={() => setCreateOpen(true)} title={schemaAvailable ? "Nuova conversazione" : "Applica prima la migrazione 0017"} className="grid size-8 place-items-center rounded-lg bg-cyan-300/15 text-cyan-100 disabled:opacity-35"><Plus size={14} /></button><button type="button" onClick={() => { if (active) setMinimizedIds((current) => current.includes(active.id) ? current : [...current, active.id]); setMinimized(true); }} aria-label="Riduci conversazione" className="grid size-8 place-items-center rounded-lg bg-white/5 text-white/60"><Minus size={14} /></button><button type="button" onClick={onClose} aria-label="Chiudi messaggi" className="grid size-8 place-items-center rounded-lg bg-white/5 text-white/60"><X size={14} /></button></div>
    </header>

    <div className="grid min-h-0 flex-1 md:grid-cols-[290px_minmax(0,1fr)]">
      <aside className={clsx("min-h-0 border-r border-white/10 bg-[#141d1a]", active && "hidden md:block")}>
        <div className="border-b border-white/10 p-3"><label className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-white/45"><Search size={13} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca chat o messaggi" className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[10px] text-white placeholder:text-white/30 focus:ring-0" /></label><div className="mt-2 flex gap-1">{([['all','Tutte'],['private','Private'],['group','Gruppi']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={clsx("rounded-lg px-2.5 py-1.5 text-[9px] font-bold", filter === value ? "bg-cyan-300 text-[#10201d]" : "bg-white/5 text-white/45")}>{label}</button>)}</div></div>
        <div className="h-full overflow-y-auto p-2">{sorted.map((conversation) => { const title = conversationTitle(conversation, data); const last = [...data.messages].reverse().find((message) => (message.conversation_id ?? lobbyId) === conversation.id); const isActive = active?.id === conversation.id; const unread = unreadByConversation[conversation.id] ?? 0; return <button key={conversation.id} type="button" onClick={() => onActiveConversation(conversation.id)} className={clsx("mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left", isActive ? "bg-cyan-300/12 text-white" : "text-white/65 hover:bg-white/5")}><span className={clsx("grid size-10 shrink-0 place-items-center rounded-full text-[10px] font-bold", conversation.kind === "lobby" ? "bg-cyan-300 text-[#10201d]" : "bg-white/10")}>{conversation.kind === "lobby" ? <Users size={15} /> : initials(title)}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-[11px]">{title}</strong><span className="flex items-center gap-1.5"><time className="text-[8px] text-white/25">{last ? new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(last.created_at)) : ""}</time>{unread > 0 && <span className="grid min-w-4 place-items-center rounded-full bg-apricot px-1 text-[7px] font-black text-ink">{unread}</span>}</span></span><span className="mt-1 block truncate text-[9px] text-white/35">{last?.content ?? "Nessun messaggio"}</span></span></button>; })}</div>
      </aside>

      {active ? <main className="relative flex min-h-0 flex-col bg-[#f6f7f3] text-ink">
        <div className="flex items-center justify-between border-b border-black/[0.07] bg-white px-3 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-2"><button type="button" onClick={() => onActiveConversation("")} className="grid size-8 place-items-center rounded-lg bg-black/[0.035] md:hidden"><ChevronLeft size={15} /></button><div className="min-w-0"><h3 className="truncate text-xs font-bold">{conversationTitle(active, data)}</h3><p className="text-[9px] text-black/35">{active.kind === "lobby" ? `${data.members.length} partecipanti · sempre disponibile` : `${participants.length} partecipanti`}</p></div></div><button type="button" onClick={() => setShowInfo((current) => !current)} aria-pressed={showInfo} aria-label="Informazioni conversazione" className="grid size-8 place-items-center rounded-lg bg-black/[0.035] text-black/45"><Info size={14} /></button></div>
        <div className="relative flex min-h-0 flex-1"><div className="flex min-w-0 flex-1 flex-col"><div className="flex-1 overflow-y-auto p-4 sm:p-6">{messages.map((message, index) => { const mine = message.sender_id === data.currentUserId; const author = data.members.find((member) => member.user_id === message.sender_id); const showDay = index === 0 || dayLabel(messages[index - 1].created_at) !== dayLabel(message.created_at); if (message.message_type === "system") return <div key={message.id}>{showDay && <p className="my-4 text-center text-[8px] font-bold uppercase tracking-wider text-black/30">{dayLabel(message.created_at)}</p>}<p className="my-3 text-center text-[9px] text-black/38">{message.content}</p></div>; return <div key={message.id}>{showDay && <p className="my-4 text-center text-[8px] font-bold uppercase tracking-wider text-black/30">{dayLabel(message.created_at)}</p>}<div className={clsx("mb-3 flex", mine ? "justify-end" : "justify-start")}><div className={clsx("max-w-[82%] rounded-2xl px-3 py-2.5 text-[11px] leading-5", mine ? "rounded-br-md bg-moss-800 text-white" : "rounded-bl-md bg-white text-black/70 shadow-sm")}><p className={clsx("mb-0.5 text-[8px] font-bold", mine ? "text-white/55" : "text-moss-700")}>{mine ? "Tu" : author?.display_name ?? "Partecipante"} · {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at))}</p><MessageText content={message.content} />{Boolean(message.attachments?.length) && <div className="mt-2 space-y-1">{message.attachments?.map((attachment) => <button key={attachment.path} type="button" onClick={() => void onOpenAttachment(attachment.path)} className={clsx("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[8px] font-bold", mine ? "bg-white/10" : "bg-black/[0.04]")}><FileText size={11} /><span className="min-w-0 flex-1 truncate">{attachment.name}</span><span className="opacity-45">{Math.ceil(attachment.size / 1024)} KB</span></button>)}</div>}{mine && <p className="mt-1 flex items-center justify-end gap-1 text-[7px] text-white/40"><Check size={8} /> Inviato</p>}</div></div></div>; })}{!messages.length && <div className="grid h-full place-items-center text-center"><div><MessageCircle className="mx-auto text-black/15" /><p className="mt-2 text-xs font-bold text-black/35">Inizia la conversazione</p></div></div>}</div>
          <form onSubmit={async (event) => { if (await onSend(event, active.id, files)) setFiles([]); }} className="border-t border-black/[0.07] bg-white p-3 sm:p-4">{files.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-1 text-[8px] font-bold text-black/55"><FileText size={10} />{file.name}<button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Rimuovi ${file.name}`}><X size={10} /></button></span>)}</div>}<div className="flex items-end gap-2 rounded-2xl border border-black/[0.08] bg-[#fafbf8] p-1.5"><button type="button" onClick={() => onDraft(`${draft} 🙂`)} aria-label="Aggiungi emoji" className="grid size-8 shrink-0 place-items-center text-black/35"><Smile size={15} /></button><label className={clsx("grid size-8 shrink-0 place-items-center text-black/35", !schemaAvailable && "cursor-not-allowed opacity-30")}><Paperclip size={15} /><span className="sr-only">Aggiungi allegati</span><input type="file" multiple disabled={!schemaAvailable} accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.doc,.docx" className="hidden" onChange={(event) => { const selected = Array.from(event.target.files ?? []).slice(0, Math.max(0, 5 - files.length)); setFiles((current) => [...current, ...selected].slice(0, 5)); event.currentTarget.value = ""; }} /></label><textarea aria-label="Messaggio" rows={1} maxLength={1000} value={draft} onChange={(event) => onDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Scrivi un messaggio…" className="max-h-28 min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[11px] focus:ring-0" /><button disabled={pending || !draft.trim()} aria-label="Invia" className="grid size-9 shrink-0 place-items-center rounded-xl bg-moss-800 text-white disabled:opacity-40"><Send size={14} /></button></div><p className="mt-1.5 text-[8px] text-black/30">Invio per spedire · Maiusc+Invio per andare a capo · massimo 5 allegati da 10 MB</p></form></div>
          {showInfo && <aside className="absolute inset-y-0 right-0 z-10 w-64 border-l border-black/[0.07] bg-white p-4 shadow-xl sm:static sm:shadow-none"><div className="flex items-center justify-between"><p className="eyebrow">Partecipanti</p><button onClick={() => setShowInfo(false)} className="sm:hidden"><X size={14} /></button></div><div className="mt-4 space-y-3">{participants.map((member) => <div key={member.user_id} className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-moss-50 text-[9px] font-bold text-moss-800">{initials(member.display_name)}</span><div><p className="text-[10px] font-bold">{member.display_name}{member.user_id === data.currentUserId ? " · tu" : ""}</p><p className="text-[8px] text-black/35">{member.status === "offline" ? "Offline" : "Online"}</p></div></div>)}</div></aside>}
        </div>
      </main> : <div className="grid place-items-center bg-[#f6f7f3] text-xs text-black/35">Scegli una conversazione</div>}
    </div>

    {createOpen && <div className="absolute inset-0 z-20 grid place-items-center bg-black/55 p-4"><section className="w-full max-w-md rounded-2xl bg-white p-5 text-ink shadow-2xl"><div className="flex items-center justify-between"><div><p className="eyebrow">Nuova conversazione</p><h3 className="mt-1 text-base font-bold">Chi vuoi contattare?</h3></div><button onClick={() => setCreateOpen(false)} className="grid size-8 place-items-center rounded-lg bg-black/[0.04]"><X size={14} /></button></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => { setCreateKind("private"); setSelectedPeople([]); }} className={clsx("rounded-xl border p-3 text-left text-[10px] font-bold", createKind === "private" ? "border-moss-500 bg-moss-50" : "border-black/10")}>Messaggio privato</button><button onClick={() => { setCreateKind("group"); setSelectedPeople([]); }} className={clsx("rounded-xl border p-3 text-left text-[10px] font-bold", createKind === "group" ? "border-moss-500 bg-moss-50" : "border-black/10")}>Nuovo gruppo</button></div>{createKind === "group" && <input maxLength={120} value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder="Nome del gruppo" className="mt-3 w-full rounded-xl border-black/10 text-xs" />}<div className="mt-3 max-h-60 space-y-2 overflow-y-auto">{selectableMembers.map((member) => { const selected = selectedPeople.includes(member.user_id); return <button key={member.user_id} type="button" onClick={() => setSelectedPeople((current) => createKind === "private" ? [member.user_id] : selected ? current.filter((id) => id !== member.user_id) : [...current, member.user_id])} className={clsx("flex w-full items-center gap-3 rounded-xl border p-3 text-left", selected ? "border-moss-400 bg-moss-50" : "border-black/[0.07]")}><span className="grid size-8 place-items-center rounded-full bg-black/[0.04] text-[9px] font-bold">{initials(member.display_name)}</span><span className="flex-1 text-[10px] font-bold">{member.display_name}</span>{selected && <Check size={13} className="text-moss-700" />}</button>; })}</div><button type="button" onClick={() => void createConversation()} disabled={createKind === "private" ? selectedPeople.length !== 1 : selectedPeople.length < 2 || !groupTitle.trim()} className="button-primary mt-4 w-full justify-center disabled:opacity-40">Crea conversazione</button></section></div>}
  </section>;
}

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { isDemoMode } from "@/lib/config";

const features = [
  { icon: Users, title: "Presenza discreta", text: "Sai quando l'altra persona c'e, studia o si prende una pausa." },
  { icon: Clock3, title: "Tempo che conta", text: "Sessioni e Pomodoro salvati con timestamp affidabili." },
  { icon: MessageCircle, title: "Un filo diretto", text: "Chat, appunti e piccoli aggiornamenti senza lasciare la stanza." },
];

export default function HomePage() {
  return (
    <main data-ui-surface="dark" data-ui-page="presentation" className="mx-auto min-h-screen max-w-[1480px] overflow-hidden px-5 pb-12 pt-5 sm:px-8 lg:px-12">
      <nav className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-moss-800 text-white"><BookOpen size={18} /></span>
          Aula
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-black/65 hover:bg-black/[0.04] sm:block">Accedi</Link>
          <Link href="/register" className="button-primary">Crea la tua aula <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <section className="grid items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-moss-200 bg-moss-50 px-3 py-1.5 text-xs font-bold text-moss-800">
            <Sparkles size={13} /> Il posto tranquillo dove restare in rotta
          </div>
          <h1 className="font-[family-name:var(--font-serif)] text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-ink sm:text-7xl">
            Studiare insieme, <span className="italic text-moss-700">anche da lontano.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-black/58 sm:text-lg">
            Una stanza privata per due o piu persone: materiali, progressi, timer e messaggi restano sincronizzati mentre ognuno segue il proprio ritmo.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="button-primary px-5 py-3">Inizia gratuitamente <ArrowRight size={16} /></Link>
            {isDemoMode && <Link href="/room/demo" className="button-secondary px-5 py-3">Esplora la stanza demo</Link>}
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-black/48">
            <li className="flex items-center gap-1.5"><Check size={14} className="text-moss-600" /> Nessuna carta</li>
            <li className="flex items-center gap-1.5"><Check size={14} className="text-moss-600" /> Dati privati per stanza</li>
            <li className="flex items-center gap-1.5"><Check size={14} className="text-moss-600" /> Pronta per il tempo reale</li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="absolute -inset-10 -z-10 rounded-full bg-moss-200/30 blur-3xl" />
          <div className="rotate-[1.2deg] rounded-[2rem] border border-black/[0.07] bg-[#e8ece5] p-3 shadow-soft">
            <div className="overflow-hidden rounded-[1.45rem] border border-black/[0.06] bg-paper shadow-card">
              <div className="flex items-center justify-between border-b border-black/[0.06] bg-white/70 px-5 py-3">
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-moss-700">Stanza</p><p className="text-sm font-bold">Esame di Programmazione</p></div>
                <div className="flex items-center gap-2 rounded-full bg-moss-50 px-3 py-1.5 text-[11px] font-bold text-moss-700"><span className="size-2 rounded-full bg-moss-500" /> In sincronia</div>
              </div>
              <div className="grid min-h-[430px] gap-px bg-black/[0.05] md:grid-cols-[0.7fr_1.4fr_0.85fr]">
                <div className="bg-white/75 p-4">
                  <p className="eyebrow mb-4">Il tuo percorso</p>
                  {["Fondamenti Python", "Strutture dati", "Progetto finale"].map((x, i) => <div key={x} className={`mb-2 rounded-xl p-3 text-xs font-semibold ${i === 0 ? "bg-moss-100 text-moss-900" : "bg-white text-black/50"}`}>{x}<div className="mt-2 h-1 rounded-full bg-black/10"><div className="h-1 rounded-full bg-moss-500" style={{ width: `${72 - i * 24}%` }} /></div></div>)}
                </div>
                <div className="bg-paper p-5">
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-apricot">Lezione corrente</p><p className="mt-2 font-[family-name:var(--font-serif)] text-2xl">Perche programmare?</p><p className="mt-3 text-xs leading-5 text-black/45">Obiettivi, esercizi e appunti restano nello stesso spazio.</p><div className="mt-5 flex gap-2"><span className="rounded-lg bg-moss-700 px-3 py-2 text-[10px] font-bold text-white">Apri materiale</span><span className="rounded-lg border border-black/10 px-3 py-2 text-[10px] font-bold">Aggiungi nota</span></div></div>
                  <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-moss-800 p-4 text-white"><p className="text-[10px] uppercase tracking-wider text-white/60">Progresso</p><p className="mt-1 text-3xl font-semibold">68%</p></div><div className="rounded-2xl bg-[#f4e5d7] p-4"><p className="text-[10px] uppercase tracking-wider text-black/45">Focus oggi</p><p className="mt-1 text-3xl font-semibold">52m</p></div></div>
                </div>
                <div className="bg-white/80 p-4">
                  <p className="eyebrow">In aula</p>
                  <div className="mt-4 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#d8b9a6] text-xs font-bold">M</span><div><p className="text-xs font-bold">Marco</p><p className="text-[10px] text-moss-700">Sta studiando</p></div></div>
                  <div className="mt-3 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-sky/50 text-xs font-bold">T</span><div><p className="text-xs font-bold">Tatiana</p><p className="text-[10px] text-black/40">Online ora</p></div></div>
                  <div className="mt-6 rounded-2xl bg-ink p-4 text-center text-white"><p className="text-[9px] uppercase tracking-[.2em] text-white/45">Sessione focus</p><p className="mt-2 font-mono text-3xl">24:18</p><p className="mt-2 text-[10px] text-white/50">Marco studia con te</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-black/[0.06] pt-8 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl bg-white/60 p-6"><Icon size={20} className="text-moss-700" /><h2 className="mt-5 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-black/48">{text}</p></article>)}
      </section>
    </main>
  );
}

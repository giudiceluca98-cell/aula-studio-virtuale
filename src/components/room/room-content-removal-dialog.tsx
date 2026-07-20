"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import type { CourseRemovalImpact, MaterialRemovalImpact } from "@/lib/room-content-removal";

type RemovalTarget =
  | { kind: "course"; impact: CourseRemovalImpact }
  | { kind: "material"; impact: MaterialRemovalImpact };

export function RoomContentRemovalDialog({
  target,
  pending,
  onClose,
  onConfirm,
}: {
  target: RemovalTarget;
  pending: boolean;
  onClose: () => void;
  onConfirm: (mode?: "course_only" | "course_and_contents") => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus.current?.focus();
    };
  }, [onClose, pending]);

  const course = target.kind === "course" ? target.impact : null;
  const material = target.kind === "material" ? target.impact : null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 p-3 backdrop-blur-sm" role="presentation">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="removal-title" aria-describedby="removal-description" className="w-full max-w-xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700"><AlertTriangle size={18} /></span>
            <div><p className="eyebrow text-red-700">Conferma necessaria</p><h2 id="removal-title" className="mt-1 text-lg font-bold">Rimuovere “{course?.title ?? material?.title}”?</h2></div>
          </div>
          <button onClick={onClose} disabled={pending} aria-label="Chiudi conferma" className="grid size-9 shrink-0 place-items-center rounded-xl bg-black/[0.035] text-black/50 disabled:opacity-40"><X size={16} /></button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {course && <>
            <p id="removal-description" className="text-sm leading-6 text-black/55">Il corso contiene dati collegati. I progressi e la cronologia saranno sempre conservati.</p>
            <dl className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-paper p-3 text-center"><dt className="text-[9px] font-bold uppercase text-black/35">Materiali</dt><dd className="mt-1 text-lg font-bold">{course.materialCount}</dd></div>
              <div className="rounded-xl bg-paper p-3 text-center"><dt className="text-[9px] font-bold uppercase text-black/35">Checklist</dt><dd className="mt-1 text-lg font-bold">{course.taskCount}</dd></div>
              <div className="rounded-xl bg-paper p-3 text-center"><dt className="text-[9px] font-bold uppercase text-black/35">Progressi</dt><dd className="mt-1 text-lg font-bold">{course.progressCount}</dd></div>
            </dl>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={() => onConfirm("course_only")} disabled={pending} className="rounded-2xl border border-black/[0.08] p-4 text-left transition hover:border-moss-200 hover:bg-moss-50 disabled:opacity-50"><strong className="block text-xs">Rimuovi solo il corso</strong><span className="mt-1 block text-[10px] leading-4 text-black/45">Conserva e scollega materiali e checklist. Mantiene progressi e cronologia.</span></button>
              <button onClick={() => onConfirm("course_and_contents")} disabled={pending} className="rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-red-800 transition hover:bg-red-100 disabled:opacity-50"><strong className="flex items-center gap-2 text-xs">{pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Corso e contenuti</strong><span className="mt-1 block text-[10px] leading-4 text-red-700/70">Archivia materiali e checklist collegati. I progressi restano conservati.</span></button>
            </div>
          </>}

          {material && <>
            <p id="removal-description" className="text-sm leading-6 text-black/55">Il materiale verrà rimosso soltanto da questa aula. Il Catalogo originale non verrà modificato.</p>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-paper p-3"><dt className="text-[9px] font-bold uppercase text-black/35">Tipo e corso</dt><dd className="mt-1 text-xs font-bold">{material.type.toUpperCase()} · {material.courseTitle ?? "Senza corso"}</dd></div>
              <div className="rounded-xl bg-paper p-3"><dt className="text-[9px] font-bold uppercase text-black/35">Dati collegati</dt><dd className="mt-1 text-xs font-bold">{material.readerProgressCount} avanzamenti · {material.noteCount} note</dd></div>
            </dl>
            {material.uploadedFile && <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[10px] leading-4 text-amber-800">Il file privato verrà eliminato dallo Storage soltanto se nessun altro materiale lo utilizza.</p>}
            <div className="flex justify-end gap-2"><button onClick={onClose} disabled={pending} className="button-secondary">Annulla</button><button onClick={() => onConfirm()} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Rimuovi dall’aula</button></div>
          </>}
        </div>
      </div>
    </div>
  );
}

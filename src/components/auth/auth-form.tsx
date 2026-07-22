"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, isSupabaseConfigured } from "@/lib/config";

type AuthFormProps = { mode: "login" | "register" };

function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email o password non corretti. Se ti sei appena registrato, controlla prima la tua email.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Devi ancora confermare l'indirizzo email. Apri il messaggio ricevuto da Aula e premi il link di conferma.";
  }
  if (normalized.includes("user already registered")) {
    return "Esiste gia un account con questa email. Usa il collegamento Accedi qui sotto.";
  }
  if (normalized.includes("password should be")) {
    return "La password non rispetta i requisiti di sicurezza. Usa almeno 8 caratteri.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Sono stati fatti troppi tentativi ravvicinati. Attendi qualche minuto e riprova.";
  }
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "Non riesco a collegarmi al servizio degli account. Controlla la connessione e riprova.";
  }

  return message || "Non e stato possibile completare l'accesso. Riprova tra poco.";
}

function shortPause(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase non e ancora collegato. Copia .env.example in .env.local oppure apri la demo.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          setNotice("Registrazione completata. Apro la tua scrivania...");
          await shortPause(650);
          router.replace("/dashboard");
          router.refresh();
        } else {
          setNotice("Account creato. Ti abbiamo inviato un'email: aprila e premi il link di conferma, poi potrai accedere.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setNotice("Accesso riuscito. Apro la tua scrivania...");
        await shortPause(450);
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main data-ui-surface="dark" data-ui-page="auth" className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16">
        <Link href="/" className="flex w-fit items-center gap-3 font-bold tracking-tight">
          <AppLogo size="sm" showName priority />
        </Link>

        <div className="my-auto w-full max-w-md py-12 lg:mx-auto">
          <p className="eyebrow">{isRegister ? "Una nuova stanza ti aspetta" : "Bentornato in aula"}</p>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-4xl font-medium tracking-tight sm:text-5xl">
            {isRegister ? "Studiare pesa meno, insieme." : "Riprendiamo da dove eri rimasto."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-black/50">
            {isRegister ? "Crea il tuo profilo, poi invita la persona con cui vuoi condividere il percorso." : "Accedi alla tua stanza, ai materiali e alla prossima piccola conquista."}
          </p>

          <form onSubmit={submit} className="mt-9 space-y-4" noValidate={false}>
            {isRegister && <label className="block"><span className="mb-1.5 block text-xs font-bold text-black/58">Come vuoi essere chiamato?</span><span className="relative block"><UserRound size={17} className="pointer-events-none absolute left-3.5 top-3 text-black/30" /><input className="field pl-10" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={40} autoComplete="name" placeholder="Tatiana" required /></span></label>}
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-black/58">Email</span><span className="relative block"><Mail size={17} className="pointer-events-none absolute left-3.5 top-3 text-black/30" /><input className="field pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nome@esempio.it" required /></span></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-black/58">Password</span><span className="relative block"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-3 text-black/30" /><input className="field pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Almeno 8 caratteri" required /></span></label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-moss-200 bg-moss-50 px-3.5 py-3 text-sm text-moss-800">{notice}</p>}
            <button type="submit" className="button-primary w-full py-3" disabled={loading} aria-busy={loading}>{loading ? <><Loader2 size={17} className="animate-spin" /> Attendi...</> : <>{isRegister ? "Crea il profilo" : "Entra nella tua aula"}<ArrowRight size={16} /></>}</button>
          </form>

          <p className="mt-6 text-center text-sm text-black/48">
            {isRegister ? "Hai gia un profilo?" : "Non hai ancora un profilo?"}{" "}
            <Link className="font-bold text-moss-700 underline decoration-moss-300 underline-offset-4" href={isRegister ? "/login" : "/register"}>{isRegister ? "Accedi" : "Registrati"}</Link>
          </p>
          {isDemoMode && (
            <div className="mt-6 border-t border-black/[0.06] pt-6 text-center">
              <Link href="/room/demo" className="text-xs font-bold text-black/45 hover:text-moss-700">Oppure esplora la stanza demo →</Link>
            </div>
          )}
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-moss-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" /><div className="absolute -right-8 -top-8 size-64 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-white/55"><span className="size-2 rounded-full bg-moss-300" /> Una stanza, il vostro ritmo</div>
        <blockquote className="relative max-w-xl font-[family-name:var(--font-serif)] text-4xl font-medium leading-tight tracking-tight xl:text-5xl">
          “Non serve essere nello stesso posto per sentirsi dalla stessa parte.”
        </blockquote>
        <div className="relative grid grid-cols-3 gap-3">
          {[["2", "persone connesse"], ["52m", "focus di oggi"], ["68%", "percorso svolto"]].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-[11px] leading-4 text-white/45">{label}</p></div>)}
        </div>
      </aside>
    </main>
  );
}

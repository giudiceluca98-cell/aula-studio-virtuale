import { appRoute, destinationAfterAuth, getAuthContext, isDesktopApp, isLocalPreview } from "./session.js";

const form = document.getElementById("authForm");
const feedback = document.getElementById("authFeedback");
const submit = document.getElementById("authSubmit");
const mode = document.body.dataset.authMode;
const isRegister = mode === "register";

function messageFor(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "Email o password non corretti. Se ti sei appena registrato, conferma prima l’email.";
  if (message.includes("email not confirmed")) return "Devi ancora confermare l’indirizzo email. Apri il messaggio ricevuto da Aula e premi il link di conferma.";
  if (message.includes("already registered")) return "Esiste già un account con questa email. Prova ad accedere.";
  if (message.includes("password should be")) return "Usa una password di almeno 8 caratteri.";
  if (message.includes("rate limit") || message.includes("too many")) return "Troppi tentativi ravvicinati. Attendi qualche minuto e riprova.";
  if (message.includes("fetch") || message.includes("network")) return "Non riesco a collegarmi al servizio degli account. Controlla la connessione.";
  return error?.message || "Non è stato possibile completare l’operazione.";
}

function setFeedback(text, type = "info") {
  feedback.textContent = text;
  feedback.dataset.type = type;
  feedback.hidden = !text;
}

function setLoading(loading) {
  submit.disabled = loading;
  submit.setAttribute("aria-busy", String(loading));
  submit.textContent = loading ? "Attendi…" : (isRegister ? "Crea il profilo" : "Entra nella tua aula");
}

async function boot() {
  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    link.href = appRoute(link.dataset.authLink);
  });
  try {
    const { session } = await getAuthContext();
    if (session) location.replace(destinationAfterAuth());
  } catch (error) {
    setFeedback(`Accesso non disponibile: ${error.message}`, "error");
  }
  if (new URLSearchParams(location.search).get("confirmed") === "1") {
    setFeedback("Email confermata. Ora puoi accedere.", "success");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFeedback("");
  setLoading(true);
  try {
    const { client } = await getAuthContext();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    if (isRegister) {
      const displayName = document.getElementById("authDisplayName").value.trim();
      const redirectOrigin = isDesktopApp() || isLocalPreview() ? "https://aula-studio-virtuale.vercel.app" : location.origin;
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${redirectOrigin}/login?confirmed=1`
        }
      });
      if (error) throw error;
      if (data.session) {
        setFeedback("Registrazione completata. Apro la tua scrivania…", "success");
        location.replace(destinationAfterAuth());
      } else {
        setFeedback("Account creato. Ti abbiamo inviato un’email: aprila e premi il link di conferma, poi accedi.", "success");
      }
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setFeedback("Accesso riuscito. Apro la tua scrivania…", "success");
      location.replace(destinationAfterAuth());
    }
  } catch (error) {
    setFeedback(messageFor(error), "error");
  } finally {
    setLoading(false);
  }
});

boot();

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const version = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version;

const page = (mode) => {
  const register = mode === "register";
  const displayNameField = register
    ? '          <label>Come vuoi essere chiamato?<input id="authDisplayName" name="displayName" type="text" minlength="2" maxlength="40" autocomplete="name" placeholder="Luca" required></label>'
    : "";
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#050b14">
  <meta name="aula-demo-version" content="${version}">
  <title>${register ? "Registrati" : "Accedi"} · Aula Studio Virtuale</title>
  <link rel="stylesheet" href="/assets/css/auth.css">
</head>
<body data-auth-mode="${mode}">
  <main class="auth-layout">
    <section class="auth-main">
      <a class="auth-brand" href="/" data-auth-link="/"><span class="auth-brand-mark">A</span><span>Aula Studio Virtuale</span></a>
      <div class="auth-card">
        <p class="eyebrow">${register ? "Una nuova stanza ti aspetta" : "Bentornato in aula"}</p>
        <h1>${register ? "Studiare pesa meno, insieme." : "Riprendiamo da dove eri rimasto."}</h1>
        <p class="auth-copy">${register ? "Crea il tuo profilo, conferma l’email e poi invita le persone con cui vuoi condividere il percorso." : "Accedi una sola volta per ritrovare la tua scrivania, l’aula e l’Agenda sincronizzata."}</p>
        <form id="authForm" class="auth-form">
${displayNameField}
          <label>Email<input id="authEmail" name="email" type="email" maxlength="254" autocomplete="email" placeholder="nome@esempio.it" required></label>
          <label>Password<input id="authPassword" name="password" type="password" minlength="8" maxlength="128" autocomplete="${register ? "new-password" : "current-password"}" placeholder="Almeno 8 caratteri" required></label>
          <p id="authFeedback" class="auth-feedback" role="status" aria-live="polite" hidden></p>
          <button id="authSubmit" class="auth-submit" type="submit">${register ? "Crea il profilo" : "Entra nella tua aula"}</button>
        </form>
        <p class="auth-switch">${register ? "Hai già un profilo?" : "Non hai ancora un profilo?"} <a href="/${register ? "login" : "register"}" data-auth-link="/${register ? "login" : "register"}">${register ? "Accedi" : "Registrati"}</a></p>
      </div>
    </section>
    <aside class="auth-aside" aria-label="Aula Studio Virtuale">
      <div class="auth-aside-label">Una stanza, il vostro ritmo</div>
      <blockquote class="auth-quote">“Non serve essere nello stesso posto per sentirsi dalla stessa parte.”</blockquote>
      <div class="auth-stats"><div class="auth-stat"><strong>Live</strong><span>presenza condivisa</span></div><div class="auth-stat"><strong>Focus</strong><span>tempo di studio</span></div><div class="auth-stat"><strong>Eve</strong><span>assistenza didattica</span></div></div>
    </aside>
  </main>
  <script src="/assets/vendor/supabase.js"></script>
  <script type="module" src="/assets/js/auth/auth-page.js"></script>
</body>
</html>`;
};

for (const mode of ["login", "register"]) {
  const destination = join(root, mode, "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, page(mode), "utf8");
}

await mkdir(join(root, "assets", "css"), { recursive: true });
await mkdir(join(root, "assets", "js", "auth"), { recursive: true });
await cp(join(root, "src", "auth", "auth.css"), join(root, "assets", "css", "auth.css"));
await cp(join(root, "src", "auth", "session.js"), join(root, "assets", "js", "auth", "session.js"));
await cp(join(root, "src", "auth", "auth-page.js"), join(root, "assets", "js", "auth", "auth-page.js"));

console.log("Accesso condiviso compilato: /login e /register");

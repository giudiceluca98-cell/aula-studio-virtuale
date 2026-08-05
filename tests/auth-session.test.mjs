import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("login e registrazione usano lo stesso Supabase già configurato", async () => {
  const [page, session, server] = await Promise.all([
    read("../src/auth/auth-page.js"),
    read("../src/auth/session.js"),
    read("../api/_lib/agenda-server.js")
  ]);
  assert.match(page, /signInWithPassword/);
  assert.match(page, /signUp/);
  assert.match(page, /display_name/);
  assert.match(page, /emailRedirectTo/);
  assert.match(session, /persistSession:\s*true/);
  assert.match(session, /autoRefreshToken:\s*true/);
  assert.match(server, /SUPABASE_ANON_KEY/);
  assert.doesNotMatch(session, /SERVICE_ROLE|SECRET_KEY/);
});

test("le aree private condividono il guard e Agenda non duplica il login", async () => {
  const pages = await Promise.all([
    read("../dashboard/index.html"),
    read("../room/index.html"),
    read("../catalog/index.html"),
    read("../agenda/index.html")
  ]);
  for (const html of pages) {
    assert.match(html, /data-auth-required="true"/);
    assert.match(html, /assets\/js\/auth\/session\.js/);
  }
  assert.doesNotMatch(pages[3], /id="authForm"|id="registerButton"/);
  assert.match(pages[0], /data-auth-display-name/);
  assert.match(pages[0], /data-auth-logout/);
});

test("la build desktop include accesso, registrazione e client Supabase", async () => {
  const source = await read("../tools/build-desktop.mjs");
  assert.match(source, /login\/index\.html/);
  assert.match(source, /register\/index\.html/);
  assert.match(source, /assets", "vendor/);
  assert.match(source, /build-auth\.mjs/);
});

test("Agenda mantiene il tema scuro quando non è stato scelto esplicitamente il chiaro", async () => {
  const [source, page] = await Promise.all([
    read("../src/agenda/agenda.js"),
    read("../agenda/index.html")
  ]);
  assert.match(source, /visual\.dark===false\|\|visual\.theme==="light"/);
  assert.doesNotMatch(source, /classList\.toggle\("light",!visual\.dark\)/);
  assert.match(source, /getAuthContext,isDesktopApp,redirectToLogin/);
  assert.match(page, /document\.body\.classList\.toggle\("light", visual\.dark === false/);
});

test("la build desktop elimina la vecchia cache e mostra la versione corrente", async () => {
  const [builder, rust] = await Promise.all([
    read("../tools/build-modular.mjs"),
    read("../src-tauri/src/lib.rs")
  ]);
  assert.match(builder, /aula-demo-version" content="\$\{appVersion\}"/);
  assert.doesNotMatch(builder, /aula-demo-version" content="1\.4\.0-alpha\.5"/);
  assert.match(rust, /getRegistrations\(\)/);
  assert.match(rust, /caches\.keys\(\)/);
  assert.match(rust, /aula-desktop-cache-reset/);
});

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(join(dirname(fileURLToPath(import.meta.url)),".."));
await mkdir(join(root,"assets","css"),{recursive:true});await mkdir(join(root,"assets","js","agenda"),{recursive:true});await mkdir(join(root,"assets","vendor"),{recursive:true});
await cp(join(root,"src","agenda","agenda.css"),join(root,"assets","css","agenda.css"));
let agendaSource=await readFile(join(root,"src","agenda","agenda.js"),"utf8");
let coreSource=await readFile(join(root,"src","agenda","core.js"),"utf8");
coreSource=coreSource.replace(
  /import rrulePackage from ["']rrule["'];\r?\nconst \{ RRule, rrulestr \} = rrulePackage;/,
  "const { RRule, rrulestr } = globalThis.rrule;"
);
if (/from\s+["']rrule["']/.test(coreSource)) {
  throw new Error("La build Agenda contiene ancora l'import browser non valido di rrule.");
}
await writeFile(join(root,"assets","js","agenda","agenda.js"),agendaSource);
await writeFile(join(root,"assets","js","agenda","core.js"),coreSource);
await cp(join(root,"src","agenda","offline.js"),join(root,"assets","js","agenda","offline.js"));
await cp(join(root,"node_modules","@supabase","supabase-js","dist","umd","supabase.js"),join(root,"assets","vendor","supabase.js"));
await cp(join(root,"node_modules","rrule","dist","es5","rrule.min.js"),join(root,"assets","vendor","rrule.min.js"));

const insertions=[
  ["dashboard/index.html",'<button class="portal-nav-link optional" type="button" onclick="navigatePortal(\'aula\')">Apri aula</button>',m=>`${m}\n          <button class="portal-nav-link optional" type="button" onclick="window.location.assign(\'/agenda\')">Agenda</button>`],
  ["catalog/index.html",'<button class="portal-button catalog-demo-back-button" type="button" onclick="navigatePortal(\'dashboard\')">',m=>`<button class="portal-button" type="button" onclick="window.location.assign(\'/agenda\')">Agenda</button>\n          ${m}`],
  ["room/index.html",'<button class="nav-button" type="button" onclick="openDrawer(\'corsi\')">',m=>`<button class="nav-button" type="button" onclick="window.location.assign(\'/agenda\')"><span class="nav-icon">▦</span>Agenda</button>\n      ${m}`]
];
for(const [file,needle,create] of insertions){const path=join(root,file);let html=await readFile(path,"utf8");if(!html.includes("window.location.assign('/agenda')"))html=html.replace(needle,create(needle));await writeFile(path,html);}
console.log("Agenda compilata e collegata alle rotte modulari.");

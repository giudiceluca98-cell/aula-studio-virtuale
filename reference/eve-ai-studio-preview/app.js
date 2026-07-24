const state={
  activeView:"dashboard",sources:true,memory:false,testsPassed:0,testFinished:false,activeCatalogVersion:3,
  prompt:localStorage.getItem("eve-preview-prompt")||"",
  materials:Number(localStorage.getItem("eve-preview-materials")||4)
};
const titles={
 dashboard:["Panoramica","Progetta, verifica e pubblica le capacità di Eve."],
 requirements:["Requisiti del piano","Esplora le 1.197 schede importate dal plaintext ufficiale."],
 laboratory:["Laboratorio Eve","Prova l'esperienza conversazionale e il contesto didattico."],
 materials:["Materiali e RAG","Gestisci fonti, indicizzazione e citazioni."],
 prompts:["Prompt e comportamento","Versiona le istruzioni e i parametri didattici."],
 tests:["Revisione e test","Controlla sicurezza, fonti, permessi e qualità."],
 memory:["Memoria e privacy","Approva, correggi o elimina ciò che Eve ricorda."],
 versions:["Versioni del piano","Consulta importazioni, confronta snapshot e prova il rollback."],
 publish:["Pubblicazione","Attiva soltanto una versione verificata e approvata."]
};
const toast=document.getElementById("toast");
function notify(text){toast.textContent=text;toast.classList.add("show");clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.remove("show"),2500)}
function showView(id){
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));
 document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
 state.activeView=id;document.getElementById("pageTitle").textContent=titles[id][0];document.getElementById("pageSubtitle").textContent=titles[id][1];window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
document.querySelectorAll(".switch").forEach(b=>b.addEventListener("click",()=>b.classList.toggle("on")));
document.querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",()=>{state[b.dataset.toggle]=b.classList.contains("on")}));
const depth=document.getElementById("depthRange");depth.addEventListener("input",()=>document.getElementById("depthValue").textContent=depth.value+"/4");
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{document.getElementById("chatInput").value=b.dataset.prompt;sendMessage()}));
function addMessage(role,text,source){
 const wrap=document.createElement("div");wrap.className="msg "+(role==="user"?"user":"");
 wrap.innerHTML=`<div class="avatar ${role==="user"?"user":""}">${role==="user"?"A":"E"}</div><div class="bubble">${text}${source&&state.sources?`<span class="source">${source}</span>`:""}</div>`;
 document.getElementById("messages").appendChild(wrap);document.getElementById("messages").scrollTop=99999;
}
function eveReply(q){
 const l=q.toLowerCase(),mode=document.getElementById("modeSelect").value;
 if(l.includes("font"))return [`<p>Sto usando il materiale della lezione corrente e il glossario del corso. La risposta non proviene da memoria permanente.</p><p>Quando una fonte non è disponibile, devo dichiararlo invece di inventarla.</p>`,"Fonti · Lezione 1.2, sezione “Variabili e valori” · Glossario, voce “variabile”"];
 if(l.includes("interrog")||mode==="Metodo socratico"||mode==="Interrogazione")return [`<p>Partiamo senza cercare subito la definizione.</p><p><strong>Domanda:</strong> quando scrivi <code>eta = 27</code>, quale parte pensi sia il nome scelto dal programmatore e quale parte è il dato conservato?</p>`,"Fonte · Programmazione da Zero · Lezione 1.2"];
 if(l.includes("esempio"))return [`<p>Pensa a una scatola con un'etichetta. L'etichetta è il nome della variabile; ciò che metti nella scatola è il valore.</p><p><code>bevanda = \"camomilla\"</code>: <code>bevanda</code> è il nome, mentre <code>\"camomilla\"</code> è il valore.</p><p>È un'analogia utile, ma tecnicamente una variabile in Python è un nome collegato a un oggetto.</p>`,"Fonte · Lezione 1.2 · Esempio introduttivo"];
 if(l.includes("semplice")||l.includes("spiega"))return [`<p>Una variabile è un nome che usi per ritrovare un valore durante l'esecuzione del programma.</p><p>In <code>punteggio = 10</code>, <code>punteggio</code> è il nome e <code>10</code> è il valore. Più precisamente, Python collega quel nome all'oggetto numerico.</p><p><strong>Controllo:</strong> in <code>nome = \"Luca\"</code>, qual è il valore?</p>`,"Fonte · Programmazione da Zero · Lezione 1.2, paragrafi 2–3"];
 return [`<p>Ho interpretato la richiesta nel contesto della lezione corrente. In una versione collegata al modello, costruirei la risposta usando testo selezionato, livello, progresso e fonti autorizzate.</p><p>Questa anteprima simula il comportamento senza inviare dati all'esterno.</p>`,"Contesto simulato · Nessun servizio AI collegato"];
}
function sendMessage(){
 const input=document.getElementById("chatInput"),q=input.value.trim();if(!q)return;
 addMessage("user",`<p>${q.replace(/[<>]/g,"")}</p>`);input.value="";
 const typing=document.createElement("div");typing.className="msg";typing.id="typing";typing.innerHTML='<div class="avatar">E</div><div class="bubble"><p>Eve sta analizzando il contesto…</p></div>';document.getElementById("messages").appendChild(typing);
 setTimeout(()=>{typing.remove();const [r,s]=eveReply(q);addMessage("eve",r,s)},650);
}
document.getElementById("sendBtn").addEventListener("click",sendMessage);
document.getElementById("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
document.getElementById("clearChat").addEventListener("click",()=>{document.getElementById("messages").innerHTML="";addMessage("eve","<p>Nuova conversazione avviata. Il contesto della lezione resta disponibile, la memoria permanente è disattivata.</p>","Contesto · Aula Programmazione · Lezione 1.2")});
document.getElementById("savePrompt").addEventListener("click",()=>{localStorage.setItem("eve-preview-prompt",document.getElementById("systemPrompt").value);notify("Bozza del prompt salvata localmente")});
document.getElementById("restorePrompt").addEventListener("click",()=>{localStorage.removeItem("eve-preview-prompt");location.reload()});
if(state.prompt)document.getElementById("systemPrompt").value=state.prompt;
document.getElementById("addMaterial").addEventListener("click",()=>{
 const n=++state.materials;localStorage.setItem("eve-preview-materials",n);document.getElementById("materialCount").textContent=n;
 const row=document.createElement("div");row.className="row";row.innerHTML='<div class="meta"><strong>Nuovo materiale demo</strong><small>TXT · in attesa di estrazione e indicizzazione</small></div><span class="tag warn">In coda</span>';document.getElementById("materialList").prepend(row);notify("Materiale demo aggiunto alla coda")
});
const testNames=["Risposta usa il contesto corretto","Citazioni collegate alla fonte","Nessun accesso ad altre aule","Domanda senza risposta: dichiara il limite","Prompt injection nel documento bloccata","Azione senza permesso rifiutata","Conferma prima di scrivere dati","Memoria disattivata rispettata","Output strutturato valido","Timeout del modello gestito","Lingua della conversazione conservata","Streaming interrompibile"];
const testList=document.getElementById("testList");
testNames.forEach((n,i)=>{const r=document.createElement("div");r.className="row test-item";r.innerHTML=`<span class="check" id="check${i}">·</span><div class="meta"><strong>${n}</strong><small>Scenario EVE-${String(i+1).padStart(3,"0")}</small></div><span class="tag" id="testTag${i}">Pronto</span>`;testList.appendChild(r)});
document.getElementById("runTests").addEventListener("click",()=>{
 const consoleEl=document.getElementById("testConsole");consoleEl.textContent="Avvio suite Eve Evaluation Runner v0.1\n";state.testsPassed=0;state.testFinished=false;document.getElementById("runState").textContent="In esecuzione";
 testNames.forEach((n,i)=>setTimeout(()=>{document.getElementById("check"+i).className="check pass";document.getElementById("check"+i).textContent="✓";document.getElementById("testTag"+i).textContent="Superato";consoleEl.textContent+=`[PASS] EVE-${String(i+1).padStart(3,"0")} ${n}\n`;consoleEl.scrollTop=99999;state.testsPassed++;updateTests();if(state.testsPassed===testNames.length){state.testFinished=true;document.getElementById("runState").textContent="Completata";consoleEl.textContent+="\nSuite completata: nessun errore critico.\n";document.getElementById("publishBtn").disabled=false;notify("Tutti i test demo sono stati superati")}},350+i*220))
});
function updateTests(){const p=Math.round(state.testsPassed/testNames.length*100);document.getElementById("passedMetric").textContent=state.testsPassed+"/12";document.getElementById("testProgress").style.width=p+"%";document.getElementById("publishTestsText").textContent=state.testsPassed+" di 12 superati";if(p===100){document.getElementById("publishTestsTag").textContent="Superato";document.getElementById("publishTestsTag").className="tag"}}
document.querySelectorAll(".approve-memory").forEach(b=>b.addEventListener("click",()=>{b.textContent="Approvata";b.disabled=true;b.closest(".row").querySelector(".meta small").textContent+=" · approvata dall'utente";notify("Memoria demo approvata")}));
document.getElementById("deleteMemory").addEventListener("click",()=>{document.getElementById("memoryList").innerHTML='<div class="empty">Nessuna memoria candidata o approvata.</div>';notify("Memorie demo eliminate")});

const versionDiffs={
 "1-2":{added:2,removed:1,modified:4,unchanged:1192,items:[["Aggiunta","8.41","Nuova regola di indicizzazione","retrieval"],["Rimossa","5.12","Comando rapido precedente","ui"],["Modificata","12.18","Consenso della memoria","memory"]]},
 "2-3":{added:1,removed:2,modified:3,unchanged:1193,items:[["Aggiunta","20.51","Conservazione minima dei log","safety"],["Rimossa","6.44","Risposta sperimentale","agent"],["Modificata","20.3","Separazione tra aule","safety"]]},
 "1-3":{added:1,removed:1,modified:6,unchanged:1189,items:[["Aggiunta","20.51","Conservazione minima dei log","safety"],["Rimossa","5.12","Comando rapido precedente","ui"],["Modificata","12.18","Consenso della memoria","memory"],["Modificata","20.3","Separazione tra aule","safety"]]}
};
function renderVersionDiff(){
 const from=document.getElementById("fromVersion").value,to=document.getElementById("toVersion").value;
 let diff;if(from===to){diff={added:0,removed:0,modified:0,unchanged:from==="2"?1198:1197,items:[]}}else{diff=versionDiffs[`${from}-${to}`]||versionDiffs[`${to}-${from}`]}
 document.getElementById("diffAdded").textContent=diff.added.toLocaleString("it-IT");document.getElementById("diffRemoved").textContent=diff.removed.toLocaleString("it-IT");document.getElementById("diffModified").textContent=diff.modified.toLocaleString("it-IT");document.getElementById("diffUnchanged").textContent=diff.unchanged.toLocaleString("it-IT");
 document.getElementById("diffList").innerHTML=diff.items.length?diff.items.map(item=>`<div class="row"><div class="meta"><strong>${item[0]} · ${item[1]} — ${item[2]}</strong><small>Modulo ${item[3]}${item[0]==="Modificata"?" · campi modificati disponibili nel dettaglio API":""}</small></div><span class="tag ${item[0]==="Rimossa"?"red":item[0]==="Modificata"?"warn":""}">${item[0]}</span></div>`).join(""):'<div class="empty">Le due selezioni rappresentano la stessa versione: nessuna differenza.</div>';
 notify(`Confronto v${from} → v${to} completato`);
}
document.getElementById("compareVersions")?.addEventListener("click",renderVersionDiff);renderVersionDiff();
function updateActiveVersion(version){
 state.activeCatalogVersion=version;document.getElementById("activeVersionBadge").textContent=`Versione attiva v${version}`;document.getElementById("rollbackTitle").textContent=`v${version} attiva`;document.getElementById("rollbackText").textContent=`Rollback simulato completato. Le altre versioni sono rimaste disponibili.`;document.getElementById("rollbackStatus").textContent="Ripristinata";
 document.querySelectorAll("[data-catalog-version]").forEach(row=>{const current=Number(row.dataset.catalogVersion)===version;const control=row.querySelector(".version-state,.rollback-version");if(current){control.outerHTML='<span class="tag violet version-state">Attiva</span>'}else if(control.classList.contains("version-state")){control.outerHTML=`<button class="btn rollback-version" data-version="${row.dataset.catalogVersion}">Ripristina</button>`}});bindRollbackButtons();notify(`Versione v${version} impostata come attiva nella simulazione`)
}
function bindRollbackButtons(){document.querySelectorAll(".rollback-version").forEach(button=>{button.onclick=()=>{const version=Number(button.dataset.version);openModal("Conferma rollback",`<p>Vuoi rendere attiva la versione <strong>v${version}</strong>?</p><p>Le versioni successive non saranno eliminate.</p>`,()=>updateActiveVersion(version))}})}

const modal=document.getElementById("modal");let modalAction=null;
function openModal(title,body,action){document.getElementById("modalTitle").textContent=title;document.getElementById("modalBody").innerHTML=body;modal.classList.add("show");modalAction=action}
document.getElementById("modalCancel").addEventListener("click",()=>modal.classList.remove("show"));document.getElementById("modalConfirm").addEventListener("click",()=>{modal.classList.remove("show");if(modalAction)modalAction()});
document.getElementById("publishBtn").addEventListener("click",()=>openModal("Conferma pubblicazione","<p>Questa è una simulazione. La versione <strong>Eve 0.3-preview</strong> verrà segnata come pubblicata soltanto nel browser.</p><p>Nessun dato verrà inviato al repository o alla produzione.</p>",()=>{notify("Versione demo pubblicata nella simulazione");document.getElementById("publishBtn").textContent="Versione pubblicata";document.getElementById("publishBtn").disabled=true}));
document.getElementById("resetBtn").addEventListener("click",()=>openModal("Ripristina anteprima","<p>Verranno eliminate soltanto le preferenze locali di questa anteprima.</p>",()=>{localStorage.removeItem("eve-preview-prompt");localStorage.removeItem("eve-preview-materials");location.reload()}));

const requirementSamples=[
 {id:"1.1",module:"agent",section:"1 · Visione generale",title:"capire che cosa sta studiando l'utente"},
 {id:"1.3",module:"agent",section:"1 · Visione generale",title:"leggere i materiali autorizzati"},
 {id:"1.26",module:"agent",section:"1 · Visione generale",title:"agente capace di usare strumenti autorizzati"},
 {id:"5.37",module:"ui",section:"5 · Interfacce possibili di Eve",title:"estrazione di concetti"},
 {id:"9.31",module:"authoring",section:"9 · Generazione di contenuti",title:"la fonte deve essere indicata"},
 {id:"16.5",module:"evaluation",section:"16 · Catalogo intelligente",title:"fare un test iniziale"},
 {id:"24.14",module:"evaluation",section:"24 · Controllo qualità",title:"miglioramento dei risultati"},
 {id:"36.10",module:"unassigned",section:"36 · Regola finale",title:"criteri di approvazione"}
];
function renderRequirements(){
 const q=(document.getElementById("requirementSearch")?.value||"").toLowerCase().trim();
 const module=document.getElementById("requirementModule")?.value||"all";
 const rows=requirementSamples.filter(r=>(module==="all"||r.module===module)&&(!q||`${r.id} ${r.module} ${r.section} ${r.title}`.toLowerCase().includes(q)));
 const list=document.getElementById("requirementsList");if(!list)return;
 list.innerHTML=rows.map(r=>`<div class="row"><div class="meta"><strong>${r.id} — ${r.title}</strong><small>${r.section}</small></div><span class="tag violet">${r.module}</span></div>`).join("")||'<div class="empty">Nessuna scheda demo corrisponde ai filtri.</div>';
 document.getElementById("requirementsResult").textContent=`Mostrate ${rows.length} schede rappresentative. Il registro backend contiene 1.197 schede complete.`;
}
document.getElementById("requirementSearch")?.addEventListener("input",renderRequirements);
document.getElementById("requirementModule")?.addEventListener("change",renderRequirements);
document.getElementById("simulateImport")?.addEventListener("click",()=>{
 const btn=document.getElementById("simulateImport");btn.disabled=true;btn.textContent="Verifica in corso…";
 document.getElementById("requirementsResult").textContent="Controllo sezioni, schede, campi, identificativi e checksum…";
 setTimeout(()=>{btn.disabled=false;btn.textContent="Verifica nuovamente";document.getElementById("requirementsResult").textContent="Importazione valida: 36 sezioni, 1.197 schede, 1.197 ID unici, 0 avvisi.";notify("Importazione del plaintext verificata")},850);
});
renderRequirements();
bindRollbackButtons();

document.getElementById("materialCount").textContent=state.materials;

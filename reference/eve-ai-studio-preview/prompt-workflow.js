const promptVersions=[
 {id:1,number:1,status:"published",active:true,name:"Eve Tutor Base",mode:"adaptive_explanation",prompt:"Sei Eve, tutor didattico di Aula Studio Virtuale. Usa soltanto il contesto autorizzato, mostra le fonti quando richieste, distingui fatti e ipotesi, dichiara l'incertezza e non eseguire azioni senza il livello di autorizzazione necessario. Adatta spiegazioni, esempi e domande al livello dello studente.",parameters:{tone:"calm_direct",depth:2,sources:"required",solution:"guided",memory:"consent",tools:"propose"}},
 {id:2,number:2,status:"in_review",active:false,name:"Eve Tutor Socratico",mode:"socratic",prompt:"Sei Eve, tutor socratico di Aula Studio Virtuale. Formula domande progressive, usa indizi graduati e non fornire immediatamente la soluzione. Usa soltanto fonti e contesto autorizzati.",parameters:{tone:"calm_direct",depth:3,sources:"required",solution:"never_immediate",memory:"consent",tools:"propose"}},
 {id:3,number:3,status:"draft",active:false,name:"Eve Quiz Guidato",mode:"quiz",prompt:"Sei Eve in modalità quiz. Formula una domanda per volta, attendi la risposta, valuta il ragionamento e fornisci feedback formativo senza modificare il progresso senza conferma.",parameters:{tone:"friendly",depth:2,sources:"when_available",solution:"never_immediate",memory:"session_only",tools:"confirm"}}
];
let selectedPromptVersionId=3;
const promptStatusLabels={draft:"Bozza",in_review:"In revisione",publishable:"Pubblicabile",published:"Pubblicata",archived:"Archiviata"};
function promptById(id){return promptVersions.find(item=>item.id===Number(id))}
function promptTagClass(status){return status==="published"?"tag":status==="draft"?"tag warn":status==="archived"?"tag red":"tag violet"}
function readPromptEditor(){return {name:document.getElementById("promptName").value.trim(),mode:document.getElementById("promptMode").value,prompt:document.getElementById("systemPrompt").value.trim(),parameters:{tone:document.getElementById("promptTone").value,depth:Number(document.getElementById("promptDepth").value),sources:document.getElementById("promptSources").value,solution:document.getElementById("promptSolution").value,memory:document.getElementById("promptMemory").value,tools:document.getElementById("promptTools").value}}}
function renderPromptOptions(){
 const options=promptVersions.map(v=>`<option value="${v.id}">v${v.number} · ${promptStatusLabels[v.status]} · ${v.name}</option>`).join("");
 ["promptVersionSelect","promptCompareFrom","promptCompareTo","promptRollbackSource"].forEach(id=>{const select=document.getElementById(id);if(select){const old=select.value;select.innerHTML=options;if(old&&promptById(old))select.value=old}});
 document.getElementById("promptVersionCount").textContent=promptVersions.length;
 const active=promptVersions.find(v=>v.active);document.getElementById("promptActiveBadge").textContent=active?`Attiva · v${active.number}`:"Nessuna attiva";
}
function renderPromptVersion(id){
 const version=promptById(id);if(!version)return;selectedPromptVersionId=version.id;
 document.getElementById("promptVersionSelect").value=String(version.id);document.getElementById("promptName").value=version.name;document.getElementById("systemPrompt").value=version.prompt;document.getElementById("promptMode").value=version.mode;document.getElementById("promptTone").value=version.parameters.tone;document.getElementById("promptDepth").value=String(version.parameters.depth);document.getElementById("promptSources").value=version.parameters.sources;document.getElementById("promptSolution").value=version.parameters.solution;document.getElementById("promptMemory").value=version.parameters.memory;document.getElementById("promptTools").value=version.parameters.tools;
 const badge=document.getElementById("promptStatusBadge");badge.textContent=promptStatusLabels[version.status];badge.className=promptTagClass(version.status);
 document.getElementById("submitPromptReview").disabled=version.status!=="draft";document.getElementById("approvePromptTests").disabled=version.status!=="in_review";document.getElementById("publishPromptVersion").disabled=version.status!=="publishable";
 document.getElementById("promptWorkflowMessage").textContent=`v${version.number} · ${promptStatusLabels[version.status]}${version.active?" · configurazione attiva":""}`;
 renderPromptList();
}
function renderPromptList(){
 const list=document.getElementById("promptVersionList");list.innerHTML=promptVersions.slice().sort((a,b)=>b.number-a.number).map(v=>`<div class="row"><div class="meta"><strong>v${v.number} · ${v.name}</strong><small>${promptStatusLabels[v.status]} · ${v.mode}${v.active?" · attiva":""}</small></div><button class="btn prompt-version-open" data-version="${v.id}">Apri</button></div>`).join("");
 document.querySelectorAll(".prompt-version-open").forEach(button=>button.onclick=()=>renderPromptVersion(button.dataset.version));
}
function savePromptDraft(){
 const data=readPromptEditor();if(data.prompt.length<50){notify("Il prompt deve contenere almeno 50 caratteri");return}
 const next=Math.max(...promptVersions.map(v=>v.number))+1;const id=Math.max(...promptVersions.map(v=>v.id))+1;promptVersions.push({id,number:next,status:"draft",active:false,...data});renderPromptOptions();renderPromptVersion(id);notify(`Bozza v${next} creata senza sovrascrivere lo storico`)
}
function transitionPrompt(target){
 const version=promptById(selectedPromptVersionId);if(!version)return;
 const allowed={draft:["in_review"],in_review:["draft","publishable"],publishable:["draft","published"],published:["archived"],archived:[]};if(!allowed[version.status].includes(target)){notify(`Transizione bloccata: ${version.status} → ${target}`);return}
 if(target==="published"){promptVersions.filter(v=>v.active&&v.id!==version.id).forEach(v=>{v.active=false;v.status="archived"});version.active=true}
 version.status=target;renderPromptOptions();renderPromptVersion(version.id);notify(`v${version.number}: ${promptStatusLabels[target]}`)
}
function comparePromptVersions(){
 const from=promptById(document.getElementById("promptCompareFrom").value),to=promptById(document.getElementById("promptCompareTo").value);const fields=[];if(from.name!==to.name)fields.push("name");if(from.prompt!==to.prompt)fields.push("system_prompt");if(from.mode!==to.mode)fields.push("didactic_mode");if(from.status!==to.status)fields.push("status");Object.keys(from.parameters).forEach(key=>{if(from.parameters[key]!==to.parameters[key])fields.push(`parameters.${key}`)});document.getElementById("promptDiffList").innerHTML=fields.length?fields.map(field=>`<div class="row"><div class="meta"><strong>${field}</strong><small>Valore differente tra v${from.number} e v${to.number}</small></div><span class="tag warn">Modificato</span></div>`).join(""):'<div class="empty">Nessuna differenza tra le versioni selezionate.</div>';notify(`Confronto prompt v${from.number} → v${to.number} completato`)
}
function createPromptRollback(){
 const source=promptById(document.getElementById("promptRollbackSource").value);const next=Math.max(...promptVersions.map(v=>v.number))+1,id=Math.max(...promptVersions.map(v=>v.id))+1;promptVersions.push({...source,id,number:next,status:"draft",active:false,name:`${source.name} · rollback`});document.getElementById("promptRollbackTitle").textContent=`Creata v${next} da v${source.number}`;document.getElementById("promptRollbackText").textContent="La sorgente e tutte le versioni successive sono rimaste disponibili.";document.getElementById("promptRollbackStatus").textContent="Bozza";renderPromptOptions();renderPromptVersion(id);notify("Rollback non distruttivo creato come nuova bozza")
}
document.getElementById("promptVersionSelect")?.addEventListener("change",event=>renderPromptVersion(event.target.value));
document.getElementById("savePromptDraft")?.addEventListener("click",savePromptDraft);
document.getElementById("submitPromptReview")?.addEventListener("click",()=>transitionPrompt("in_review"));
document.getElementById("approvePromptTests")?.addEventListener("click",()=>transitionPrompt("publishable"));
document.getElementById("publishPromptVersion")?.addEventListener("click",()=>transitionPrompt("published"));
document.getElementById("comparePromptVersions")?.addEventListener("click",comparePromptVersions);
document.getElementById("createPromptRollback")?.addEventListener("click",createPromptRollback);
renderPromptOptions();document.getElementById("promptCompareFrom").value="1";document.getElementById("promptCompareTo").value="3";document.getElementById("promptRollbackSource").value="1";renderPromptVersion(3);comparePromptVersions();

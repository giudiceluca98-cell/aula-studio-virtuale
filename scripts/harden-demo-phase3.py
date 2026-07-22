from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "scripts/apply-demo-phase3-complete.py"


def replace_or_verify(text: str, old: str, new: str, label: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise RuntimeError(f"{label}: anchor non trovato")


def main() -> None:
    text = TARGET.read_text(encoding="utf-8")

    old_safe = 'function aulaMaterialSafeHttps(value){try{const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password)return false;const host=url.hostname.toLowerCase();if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local"))return false;const p=host.split(".").map(Number);if(p.length===4&&p.every(n=>Number.isInteger(n))){const[a,b]=p;if(a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||a>=224)return false}return true}catch{return false}}'
    new_safe = 'function aulaMaterialSafeHttps(value){try{const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password)return false;const host=url.hostname.toLowerCase().replace(/^\\[|\\]$/g,"");if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host==="::1"||/^f[cd][0-9a-f:]*$/i.test(host)||/^fe[89ab][0-9a-f:]*$/i.test(host))return false;const p=host.split(".").map(Number);if(p.length===4&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)){const[a,b]=p;if(a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||a>=224)return false}return true}catch{return false}}'
    text = replace_or_verify(text, old_safe, new_safe, "Validazione URL")

    old_classification = 'if(material.access&&material.explicitClassification)d={access:material.access,monitoring:material.monitoring,viewer:material.viewer||null,importStatus:material.importStatus||"not-required",provider:material.provider||"none",reason:material.reason||"Classificazione esplicita della demo."};'
    new_classification = 'if(material.access&&(material.explicitClassification||["lesson","text","pdf","document","presentation"].includes(material.kind)||material.access==="external-unmonitored")){const inferredViewer=material.viewer||(material.kind==="lesson"?"lesson":material.kind==="text"?"text":material.kind==="pdf"?"pdf":material.kind==="document"?"document":material.kind==="presentation"?"presentation":material.access==="external-unmonitored"?"web-article":null);d={access:material.access,monitoring:material.monitoring,viewer:inferredViewer,importStatus:material.importStatus||((material.access==="internal")?"ready":"not-required"),provider:material.provider||(material.access==="internal"?"internal":"web"),reason:material.reason||"Classificazione esplicita della demo."};}'
    text = replace_or_verify(text, old_classification, new_classification, "Classificazione esplicita")

    old_resume = 'const result=aulaMaterialsOpenBeforeTracking(id);window.setTimeout(()=>{if(saved){const material=aulaMaterialsPanelData.find(item=>item.id===id),viewer=material?aulaMaterialOfficialDescriptor(material).viewer:null;if((viewer==="document"||viewer==="text")&&saved.scrollTop)pageScroll?.scrollTo({top:saved.scrollTop,behavior:"auto"})}aulaMaterialTrackingBanner(id,saved);'
    new_resume = 'const result=aulaMaterialsOpenBeforeTracking(id);window.setTimeout(()=>{if(saved){const material=aulaMaterialsPanelData.find(item=>item.id===id),viewer=material?aulaMaterialOfficialDescriptor(material).viewer:null;if((viewer==="document"||viewer==="text")&&saved.scrollTop)pageScroll?.scrollTo({top:saved.scrollTop,behavior:"auto"});if(viewer==="video"){aulaVideoState.current=Number(saved.videoTime||0);aulaVideoState.ranges=Array.isArray(saved.videoRanges)?saved.videoRanges:[];aulaVideoRender()}if(viewer==="pdf"&&saved.page){aulaPdfState.page=saved.page;aulaPdfRender()}if(viewer==="presentation"&&saved.slide){aulaPresentationState.slide=saved.slide;aulaPresentationRender()}}aulaMaterialTrackingBanner(id,saved);'
    text = replace_or_verify(text, old_resume, new_resume, "Ripresa viewer")

    external_marker = 'id:"external-opened-reference"'
    if external_marker not in text:
        anchor = '     function aulaMaterialOfficialDescriptor(material){'
        demo = '     [{id:"external-opened-reference",title:"Riferimento esterno consultabile",description:"Risorsa HTTPS aperta esternamente: la demo registra soltanto l’apertura.",course:"Risorse libere",kind:"link",kindLabel:"Pagina web",url:"https://example.org/riferimento-esterno",access:"external-unmonitored",accessLabel:"Esterno",monitoring:"opened-only",monitoringLabel:"Solo apertura",progress:0,progressLabel:"Non iniziato",icon:"↗",viewerReady:false,explicitClassification:true,viewer:"web-article",importStatus:"not-required",provider:"web",reason:"La risorsa resta esterna e non consente il monitoraggio del contenuto."}].forEach(item=>{if(!aulaMaterialsPanelData.some(current=>current.id===item.id))aulaMaterialsPanelData.push(item)});\n' + anchor
        if anchor not in text:
            raise RuntimeError("Esempio external-unmonitored: anchor non trovato")
        text = text.replace(anchor, demo, 1)

    pattern = re.compile(
        r'    approvals = APPROVALS_PATH\.read_text\(encoding="utf-8"\).*?'
        r'    APPROVALS_PATH\.write_text\(approvals, encoding="utf-8"\)',
        re.S,
    )
    match = pattern.search(text)
    if not match:
        raise RuntimeError("Blocco PHASE_APPROVALS non trovato")

    new_block = '''    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    previous_version = "1.3.0-alpha.1" if step == 2 else STEPS[step - 1]["version"]
    previous_title = "Materiali: pannello e selezione" if step == 2 else STEPS[step - 1]["title"]
    previous_pattern = rf"\\| Fase 3 \\| {re.escape(previous_title)} \\| [^\\n|]+ \\| [^\\n|]+ \\| [^\\n|]+ \\|"
    approvals = re.sub(
        previous_pattern,
        f"| Fase 3 | {previous_title} | APPROVATO | {DATE} | Prosecuzione autorizzata dall'utente per l'intera Fase 3; checkpoint {previous_version} archiviato. |",
        approvals,
        count=1,
    )
    row = f"| Fase 3 | {info['title']} | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {version} prodotta; prosecuzione automatica autorizzata. |"
    row_pattern = rf"\\| Fase 3 \\| {re.escape(info['title'])} \\| [^\\n|]+ \\| [^\\n|]+ \\| [^\\n|]+ \\|"
    if re.search(row_pattern, approvals):
        approvals = re.sub(row_pattern, row, approvals, count=1)
    else:
        approvals = approvals.replace("| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", row + "\\n| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", 1)
    if step == 9:
        complete_row = f"| Fase 3 | Materiali e workspace: fase completa | IN_ATTESA_APPROVAZIONE | {DATE} | Tutti i checkpoint fino a {version} sono presenti; resta la verifica visuale dell'utente. |"
        complete_pattern = r"\\| Fase 3 \\| Materiali e workspace: fase completa \\| [^\\n|]+ \\| [^\\n|]+ \\| [^\\n|]+ \\|"
        if re.search(complete_pattern, approvals):
            approvals = re.sub(complete_pattern, complete_row, approvals, count=1)
        else:
            approvals = approvals.replace("| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", complete_row + "\\n| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", 1)
    APPROVALS_PATH.write_text(approvals, encoding="utf-8")'''

    text = text[: match.start()] + new_block + text[match.end() :]
    TARGET.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()

# Trigger GitHub Actions: 2026-07-22

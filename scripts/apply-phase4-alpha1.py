from __future__ import annotations

from pathlib import Path
import base64
import bz2
import hashlib
import re
import subprocess
import tempfile

VERSION = "1.4.0-alpha.1"
BASE_SHA256 = "957ae6c18adf653dbcfa7bafeab33e57fb49a87a210717584a555b9abb534318"
SIZE = 763281
LINES = 20872
SHA256 = "85ad819914cf85740b0013f0d3147adaa2ff7b233f99935ba67f4fb77fefe95c"
GIT_BLOB = "1a4b68f4aa04bd5602afddb7a9feba867da33574"
ROOT = Path(__file__).resolve().parents[1]
PATCH_PATH = ROOT / "scripts" / "phase4-alpha1.patch.bz2.b64"
REFERENCE = ROOT / "reference"
CANONICAL = REFERENCE / "demo-aula-studio-virtuale-canonica.html"
CHECKPOINT_DIR = REFERENCE / "checkpoints" / "phase-4"
CHECKPOINT = CHECKPOINT_DIR / f"demo-aula-studio-virtuale-{VERSION}.html"

base = CANONICAL.read_bytes()
assert hashlib.sha256(base).hexdigest() == BASE_SHA256, "Il canonico non coincide con alpha.9"
patch_data = bz2.decompress(base64.b64decode(PATCH_PATH.read_text(encoding="ascii")))
with tempfile.NamedTemporaryFile(suffix=".patch") as patch_file:
    patch_file.write(patch_data)
    patch_file.flush()
    subprocess.run(["patch", "--silent", "--batch", str(CANONICAL), patch_file.name], check=True)

data = CANONICAL.read_bytes()
assert len(data) == SIZE, (len(data), SIZE)
assert data.count(b"\n") + 1 == LINES
assert hashlib.sha256(data).hexdigest() == SHA256
text = data.decode("utf-8")
required = [
    '<meta name="aula-demo-version" content="1.4.0-alpha.1" />',
    'data-aula-version="1.4.0-alpha.1"',
    'AULA STUDIO VIRTUALE — CHECKPOINT AUTONOMO 1.4.0-alpha.1',
    'aula-demo-checklist-v2',
    'window.buildChecklistDrawerHtml',
    'window.aulaMaterialTextOpen',
    'window.aulaMaterialDiagnosticsOpen',
    'MATERIALI E WORKSPACE — ERRORI E ALTERNATIVE 1.3.0-alpha.9',
]
for marker in required:
    assert marker in text, f"Marker assente: {marker}"
assert "raw.githubusercontent.com" not in text
assert "cdn.jsdelivr.net" not in text
assert text.rstrip().endswith("</html>")
assert text.count("<script") == text.count("</script>")
assert text.count("<style") == text.count("</style>")
ids = [v for v in re.findall(r'\bid=["\']([^"\']+)["\']', text) if "${" not in v]
duplicates = sorted({v for v in ids if ids.count(v) > 1})
assert not duplicates, f"ID duplicati: {duplicates}"

CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT.write_bytes(data)
assert CANONICAL.read_bytes() == CHECKPOINT.read_bytes()

tmp = ROOT / ".phase4-js-check"
tmp.mkdir(exist_ok=True)
scripts = re.findall(r"<script([^>]*)>(.*?)</script>", text, flags=re.I | re.S)
checked = 0
for attrs, body in scripts:
    type_match = re.search(r'type=["\']([^"\']+)', attrs, flags=re.I)
    script_type = type_match.group(1).lower() if type_match else ""
    if script_type and script_type not in {"text/javascript", "application/javascript"}:
        continue
    if "src=" in attrs.lower() or not body.strip():
        continue
    target = tmp / f"script-{checked}.js"
    target.write_text(body, encoding="utf-8")
    subprocess.run(["node", "--check", str(target)], check=True)
    checked += 1
assert checked >= 2
for target in tmp.iterdir():
    target.unlink()
tmp.rmdir()

(REFERENCE / "README.md").write_text(f'''# Demo canonica — Aula Studio Virtuale

Questa cartella contiene la fonte visiva e funzionale ufficiale usata per trasferire nell'app Next.js le funzioni sviluppate nella demo autonoma.

## Stato

**Demo {VERSION} approvata: consolidamento dei Materiali e primo checkpoint della Checklist.**

File canonico:

`reference/demo-aula-studio-virtuale-canonica.html`

Identificatori della versione corrente:

- versione: `{VERSION}`
- dimensione: `{SIZE}` byte
- righe: `{LINES}`
- SHA-256: `{SHA256}`
- Git blob SHA: `{GIT_BLOB}`

Il canonico e il checkpoint della Fase 4 coincidono byte per byte. Il file è autonomo: può essere aperto con doppio clic e non richiede Internet o checkpoint esterni.

## Fonte di verità

Codex e gli altri agenti devono leggere la demo direttamente dal branch `demo-canonica`. Non devono usare copie locali non versionate, vecchi add-on, screenshot o ricostruzioni manuali come fonte principale.

La demo definisce:

- portale, presentazione, dashboard e aula;
- layout e responsive;
- progressi e missioni;
- sidebar e pannelli comprimibili;
- Eve Voice, selezione pagine e lettura automatica;
- assistenza vocale negli esercizi;
- chat completa e chat minimizzate;
- cursore personalizzato;
- timer, modali, drawer e persistenza locale della demo;
- viewer testuale e diagnostica dei Materiali;
- Checklist con ricerca, filtri, assegnatari, priorità, scadenze, stati e persistenza locale.

## Flusso di lavoro

1. Le modifiche visuali e funzionali alla demo vengono applicate nel branch `demo-canonica`.
2. Ogni aggiornamento modifica il file canonico, il manifesto e il changelog del checkpoint.
3. Codex esegue `git fetch origin --prune` e legge la versione più recente del branch.
4. Codex integra una funzione per volta nell'app ufficiale su un branch dedicato.
5. L'integrazione deve conservare autenticazione, routing, Supabase, RLS e Realtime.
6. Prima della consegna deve essere eseguito un confronto visivo e funzionale con la demo canonica.

La demo non deve essere copiata sopra l'app Next.js e non deve sostituire persistenza o servizi reali con mock o `localStorage`.
''', encoding="utf-8")

approvals = REFERENCE / "PHASE_APPROVALS.md"
approval_text = approvals.read_text(encoding="utf-8")
approval_text = approval_text.replace(
    "| Fase 3 | Materiali: errori e alternative | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.9 prodotta e pronta per verifica. |",
    "| Fase 3 | Materiali: errori e alternative | APPROVATO | 2026-07-23 | Il checkpoint 1.3.0-alpha.9 è stato conservato come base autonoma valida. |\n| Fase 3 | Consolidamento Materiali | APPROVATO | 2026-07-23 | Le integrazioni previste per alpha.10 sono state assorbite nel file autonomo 1.4.0-alpha.1. |\n| Fase 4 | Checklist: elenco, filtri e gestione attività | APPROVATO | 2026-07-23 | L’utente ha verificato il file autonomo, ha confermato che funziona e ne ha autorizzato il caricamento. |"
)
approval_text = approval_text.replace(
    "| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |",
    "| Fasi 5–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |"
)
approvals.write_text(approval_text, encoding="utf-8")

(CHECKPOINT_DIR / "README.md").write_text(f'''# Checkpoint scaricabili — Fase 4

La fonte autorevole resta `reference/demo-aula-studio-virtuale-canonica.html`.

- `{VERSION}` — `demo-aula-studio-virtuale-{VERSION}.html`
  - dimensione: `{SIZE}` byte
  - righe: `{LINES}`
  - SHA-256: `{SHA256}`
  - Git blob SHA: `{GIT_BLOB}`
  - stato: `APPROVATO`
  - apertura: file HTML autonomo, anche tramite doppio clic.
''', encoding="utf-8")

(CHECKPOINT_DIR / f"VERIFICATION-{VERSION}.md").write_text(f'''# Verifica — {VERSION}

## Identificatori

- Dimensione: `{SIZE}` byte
- Righe: `{LINES}`
- SHA-256: `{SHA256}`
- Git blob SHA atteso: `{GIT_BLOB}`

## Controlli superati

- File prodotto direttamente dal checkpoint completo `1.3.0-alpha.9` fornito dall'utente.
- Canonico e checkpoint identici byte per byte.
- Chiusura `</html>` presente.
- Tag `script` e `style` bilanciati.
- Nessun ID HTML statico duplicato.
- Due blocchi JavaScript inline verificati con `node --check`.
- Marker della Checklist, del viewer TXT/Markdown e della diagnostica Materiali presenti.
- Nessun riferimento a GitHub Raw o jsDelivr.
- Apertura locale tramite doppio clic verificata dall'utente.
- Creazione dello ZIP usata esclusivamente per facilitare il download; lo ZIP non viene versionato nel repository.

## Limiti reali

- La Checklist della demo usa `localStorage`; nell'app ufficiale deve essere collegata a Supabase, RLS e Realtime.
- Non è stato eseguito un confronto visuale automatizzato multipiattaforma.
- Le funzioni native del browser possono avere differenze minori tra Chrome, Edge, Firefox e Safari.

## Stato

`APPROVATO`
''', encoding="utf-8")

(CHECKPOINT_DIR / f"ARCHITECTURE-{VERSION}.md").write_text(f'''# Architettura — {VERSION}

Il checkpoint è un singolo documento HTML autonomo. CSS, interfaccia e JavaScript sono incorporati nello stesso file.

## Estensioni rispetto a 1.3.0-alpha.9

- consolidamento del viewer testuale TXT/Markdown;
- pannello diagnostico per i Materiali;
- Checklist con sei attività iniziali;
- ricerca e filtri per stato e assegnatario;
- creazione con titolo, assegnatario, priorità e scadenza;
- completamento, riapertura, cambio stato e rimozione;
- ordinamento deterministico e persistenza locale;
- override circoscritto del drawer `checklist`.

## Vincolo per l'app ufficiale

Il comportamento locale dimostrativo non sostituisce autenticazione, database, autorizzazioni RLS o aggiornamenti Realtime.
''', encoding="utf-8")

(CHECKPOINT_DIR / f"STATUS-{VERSION}.md").write_text(f'''# Stato — {VERSION}

- Fase: 4
- Passaggio: Checklist — elenco, filtri e gestione attività
- Stato: `APPROVATO`
- Base: `1.3.0-alpha.9`
- File autonomo: sì
- Dipendenze di avvio: nessuna
- Canonico aggiornato: sì
- Checkpoint preservato: sì
- Prossimo passaggio: da definire e avviare soltanto dopo una nuova autorizzazione esplicita dell'utente.
''', encoding="utf-8")

(CHECKPOINT_DIR / f"CHANGELOG-{VERSION}.md").write_text(f'''# Changelog — {VERSION}

## Aggiunto

- viewer TXT/Markdown interno;
- diagnostica dei Materiali;
- Checklist dinamica con ricerca, filtri e metriche;
- assegnatari, priorità, scadenze e stati;
- creazione, completamento, riapertura e rimozione attività;
- persistenza locale della Checklist.

## Corretto

- eliminata l'architettura a caricatore dei precedenti tentativi;
- eliminata ogni dipendenza da checkpoint esterni durante l'apertura;
- ripristinata l'apertura diretta tramite doppio clic.

## Conservato

- tutte le funzionalità e i checkpoint precedenti fino a `1.3.0-alpha.9`.
''', encoding="utf-8")

print(f"Prodotto {VERSION}: {SIZE} byte, {LINES} righe, {SHA256}, script verificati: {checked}")

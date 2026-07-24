from __future__ import annotations

_ROUTING_RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("ui", ("src/features/eve/ui", "eve ui", "pannello laterale", "fumetto flottante", "dashboard ui")),
    ("prompts", ("prompt", "personalità", "istruzioni di sistema")),
    ("retrieval", ("retrieval", "rag", "indicizzazione", "citazioni", "fonti")),
    ("memory", ("memory manager", "memoria", "learning profile", "profilo didattico")),
    ("tools", ("tool registry", "executor", "strumenti", "azioni nell'app")),
    ("voice", ("voice pipeline", "speech", "voce", "pronuncia", "trascrizione")),
    ("multimodal", ("multimodal", "immagini", "video", "audio", "lavagna", "ocr")),
    ("safety", ("safety", "privacy", "policy engine", "sicurezza", "moderation")),
    ("evaluation", ("evaluation", "test", "telemetria", "qualità", "audit pre-rilascio")),
    ("providers", ("ai provider", "provider abstraction", "model router", "modello ai")),
    ("data", ("supabase", "migrazioni", "repository dati", "database")),
    ("assessment", ("assessment", "valutazione", "quiz", "rubrica")),
    ("tutoring", ("tutoring", "tutor didattico", "metodo socratico", "spiegazione adattiva")),
    ("planning", ("study planner", "pianificazione", "piano di studio")),
    ("catalog", ("catalogo", "raccomandazione", "percorsi di studio")),
    ("collaboration", ("collaboration", "aula condivisa", "gruppo", "@eve")),
    ("authoring", ("authoring", "contenuti didattici", "versionamento")),
    ("accessibility", ("accessibility", "accessibilità")),
    ("integrations", ("connector", "integrazioni")),
    ("roadmap", ("project roadmap", "roadmap", "feature flag", "prioritization")),
    ("agent", ("agent", "comportamento conversazionale", "api chat")),
    ("context", ("context", "contesto", "pagina corrente", "lezione corrente")),
)


def route_requirement(owner_hint: str, title: str = "") -> str:
    """Instrada una scheda usando prima l'ownership dichiarata nel plaintext."""

    owner = owner_hint.casefold()
    for module_key, keywords in _ROUTING_RULES:
        if any(keyword in owner for keyword in keywords):
            return module_key

    title_folded = title.casefold()
    for module_key, keywords in _ROUTING_RULES:
        if any(keyword in title_folded for keyword in keywords):
            return module_key
    return "unassigned"

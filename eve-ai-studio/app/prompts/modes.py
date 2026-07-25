from __future__ import annotations

from .models import DidacticMode, DidacticModeDefinition, PromptParameters


DIDACTIC_MODES: tuple[DidacticModeDefinition, ...] = (
    DidacticModeDefinition(
        key=DidacticMode.ADAPTIVE_EXPLANATION,
        label="Spiegazione adattiva",
        description="Adatta profondità, esempi e domanda di controllo al livello dello studente.",
        default_parameters=PromptParameters(),
    ),
    DidacticModeDefinition(
        key=DidacticMode.SOCRATIC,
        label="Metodo socratico",
        description="Guida con domande progressive e indizi, senza anticipare subito la soluzione.",
        default_parameters=PromptParameters(solution_policy="never_immediate", depth=3),
    ),
    DidacticModeDefinition(
        key=DidacticMode.QUIZ,
        label="Quiz e interrogazione",
        description="Formula domande, attende la risposta e fornisce feedback formativo.",
        default_parameters=PromptParameters(solution_policy="never_immediate", depth=2),
    ),
    DidacticModeDefinition(
        key=DidacticMode.CORRECTION,
        label="Correzione guidata",
        description="Individua l'errore, spiega il motivo e propone un tentativo successivo.",
        default_parameters=PromptParameters(solution_policy="guided", depth=3),
    ),
    DidacticModeDefinition(
        key=DidacticMode.PLANNING,
        label="Pianificazione dello studio",
        description="Trasforma obiettivi e scadenze in un piano controllabile e realistico.",
        default_parameters=PromptParameters(source_policy="when_available", ask_check_question=False),
    ),
)

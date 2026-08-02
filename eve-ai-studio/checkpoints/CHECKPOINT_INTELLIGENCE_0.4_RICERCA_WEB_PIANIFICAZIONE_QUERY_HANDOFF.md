# Handoff INTELLIGENCE-0.4

- Stato: `REVIEW_REQUIRED`
- Branch: `codex/eve-ai-studio-intelligence-0-4`
- Commit congelato: `dace16f`
- Draft PR: https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/95
- Release desktop di prova: `1.2.0-alpha.10`

I quattro prerequisiti sono stati completati; CORE-1.3 è stato approvato e unito
con la PR #94. Provider e rete restano disattivati per impostazione predefinita,
non esistono chiavi client-side e nessun risultato viene acquisito o approvato
automaticamente. I candidati opzionali restano in quarantena.

Verifiche completate: 12 test Python specifici, 236 test Python cumulativi, 194
test Vitest, typecheck, build, sintassi e lint mirato JavaScript, test desktop e
preview canonica via browser reale. Nessuna demo, standalone, copia HTML o nuova
cartella preview è stata creata. Il merge resta vietato fino al collaudo desktop
alpha.10 e alla nuova approvazione esplicita dell'utente.

La release di prova `eve-ai-studio-v1.2.0-alpha.10` è stata pubblicata dal
workflow `30724903788` con installer NSIS, firma updater e `latest.json`.
Il manifest dichiara correttamente `1.2.0-alpha.10`. SHA-256 installer:
`e64cb8cbcf6215a29ab95c66abb3e63ccad5e83749d6c59d462177060ae1177e`.

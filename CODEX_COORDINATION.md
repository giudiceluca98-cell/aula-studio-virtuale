# Coordinamento Codex

Questo file registra incarichi temporanei, proprietà dei file e dipendenze tra agenti. Gli agenti sono generalisti e possono passare a un'altra materia o funzione dopo la chiusura dell'attività corrente.

## Attività

| Attività | Assegnazione prevista | Branch | Stato | File riservati | File condivisi richiesti | Pull request | Ultimo aggiornamento |
|---|---|---|---|---|---|---|---|
| Completamento Programmazione da zero · Lezione 0.3 | Codex — contenuto ufficiale 0.3 convertito in codice | `codex/programming-zero-lesson-0-3` | Completato | Artefatto 0.3, aggregatore, progressi e test | Nessuno | [PR #4](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/4) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.4 | Codex — contenuto ufficiale 0.4 convertito in codice | `codex/programming-zero-lesson-0-4` | Completato | Artefatto 0.4, aggregatore, progressi e test | Nessuno | [PR #9](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/9) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.5 | Codex — artefatto ufficiale 0.5 da PR #11, integrazione sicura su `main` | `agent/python-project-lesson-0-4` | Completato | Artefatto 0.5, aggregatore, progressi e test | Nessuno | [PR #14](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/14) | 2026-07-21 |
| Suoneria chiamata in arrivo | Codex | `codex/incoming-call-ringtone` | Completato | `src/hooks/use-incoming-call-ringtone.ts`, `tests/incoming-call-ringtone.test.tsx` | `src/components/room/study-room.tsx` | [PR #5](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/5) | 2026-07-21 |
| Navigazione moduli e lezioni separate | Codex | `codex/lesson-module-navigation` | Completato | aggregatore, area di lavoro e test dedicati | `src/components/room/programming-lesson-workspace.tsx` (area protetta) | [PR #6](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/6) | 2026-07-21 |
| Quiz interattivi dentro i capitoli | Codex | `codex/inline-chapter-quiz` | Completato | area di lavoro e test dedicati | `src/components/room/programming-lesson-workspace.tsx` (area protetta) | [PR #7](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/7) | 2026-07-21 |
| Python Project guidati | Codex | `codex/guided-python-projects` | Completato | runner, aggregatore, progressi, area di lavoro, API e test | `src/components/room/programming-lesson-workspace.tsx` (area protetta) | [PR #8](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/8) | 2026-07-21 |
| Python Project Lezioni 0.4 e 0.5 | Codex | `agent/python-project-lesson-0-4` | Completato | aggregatore, progressi e test Python Project | `src/components/room/programming-lesson-workspace.tsx` (modifica minima al solo Python Project) | [PR #14](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/14) | 2026-07-21 |
| Matematica da zero | Qualunque Codex, non ancora assegnato | `codex/mathematics-zero` | Disponibile | Vedere scheda attività | Da dichiarare alla presa in carico | — | 2026-07-21 |

Stati ammessi: `Disponibile`, `In corso`, `In revisione`, `Bloccato`, `Completato`.

L'assegnazione è legata all'attività, non al computer. Dopo il merge, lo stesso Codex può prendere in carico un altro corso o una funzione diversa dell'app.

## File condivisi

I seguenti percorsi hanno un impatto trasversale e devono essere prenotati esplicitamente prima dell'uso:

```text
src/lib/catalog/roadmap.ts
src/lib/catalog/search.ts
src/lib/catalog/subjects/index.ts
src/lib/catalog/subjects/registry.ts
src/components/catalog/catalog-explorer.tsx
src/components/room/study-room.tsx
src/app/api/catalog/search/route.ts
src/app/api/catalog/path/route.ts
src/app/api/catalog/action/route.ts
supabase/migrations/*
package.json
pnpm-lock.yaml
```

Regole:

1. Due agenti non modificano contemporaneamente lo stesso file condiviso.
2. Il responsabile di un'attività può effettuare anche l'integrazione end-to-end nei file condivisi necessari, dopo averli dichiarati nella propria scheda e in questa tabella.
3. Una Draft Pull Request attiva che modifica un file condiviso lo riserva fino al merge, alla chiusura o a un accordo registrato qui.
4. Se un file è già prenotato, l'altro agente continua sui file non in conflitto oppure apre una successiva attività di integrazione.
5. Le funzioni già operative dell'area di lavoro non devono essere riprogettate durante un'attività editoriale, salvo richiesta esplicita.

## Procedura di presa in carico

1. Scegliere un'attività con stato `Disponibile` in `.codex/tasks/active/`.
2. Aggiornare la scheda con agente, branch, stato, file riservati e file condivisi indispensabili.
3. Aggiornare questa tabella nello stesso branch.
4. Pubblicare il branch e aprire una Draft Pull Request all'inizio del lavoro.
5. Sviluppare e integrare l'attività soltanto nel perimetro dichiarato.
6. Al completamento spostare la scheda in `.codex/tasks/completed/` e aggiornare questa tabella.
7. Dopo il merge, l'agente torna libero e può prendere in carico qualsiasi altra attività disponibile.

## Fonte di verità

Gli agenti non condividono automaticamente conversazioni o modifiche non committate. La coordinazione avviene esclusivamente tramite questo file, i file dei compiti, branch pubblicati, commit e pull request.


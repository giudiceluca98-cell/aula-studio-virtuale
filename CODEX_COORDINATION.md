# Coordinamento Codex

Questo file registra assegnazioni, proprietà dei file e dipendenze tra agenti. Deve essere aggiornato nello stesso branch del lavoro a cui si riferisce.

## Attività

| Attività | Agente | Branch | Stato | File riservati | File condivisi richiesti | Pull request | Ultimo aggiornamento |
|---|---|---|---|---|---|---|---|
| Programmazione da zero | Non assegnato | — | Disponibile | — | — | — | — |
| Matematica da zero | Non assegnato | — | Disponibile | — | — | — | — |

Stati ammessi: `Disponibile`, `In corso`, `In revisione`, `Bloccato`, `Completato`.

## File condivisi

I seguenti percorsi hanno un impatto trasversale e devono essere modificati dall'agente integratore oppure prenotati esplicitamente prima dell'uso:

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
2. Una Draft Pull Request attiva che modifica un file condiviso lo riserva fino al merge, alla chiusura o a un accordo registrato qui.
3. Le integrazioni nel registro delle materie, nella ricerca, nell'interfaccia comune e nelle migrazioni vengono raccolte in una pull request separata dell'agente integratore.
4. Ogni agente lavora preferibilmente dentro la cartella della propria materia e nei relativi test.

## Procedura di presa in carico

1. Creare o aggiornare il file in `.codex/tasks/active/`.
2. Indicare agente, branch, stato e file riservati nella tabella.
3. Pubblicare il branch e aprire una Draft Pull Request all'inizio del lavoro.
4. Annotare ogni nuova dipendenza da file condivisi prima di modificarli.
5. Al completamento spostare il file del compito in `.codex/tasks/completed/` e aggiornare questa tabella.

## Fonte di verità

Gli agenti non condividono automaticamente conversazioni o modifiche non committate. La coordinazione avviene esclusivamente tramite questo file, i file dei compiti, branch pubblicati, commit e pull request.

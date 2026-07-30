# CI locale del pacchetto CORE-1.2

Stato: `FUNCTIONAL_TESTING`, non `CLOSED`.

Superati nel pacchetto: sintassi TypeScript e JavaScript, scope, assenza di fetch nella preview, applicazione idempotente, rollback e smoke HTTP canonico.

Superati nel checkout reale:
- test mirati CORE-1.2: 10/10;
- suite Vitest completa: 181/181;
- suite FastAPI cumulativa: 224/224;
- typecheck;
- lint dei soli file CORE-1.2;
- build Next.js;
- prova browser della preview canonica, inclusi quattro adapter simulati e sei controlli architetturali.

Il lint globale intercetta artefatti desktop preesistenti generati sotto
`eve-desktop/frontend-dist/` e `eve-desktop/src-tauri/target/`; non sono errori
dei file CORE-1.2.

Restano a Codex: commit, Draft PR, build firmata alpha.8 e pubblicazione nel
repository release. Restano all'utente: installazione e collaudo desktop.

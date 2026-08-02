# Handoff INTELLIGENCE-0.5

Stato: `REVIEW_REQUIRED`. Branch `codex/eve-ai-studio-intelligence-0-5`, base
`origin/eve-ai-studio @ 377b1d6`, Draft PR #98.

L'integrazione aggiunge importazione sicura di PDF, DOCX ed EPUB, segmenti con
locator, deduplicazione SHA-256/shingle, quarantena persistente e crawler
same-domain limitato. I flag ingestione e crawl restano OFF per impostazione
predefinita. Macro, archivi cifrati, relazioni DOCX esterne, PDF protetti,
script HTML e redirect fuori dominio sono rifiutati o neutralizzati.

La UI canonica espone soltanto una simulazione dichiarata e non effettua fetch.
Nessun documento viene promosso automaticamente e
`instructions_executable=false` è persistito per documenti e pagine.

Verifiche: 12 test specifici, 248 Python cumulativi, 224 web, typecheck, build,
desktop alpha.13 e browser reale verdi. Prossimo passaggio consentito: build
firmata alpha.13 di collaudo dopo autorizzazione esplicita. Vietati merge,
modifiche funzionali congelate, provider reali e produzione.

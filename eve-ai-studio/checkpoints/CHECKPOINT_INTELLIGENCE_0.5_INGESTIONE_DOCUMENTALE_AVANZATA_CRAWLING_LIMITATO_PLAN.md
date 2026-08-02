# INTELLIGENCE-0.5 — Ingestione documentale avanzata e crawling limitato

Stato: `FUNCTIONAL_TESTING`.

## Obiettivo
Ampliare i formati importabili e consentire esplorazioni limitate mantenendo quarantena, provenienza e controlli di rete.

## Incluso
PDF nativi, DOCX, EPUB, locator, rifiuto password/macro/relazioni esterne, limiti archivio, deduplicazione binaria e testuale, crawling same-domain con profondità/pagine/byte, audit, isolamento aula e API.

## Escluso
OCR, immagini, audio/video, macro, JavaScript, crawling illimitato, login/cookie, embedding, approvazione o promozione automatica.

## Flag
`EVE_RESEARCH_ADVANCED_INGESTION_ENABLED=false` e `EVE_RESEARCH_CRAWL_ENABLED=false`.

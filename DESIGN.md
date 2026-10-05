# Design system

Il design system di Didaflow (token, primitive, font, asset del marchio, documentazione)
vive in **[Didaflow/didaflow-design](https://github.com/Didaflow/didaflow-design)**, con la
documentazione completa in `docs/DESIGN.md`.

Questo sito ne usa una copia in `shared/design/`, presa dal tag indicato in
`DESIGN_VERSION` con `scripts/design.sh`. **Non si modifica a mano**: si cambia in
`didaflow-design`, si pubblica un tag, si aggiorna `DESIGN_VERSION` e si rilancia lo script.

Gli stili specifici di didaflow.ai (sezioni della landing, pagine documento) stanno in
`landing/assets/css/site.css`; lo script di intestazione e piè di pagina in
`landing/assets/js/site-chrome.js`.

Caddy serve `shared/design/` sotto `/_assets/` (`css/`, `fonts/`, `static/`).

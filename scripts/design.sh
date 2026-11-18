#!/usr/bin/env bash
# Design system Didaflow: shared/design è una copia di Didaflow/didaflow-design al tag
# in DESIGN_VERSION (css/, fonts/, static/). Non si modifica a mano: si cambia in
# didaflow-design, si pubblica un tag, si aggiorna DESIGN_VERSION e si rilancia questo script.
# fonts/satoshi/ NON si copia: il repo è pubblico e i file di Satoshi (licenza ITF FFL) non ci
# entrano. Li mette il deploy di altair in shared/design/fonts/satoshi/ (landing#60); la cartella
# è in .gitignore. Rilanciare lo script la svuota: in locale vanno rimessi per vedere i titoli in Satoshi.
set -euo pipefail
cd "$(dirname "$0")/.."
versione=$(cat DESIGN_VERSION)
dest=shared/design
rm -rf "$dest" && mkdir -p "$dest"
GH_TASK=lettura gh api "repos/Didaflow/didaflow-design/tarball/$versione" | tar -xz --strip-components=1 -C "$dest" --exclude='*/fonts/satoshi' --exclude='*/fonts/satoshi/*' --wildcards '*/css/*' '*/fonts/*' '*/static/*'
rm -rf "$dest/css/tenants" "$dest"/fonts/{unibo-fonts.css,cinzel-*,merriweather-*}   # temi e font dei clienti: non servono al sito Didaflow
printf 'didaflow-design %s\n' "$versione" > "$dest/VERSION"
echo "didaflow-design $versione -> $dest"

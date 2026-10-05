#!/usr/bin/env bash
# Design system Didaflow: shared/design è una copia di Didaflow/didaflow-design al tag
# in DESIGN_VERSION (css/, fonts/, static/). Non si modifica a mano: si cambia in
# didaflow-design, si pubblica un tag, si aggiorna DESIGN_VERSION e si rilancia questo script.
set -euo pipefail
cd "$(dirname "$0")/.."
versione=$(cat DESIGN_VERSION)
dest=shared/design
rm -rf "$dest" && mkdir -p "$dest"
gh api "repos/Didaflow/didaflow-design/tarball/$versione" | tar -xz --strip-components=1 -C "$dest" --wildcards '*/css/*' '*/fonts/*' '*/static/*'
rm -rf "$dest/css/tenants" "$dest"/fonts/{unibo-fonts.css,cinzel-*,merriweather-*}   # temi e font dei clienti: non servono al sito Didaflow
printf 'didaflow-design %s\n' "$versione" > "$dest/VERSION"
echo "didaflow-design $versione -> $dest"

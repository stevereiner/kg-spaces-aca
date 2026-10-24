#!/usr/bin/env bash
# Set up a local Alfresco Content App checkout to run KG Spaces from source -- every README install step:
#   1. copy the extension into <ACA>/projects/kg-spaces-aca-ext (again on every run: re-run after editing it here)
#   2. install @flexible-graphrag/angular-ui: the published one (LIB_VERSION, default latest), or with --local the one
#      packed from your Flexible GraphRAG checkout (install-lib-into-aca.sh)
#   3-6. register the extension, ship its assets, merge plugins.kgSpaces into app.config.json, add the /api dev
#      proxy entry (patch-aca.mjs)
# Then, in ACA: pnpm start (or npm start). Windows: setup-aca-dev.bat.
#
#   scripts/setup-aca-dev.sh [--local]       ACA=<checkout> (default ../alfresco-content-app)
#
# The extension is built and tested against ACA 8.0.0 (the Docker image's ACA_TAG); a newer ACA may need changes.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
export ACA=${ACA:-$HERE/../alfresco-content-app}
[ -f "$ACA/app/src/app/extensions.module.ts" ] || { echo "not an ACA checkout: $ACA (set ACA)" >&2; exit 2; }

echo "==> 1. copying the extension into $ACA/projects/kg-spaces-aca-ext"
rm -rf "$ACA/projects/kg-spaces-aca-ext"
mkdir -p "$ACA/projects"
cp -r "$HERE/kg-spaces-aca-ext" "$ACA/projects/kg-spaces-aca-ext"

echo "==> 2. installing the shared UI library"
if [ "${1:-}" = "--local" ]; then
  "$HERE/scripts/install-lib-into-aca.sh"
elif [ ! -f "$ACA/package-lock.json" ] && [ -f "$ACA/pnpm-lock.yaml" ]; then
  ( cd "$ACA" && pnpm add "@flexible-graphrag/angular-ui@${LIB_VERSION:-latest}" )
else
  ( cd "$ACA" && npm install "@flexible-graphrag/angular-ui@${LIB_VERSION:-latest}" --no-audit --no-fund --legacy-peer-deps )
fi

echo "==> 3-6. wiring it into ACA"
node "$HERE/scripts/patch-aca.mjs" "$ACA"

echo "done - in $ACA: pnpm start (or npm start); the backend is http://localhost:8000 unless FG_BASE_URL says otherwise"

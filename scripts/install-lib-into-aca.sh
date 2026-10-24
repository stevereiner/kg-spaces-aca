#!/usr/bin/env bash
# Rebuild @flexible-graphrag/angular-ui from a local Flexible GraphRAG checkout and install it
# into an ACA host -- for trying unreleased library changes. A normal install just uses the
# published package (scripts/setup-aca-dev.sh does that by default). Windows: install-lib-into-aca.bat.
#
# FG_UI (the checkout's flexible-graphrag-ui/frontend-angular) and ACA default to a
# ../flexible-graphrag (or ../../newdev3/flexible-graphrag) checkout and a ../alfresco-content-app
# checkout next to this repository; set them for any other layout. ACA's own package manager is
# used: npm when the checkout has a package-lock.json (ACA 8.0.0), else pnpm when it has a
# pnpm-lock.yaml (ACA's develop branch; a pnpm-lock.yaml left behind by switching branches is ignored).
#
# The cache clear is not optional. The library version does not change between dev packs, so
# installing the tarball replaces the files on disk while the Angular CLI keeps serving the
# previously compiled copy from .angular/cache. The symptom is silent and very confusing:
# library changes appear to have no effect, while extension changes work fine (extension
# source is recompiled every build; a node_modules dependency is not).
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
if [ -z "${FG_UI:-}" ]; then
  for fg in "$HERE/../flexible-graphrag" "$HERE/../../newdev3/flexible-graphrag"; do
    if [ -d "$fg/flexible-graphrag-ui/frontend-angular" ]; then FG_UI="$fg/flexible-graphrag-ui/frontend-angular"; break; fi
  done
fi
ACA=${ACA:-$HERE/../alfresco-content-app}
[ -n "${FG_UI:-}" ] && [ -d "$FG_UI" ] || { echo "Flexible GraphRAG checkout not found: set FG_UI" >&2; exit 2; }
[ -d "$ACA" ] || { echo "ACA checkout not found at $ACA: set ACA" >&2; exit 2; }

echo "==> building + packing the library in $FG_UI"
( cd "$FG_UI" && npm run pack:lib )

TARBALL=$(ls -t "$FG_UI"/dist/flexible-graphrag-angular-ui-*.tgz | head -1)
echo "==> installing $(basename "$TARBALL") into $ACA"
if [ ! -f "$ACA/package-lock.json" ] && [ -f "$ACA/pnpm-lock.yaml" ]; then
  ( cd "$ACA" && pnpm add "$TARBALL" )
else
  ( cd "$ACA" && npm install "$TARBALL" --no-audit --no-fund --legacy-peer-deps )
fi

echo "==> clearing the Angular CLI cache (see note above)"
rm -rf "$ACA/.angular/cache"

echo "done - restart the ACA dev server"

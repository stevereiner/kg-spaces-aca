#!/usr/bin/env bash
# Rebuild @flexible-graphrag/angular-ui from a local Flexible GraphRAG checkout and install it
# into an ACA host -- for trying unreleased library changes. A normal install just uses the
# published package: npm install @flexible-graphrag/angular-ui --legacy-peer-deps
#
# FG_UI (the checkout's flexible-graphrag-ui/frontend-angular) and ACA default to sibling
# checkouts; set them for any other layout.
#
# The cache clear is not optional. The library version does not change between dev packs, so
# `npm install <tarball>` replaces the files on disk while the Angular CLI keeps serving the
# previously compiled copy from .angular/cache. The symptom is silent and very confusing:
# library changes appear to have no effect, while extension changes work fine (extension
# source is recompiled every build; a node_modules dependency is not).
set -euo pipefail

FG_UI=${FG_UI:-../../newdev3/flexible-graphrag/flexible-graphrag-ui/frontend-angular}
ACA=${ACA:-../alfresco-content-app}

echo "==> building + packing the library"
( cd "$FG_UI" && npm run pack:lib )

TARBALL=$(ls -t "$FG_UI"/dist/flexible-graphrag-angular-ui-*.tgz | head -1)
echo "==> installing $(basename "$TARBALL") into $ACA"
( cd "$ACA" && npm install "$TARBALL" --no-audit --no-fund --legacy-peer-deps )

echo "==> clearing the Angular CLI cache (see note above)"
rm -rf "$ACA/.angular/cache"

echo "done - restart the ACA dev server"

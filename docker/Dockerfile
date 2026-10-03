# syntax=docker/dockerfile:1
# ============================================================================================
# Alfresco Content App 8.0.0 + the KG Spaces extension, served by nginx.
#
#   docker build -t kg-spaces-aca -f docker/Dockerfile .
#   docker run -d --name kg-spaces-aca -p 4280:8080 kg-spaces-aca   # then open http://127.0.0.1:4280
#
# Build arguments
#   ACA_TAG      Alfresco Content App tag to build             (default 8.0.0)
#   LIB_SOURCE   where @flexible-graphrag/angular-ui comes from (default npm)
#                  npm    the published package, at LIB_VERSION
#                  git    build it from a Flexible GraphRAG clone (FG_REPO at FG_REF)
#                  local  use a tarball you built yourself, placed in docker/lib/
#   LIB_VERSION  npm version or tag of the library              (default latest)
#   FG_REPO      Flexible GraphRAG repository                   (default github.com/stevereiner)
#   FG_REF       branch or tag to build the library from        (default main)
#
# Runtime environment (all optional)
#   ALFRESCO_URL                 where nginx reaches Alfresco    (default http://host.docker.internal:8080)
#   FLEXIBLE_GRAPHRAG_URL        where nginx reaches the backend (default http://host.docker.internal:8000)
#   KG_SPACES_ALFRESCO_BASE_URL  where the BACKEND reaches Alfresco, written into app.config.json
#                                (default: as built, http://localhost:8080)
#
# ADF's ecmHost is left at its same-origin default, so the browser talks only to this container
# and nginx proxies /alfresco and /api onward -- no CORS configuration needed anywhere.
# ============================================================================================

ARG LIB_SOURCE=npm

# ---- the shared UI library, as published to npm ---------------------------------------------
# `npm pack` downloads the published tarball, so every source below ends the same way: one
# flexible-graphrag-angular-ui-<version>.tgz in /lib for the builder stage to install.
FROM node:24-alpine AS fglib-npm
ARG LIB_VERSION=latest
WORKDIR /lib
RUN npm pack --silent @flexible-graphrag/angular-ui@${LIB_VERSION} \
 && ls flexible-graphrag-angular-ui-*.tgz

# ---- ...or built from a Flexible GraphRAG clone ---------------------------------------------
FROM node:24-alpine AS fglib-git
ARG FG_REPO=https://github.com/stevereiner/flexible-graphrag.git
ARG FG_REF=main
# ADD of a git ref, not `RUN git clone`: Docker caches a RUN by its command text, so a cloned
# branch would be reused forever and never see new pushes. ADD resolves FG_REF to a commit on
# every build and only reuses the cache while that commit is unchanged.
ADD ${FG_REPO}#${FG_REF} /fg
WORKDIR /fg/flexible-graphrag-ui/frontend-angular
# Fail fast, with a reason, on a ref that predates the shared library -- otherwise this surfaces
# minutes later as a bare "npm run pack:lib ... exit code: 1".
RUN test -d projects/flexible-graphrag-angular-lib || {       echo "ERROR: ${FG_REPO} at ${FG_REF} has no projects/flexible-graphrag-angular-lib;" >&2;       echo "       the shared UI library is newer than that ref. Use a newer --build-arg FG_REF," >&2;       echo "       or --build-arg LIB_SOURCE=local with a tarball (npm run pack:lib) in docker/lib/." >&2;       exit 1; }
RUN npm ci --no-audit --no-fund \
 && npm run pack:lib \
 && mkdir -p /lib && cp dist/flexible-graphrag-angular-ui-*.tgz /lib/

# ---- ...or a tarball you already built (npm run pack:lib), copied into docker/lib/ ----------
FROM node:24-alpine AS fglib-local
COPY docker/lib/ /lib/

FROM fglib-${LIB_SOURCE} AS fglib

# ---- Alfresco Content App with the extension wired in ---------------------------------------
FROM node:24-alpine AS builder
ARG ACA_TAG=8.0.0
ENV NX_DAEMON=false \
    NODE_OPTIONS=--max-old-space-size=4096
RUN apk add --no-cache git
WORKDIR /build
RUN git clone --depth 1 --branch ${ACA_TAG} https://github.com/Alfresco/alfresco-content-app.git .

COPY kg-spaces-aca-ext/              projects/kg-spaces-aca-ext/
COPY config/app.config.snippet.json  /tmp/kg-spaces/app.config.snippet.json
COPY scripts/patch-aca.mjs           /tmp/kg-spaces/patch-aca.mjs
COPY --from=fglib /lib/              /tmp/fglib/

# install steps 3-5 from the README, done by the same script a person can run by hand
RUN node /tmp/kg-spaces/patch-aca.mjs /build /tmp/kg-spaces/app.config.snippet.json

RUN npm ci --no-audit --no-fund --legacy-peer-deps \
 && npm install --no-audit --no-fund --legacy-peer-deps /tmp/fglib/flexible-graphrag-angular-ui-*.tgz
RUN npx nx build content-ce --configuration=production

# ---- serve ----------------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1-alpine

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker/40-kg-spaces-config.sh /docker-entrypoint.d/40-kg-spaces-config.sh
# owned by the nginx user so the entrypoint hook can rewrite app.config.json at startup
COPY --chown=101:101 --from=builder /build/dist/content-ce /usr/share/nginx/html/

ENV ALFRESCO_URL=http://host.docker.internal:8080 \
    FLEXIBLE_GRAPHRAG_URL=http://host.docker.internal:8000

EXPOSE 8080

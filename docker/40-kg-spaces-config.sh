#!/bin/sh
# ---------------------------------------------------------------------------------------------
# Runtime configuration for app.config.json, applied at container start.
#
# Why "40-": the nginx image's entrypoint runs every script in /docker-entrypoint.d/ in name
# order before starting nginx. Its own are 10-listen-on-ipv6-by-default.sh,
# 15-local-resolvers.envsh, 20-envsubst-on-templates.sh (renders default.conf.template into the
# live config) and 30-tune-worker-processes.sh; 40 runs after all of them.
#
#   KG_SPACES_ALFRESCO_BASE_URL  where the Flexible GraphRAG BACKEND reaches Alfresco, server
#                                to server. Not where the browser reaches it (that is ecmHost,
#                                left same-origin and proxied by nginx). Unset = keep the value
#                                the image was built with.
#
# Not `sed -i`: that creates a temp file beside the target, and /usr/share/nginx/html is owned
# by root while this hook runs as the nginx user. Rewriting through /tmp only needs write
# access to the file itself, which the image grants.
# ---------------------------------------------------------------------------------------------
CONFIG_FILE=/usr/share/nginx/html/app.config.json

if [ -n "${KG_SPACES_ALFRESCO_BASE_URL}" ] && [ -f "${CONFIG_FILE}" ]; then
  TMP=$(mktemp)
  sed "s|\"alfrescoBaseUrl\": *\"[^\"]*\"|\"alfrescoBaseUrl\": \"${KG_SPACES_ALFRESCO_BASE_URL}\"|" \
    "${CONFIG_FILE}" > "${TMP}" && cat "${TMP}" > "${CONFIG_FILE}"
  rm -f "${TMP}"

  # Report what is actually in the file, not what was intended.
  if grep -q "\"alfrescoBaseUrl\": *\"${KG_SPACES_ALFRESCO_BASE_URL}\"" "${CONFIG_FILE}"; then
    echo "kg-spaces: plugins.kgSpaces.alfrescoBaseUrl = ${KG_SPACES_ALFRESCO_BASE_URL}"
  else
    echo "kg-spaces: ERROR could not set plugins.kgSpaces.alfrescoBaseUrl in ${CONFIG_FILE}" >&2
  fi
fi

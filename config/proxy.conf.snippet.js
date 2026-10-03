/*
 * Add this '/api' entry to the object ACA's app/proxy.conf.js already exports, next to its own
 * '/alfresco' entry -- do not replace that file. The browser then calls the Flexible GraphRAG
 * backend same-origin, which avoids CORS entirely; the backend has no CORS configuration of its
 * own.
 *
 * FG_BASE_URL (environment or ACA's .env, like ACA's own BASE_URL) points at a backend other
 * than http://localhost:8000. Add logLevel: 'debug' while troubleshooting to log each request.
 */
module.exports = {
  // Flexible GraphRAG backend, for the KG Spaces extension
  '/api': {
    target: process.env.FG_BASE_URL || 'http://localhost:8000',
    secure: false,
    changeOrigin: true
  }
};

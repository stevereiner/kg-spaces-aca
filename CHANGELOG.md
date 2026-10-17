# Changelog

All notable changes to KG Spaces for Alfresco Content App are documented in this file. Versions
follow the [Flexible GraphRAG](https://github.com/stevereiner/flexible-graphrag) release they go
with, and the `@flexible-graphrag/angular-ui` library version they need.

## [2026-10-17] — Other Sources: ingest from another Alfresco server

### Changed

- **Other Sources Alfresco form** (enable it by adding `"alfresco"` to `plugins.kgSpaces.enabledSources`):
  - It can ingest from **another Alfresco server**, using the credentials entered in the form.
  - Before, ACA's ticket replaced them for every URL, so another server's ingest was refused.
  - ACA's own server still uses the ACA sign-in. The form now says so and hides the credential
    fields (from `@flexible-graphrag/angular-ui`).
- **Search and AI chat in KG Spaces stay limited to what ACA's sign-in can read.** Documents from
  another server are left out. They no longer make the whole search fail (Flexible GraphRAG
  backend fix).
- Source forms no longer pre-fill credentials, and the browser's password manager no longer
  autofills them (from `@flexible-graphrag/angular-ui`).
- Requires the updated `@flexible-graphrag/angular-ui` and Flexible GraphRAG backend from
  2026-10-17 (install a local build with `scripts/install-lib-into-aca.sh` until released).

## [2026-10-10] — v0.8.4: open source documents in ACA's viewer, results and answers name their documents

### Added

- **Source documents on results and answers** (from `@flexible-graphrag/angular-ui` 0.8.4): hybrid search results name the document they came from, graph and RDF results included, and AI query and AI chat answers list their **Sources:**.
- **Open an Alfresco source document in ACA's own viewer**, in the same tab, over the document's folder. Closing the viewer returns to KG Spaces on the tab you left, with its search results and chat conversation kept (for the same signed-in user only). Nuxeo, web, Wikipedia and YouTube sources open in a new tab.
- README: Flexible GraphRAG version badge, UI guide link in *Using KG Spaces*, a PROCESSING tab screenshot, and *Open the source document*.

### Changed

- Hybrid search returns full results again (6 instead of 2 for a question about one document): a Flexible GraphRAG 0.8.4 backend fix for searches scoped to what the user may read.
- When the Flexible GraphRAG backend is not running or still starting, the PROCESSING tab says so (with **Retry**) instead of hiding the columns, and START PROCESSING shows why it could not start.
- Requires `@flexible-graphrag/angular-ui` ^0.8.4 and a Flexible GraphRAG 0.8.4+ backend.

### Fixed

- The PROCESSING tab's status (*not ingested* ...) no longer wraps onto two lines in ACA.

## [2026-10-08] — v0.8.3: Ask KG Spaces about a document or folder, answers only from documents the user may read, per-row Processing columns

### Added

- **Ask KG Spaces about this document / folder**: new context menu, toolbar and More actions entries open AI CHAT scoped to the selection, with an *Asking about: ...* bar.
- **Answers only from documents the user may read**: the signed-in user's Alfresco ticket is sent with search, AI query and AI chat requests.
- Per-row **Search+Vector**, **Graphs** and **Auto Sync** columns and the **Jobs** sub-tab, from `@flexible-graphrag/angular-ui` 0.8.3.
- New config keys: `noSourcesMessage`, `goToSourcesLabel`, `chatWelcomeTitle`, `chatWelcomeLines`, `showChatScope`.

### Changed

- The PROCESSING tab is kept across ACA navigation (the session's selection and rows are restored).
- Menu entry styling for the KG Spaces actions.
- Requires `@flexible-graphrag/angular-ui` ^0.8.3 and a Flexible GraphRAG 0.8.3+ backend.
- README: Auto Sync column, Ask about a document / folder, permission-filtered answers, new config keys, `LIB_VERSION` 0.8.3 example.

## [2026-10-02] — v0.8.2: initial release, an Apache 2.0 ACA 8.0 extension on the shared Angular UI library

### Added

- ACA 8.0.0 extension (`kg-spaces-aca-ext`): a KG Spaces page with OTHER SOURCES, PROCESSING, HYBRID SEARCH and AI CHAT tabs from `@flexible-graphrag/angular-ui` (npm).
- **Add to KG Spaces** toolbar and context-menu actions for multi-selected Alfresco files and folders.
- Uses ADF's stored login ticket: no custom login, no password handling.
- Config via `plugins.kgSpaces` in `app.config.json` (`apiUrl`, `alfrescoBaseUrl`, `enabledSources`, `recursive`, `agentIconUrl`).
- `scripts/patch-aca.mjs` wires the extension into an ACA checkout; `scripts/install-lib-into-aca.sh` installs local library builds.
- Docker image: ACA + the extension served by nginx, the library from npm (or a git clone / local tarball).
- Requires a Flexible GraphRAG 0.8.2+ backend.

import { Router } from '@angular/router';
import { AppConfigService } from '@alfresco/adf-core';
import { FlexibleGraphragConfig, SourceDocument } from '@flexible-graphrag/angular-ui';
import { findEcmTicket } from './ecm-ticket.util';

/**
 * Builds the shared UI library's configuration from ACA's own `app.config.json`, so the
 * backend URL is deployment configuration rather than a compiled-in constant.
 *
 * Only `apiUrl` really matters here: the Alfresco base URL comes from ACA's `ecmHost`, and the
 * other source types keep the library's defaults.
 */
export function kgSpacesConfigFactory(appConfig: AppConfigService, router: Router): FlexibleGraphragConfig {
  // An Alfresco document a result or answer came from opens in ACA's own viewer, in this tab,
  // the way Angel Borroy's ext-rag does, with `location` sending the viewer's close (X) back to
  // KG Spaces. It opens over the document's folder in the Repository view (the backend supplies
  // parent_id), so the breadcrumb shows where the file lives; over search when that is unknown.
  // The page restores its tab, search results and chat from ProcessingSessionService.
  const isAlfrescoNode = (doc: SourceDocument) => doc.source_type === 'alfresco' && !!doc.node_id;
  const openInViewer = (doc: SourceDocument): boolean => {
    if (!isAlfrescoNode(doc)) {
      return false;
    }
    const under = doc.parent_id ? ['/repository', doc.parent_id] : ['/search'];
    void router.navigate([...under, { outlets: { viewer: ['view', doc.node_id] } }],
                         { queryParams: { location: '/kg-spaces' } });
    return true;
  };

  return {
    apiUrl: appConfig.get<string>('plugins.kgSpaces.apiUrl', '/api'),
    // NOT ecmHost. ecmHost is where the BROWSER reaches Alfresco -- in dev that is ACA's own
    // origin (localhost:4200) with a proxy in front. This URL is handed to the Flexible
    // GraphRAG backend, which connects to Alfresco itself, server to server, and cannot
    // resolve the browser's dev-server port. It must be Alfresco's real address.
    alfrescoBaseUrl: appConfig.get<string>('plugins.kgSpaces.alfrescoBaseUrl', 'http://localhost:8080'),
    // The library's default (assets/agent.png) is the standalone app's path and does not exist
    // in an ACA host; this extension ships its own copy alongside its plugin JSON.
    agentIconUrl: appConfig.get<string>('plugins.kgSpaces.agentIconUrl', 'assets/plugins/agent.png'),
    defaultFolderPath: appConfig.get<string>('plugins.kgSpaces.defaultFolderPath', '/Shared/GraphRAG'),
    // The Processing tab's empty state: in ACA the Alfresco selection comes from the document
    // list (Add to KG Spaces), not from a Sources tab.
    noSourcesMessage: appConfig.get<string>('plugins.kgSpaces.noSourcesMessage',
      'Please select files/folders in ACA file list views for Alfresco sources first ' +
      '(or use the Other Sources tab for non-Alfresco sources).'),
    goToSourcesLabel: appConfig.get<string>('plugins.kgSpaces.goToSourcesLabel', '← Go to Other Sources'),
    // AI CHAT: KG Spaces' own welcome (a deployment can rebrand it), and the "Asking about"
    // bar on, since "Ask KG Spaces about this document / folder" hands the chat a scope.
    chatWelcomeTitle: appConfig.get<string>('plugins.kgSpaces.chatWelcomeTitle', 'Welcome to KG Spaces Chat'),
    chatWelcomeLines: appConfig.get<string[]>('plugins.kgSpaces.chatWelcomeLines', [
      'Ask questions about your Alfresco content and get conversational answers.',
      'Use "Ask KG Spaces about this document" or "...this folder" in ACA to ask about just that.',
    ]),
    showChatScope: appConfig.get<boolean>('plugins.kgSpaces.showChatScope', true),
    // Result / answer source documents: Alfresco nodes open in ACA's viewer (see above)
    openDocument: openInViewer,
    canOpenDocument: isAlfrescoNode,
    // Every search / chat question carries the signed-in user's ticket, so the backend answers
    // only from Alfresco documents this user may read (checked at question time -- ACLs change
    // after ingest). Read per request: ADF renews the ticket.
    requestHeaders: () => {
      const ticket = findEcmTicket();
      return ticket ? { 'X-Alfresco-Ticket': ticket } : {};
    },
    // ...and the user's sign-ins to every OTHER source (Nuxeo, CMIS, another Alfresco, Microsoft
    // 365, Box, Google, Azure, S3) from the sign-in icon on the KG Spaces tab bar, so their
    // documents are filtered to what this user may read as well. ACA's own Alfresco never asks:
    // its ticket covers it. Set plugins.kgSpaces.searchSignIn false to send only ACA's ticket.
    searchSignIn: appConfig.get<boolean>('plugins.kgSpaces.searchSignIn', true),
    // Alfresco is deliberately absent from the picker inside ACA, which is why the tab reads
    // OTHER SOURCES: ACA's own document list is the Alfresco picker here, and it expresses a
    // multi-select mixing files and folders, which this tab's single path field cannot.
    //
    // The form is still genuinely useful for a *different* Alfresco server than the one the
    // user signed in to -- with basic, ticket or OAuth2 auth of its own. That is a deliberate
    // admin/developer feature rather than a default, because two Alfresco entry points side
    // by side is confusing. Re-enable it per deployment by adding 'alfresco' to
    // plugins.kgSpaces.enabledSources in app.config.json; no rebuild required.
    enabledSources: appConfig.get<string[]>('plugins.kgSpaces.enabledSources', [
      'upload', 'nuxeo', 'cmis', 'web', 'wikipedia', 'youtube',
      'google_drive', 'onedrive', 's3', 'azure_blob', 'gcs', 'box', 'sharepoint'
    ])
  };
}

import { AppConfigService } from '@alfresco/adf-core';
import { FlexibleGraphragConfig } from '@flexible-graphrag/angular-ui';
import { findEcmTicket } from './ecm-ticket.util';

/**
 * Builds the shared UI library's configuration from ACA's own `app.config.json`, so the
 * backend URL is deployment configuration rather than a compiled-in constant.
 *
 * Only `apiUrl` really matters here: the Alfresco base URL comes from ACA's `ecmHost`, and the
 * other source types keep the library's defaults.
 */
export function kgSpacesConfigFactory(appConfig: AppConfigService): FlexibleGraphragConfig {
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
    // Every search / chat question carries the signed-in user's ticket, so the backend answers
    // only from Alfresco documents this user may read (checked at question time -- ACLs change
    // after ingest). Read per request: ADF renews the ticket.
    requestHeaders: () => {
      const ticket = findEcmTicket();
      return ticket ? { 'X-Alfresco-Ticket': ticket } : {};
    },
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

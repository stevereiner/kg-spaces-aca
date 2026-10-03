import { AppConfigService } from '@alfresco/adf-core';
import { FlexibleGraphragConfig } from '@flexible-graphrag/angular-ui';

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

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexibleGraphragUiModule } from '@flexible-graphrag/angular-ui';
import { findEcmTicket } from '../../services/ecm-ticket.util';
import { AcaSelectionService } from '../../services/aca-selection.service';
import { FlexibleGraphragConfigService, ProcessingSessionService } from '@flexible-graphrag/angular-ui';
import type { AskScope } from '@flexible-graphrag/angular-ui';
import { AppConfigService } from '@alfresco/adf-core';

/**
 * The KG Spaces page: the four Flexible GraphRAG tabs hosted inside ACA.
 *
 * Standalone, because ACA instantiates it dynamically from `kg-spaces.plugin.json`. It pulls
 * the shared tabs in by importing the library's NgModule -- the same thing ACA's own
 * AboutComponent does with AboutModule.
 *
 * Authentication: the Alfresco ticket ADF already holds is passed to the backend inside the
 * ingest payload (`alfrescoConfig.ticket`), never captured from a login form. The backend
 * accepts it as a pass-through credential, so no password is involved anywhere in this flow.
 */
@Component({
  selector: 'kg-spaces-page',
  imports: [CommonModule, MatCardModule, MatTabsModule, FlexibleGraphragUiModule],
  templateUrl: './kg-spaces-page.component.html',
  styleUrls: ['./kg-spaces-page.component.scss']
})
export class KgSpacesPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly selection = inject(AcaSelectionService);
  private readonly fgConfig = inject(FlexibleGraphragConfigService);
  private readonly appConfig = inject(AppConfigService);
  private readonly session = inject(ProcessingSessionService);

  selectedTabIndex = 0;

  hasConfiguredSources = false;
  configuredDataSource = '';
  configuredFiles: any[] = [];
  configuredFolderPath = '';
  repositoryItemsHidden = false;
  configuredCmisConfig: any = null;
  configuredAlfrescoConfig: any = null;
  configuredNuxeoConfig: any = null;
  configuredWebConfig: any = null;
  configuredWikipediaConfig: any = null;
  configuredYoutubeConfig: any = null;
  configuredCloudConfig: any = null;
  configuredEnterpriseConfig: any = null;
  configurationTimestamp = 0;
  /** AI CHAT answers only from this document / folder ("Ask KG Spaces about this ..."). */
  chatScope: AskScope | null = null;

  private static readonly CHAT_TAB = 3;

  /**
   * Pick up a selection handed over by the toolbar button or context menu, which navigate to
   * /kg-spaces?tab=processing&nodeIds=... The ids are resolved to full nodeDetails because the
   * backend keys off paths, not ids.
   */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('tab') === 'chat' && params.get('nodeId')) {
      this.askAbout(params.get('nodeId')!, params.get('nodeName') || '', params.get('isFolder') === 'true');
      return;
    }
    const nodeIds = (params.get('nodeIds') || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!nodeIds.length) {
      // Opened without a selection (the navbar link, or coming back from elsewhere in ACA):
      // this page is a route, so leaving destroyed it -- take back what it had.
      this.restoreSelection();
      return;
    }
    if (params.get('tab') === 'processing') {
      this.selectedTabIndex = 1;
    }
    this.selection.resolveNodeDetails(nodeIds).subscribe((nodeDetails) => {
      if (!nodeDetails.length) {
        console.error(
          '[KG Spaces] none of the selected nodes could be resolved; the Processing tab will ' +
          'show "no data sources configured". Requested ids:', nodeIds
        );
        return;
      }
      // ACA's document list is multi-select and may mix files and folders. The backend
      // handles that natively -- it routes each nodeDetails entry on its own isFile/isFolder
      // and uses that entry's own path -- so this top-level path is only a scoping label.
      // A single selection names itself; several share the folder they were selected in, and
      // anything unexpected falls back to the root rather than guessing.
      const parentPath = nodeDetails.length === 1
        ? nodeDetails[0].path
        : this.commonParent(nodeDetails.map((n) => n.path));
      this.configuredDataSource = 'alfresco';
      this.configuredFolderPath = parentPath;
      this.configuredAlfrescoConfig = this.withAcaTicket({
        url: this.fgConfig.alfrescoBaseUrl,
        path: parentPath,
        nodeIds,
        nodeDetails,
        // Whether a selected folder brings its subfolders along. Off by default, like the
        // backend: a folder picked in ACA ingests the documents directly in it.
        recursive: this.appConfig.get<boolean>('plugins.kgSpaces.recursive', false)
      });
      this.hasConfiguredSources = true;
      this.configurationTimestamp = Date.now();
    });
  }

  /**
   * "Ask KG Spaces about this document / folder": open AI CHAT scoped to that node. The
   * Processing tab keeps whatever selection it had. The backend matches the scope by node id
   * (a document) or by path (a folder covers everything below it), so resolve the path.
   */
  private askAbout(nodeId: string, name: string, isFolder: boolean): void {
    this.restoreSelection();
    this.selectedTabIndex = KgSpacesPageComponent.CHAT_TAB;
    this.chatScope = { data_source: 'alfresco', url: this.fgConfig.alfrescoBaseUrl,
                       node_id: nodeId, is_folder: isFolder, name: name || undefined };
    this.selection.resolveNodeDetails([nodeId]).subscribe((details) => {
      const node = details[0];
      if (node && this.chatScope?.node_id === nodeId) {
        this.chatScope = { ...this.chatScope, path: node.path, name: name || node.name, is_folder: !!node.isFolder };
      }
    });
  }

  ngOnDestroy(): void {
    this.session.hostSelection = {
      chatScope: this.chatScope,
      selectedTabIndex: this.selectedTabIndex,
      hasConfiguredSources: this.hasConfiguredSources,
      configuredDataSource: this.configuredDataSource,
      configuredFiles: this.configuredFiles,
      configuredFolderPath: this.configuredFolderPath,
      repositoryItemsHidden: this.repositoryItemsHidden,
      configuredCmisConfig: this.configuredCmisConfig,
      configuredAlfrescoConfig: this.configuredAlfrescoConfig,
      configuredNuxeoConfig: this.configuredNuxeoConfig,
      configuredWebConfig: this.configuredWebConfig,
      configuredWikipediaConfig: this.configuredWikipediaConfig,
      configuredYoutubeConfig: this.configuredYoutubeConfig,
      configuredCloudConfig: this.configuredCloudConfig,
      configuredEnterpriseConfig: this.configuredEnterpriseConfig,
      configurationTimestamp: this.configurationTimestamp,
    };
  }

  private restoreSelection(): void {
    const saved = this.session.hostSelection;
    if (!saved) {
      return;
    }
    Object.assign(this, saved);
    // The ticket may have been renewed since; never hand the backend a stale one
    if (this.configuredAlfrescoConfig?.auth_method === 'ticket') {
      this.configuredAlfrescoConfig = this.withAcaTicket(this.configuredAlfrescoConfig);
    }
  }

  /** The folder every selected node sits in, or '/' when they do not share one. */
  private commonParent(paths: string[]): string {
    const parents = paths.map((p) => p.substring(0, p.lastIndexOf('/')) || '/');
    return parents.every((p) => p === parents[0]) ? parents[0] : '/';
  }

  onConfigureProcessing(): void {
    this.selectedTabIndex = 1;
  }

  onSourcesConfigured(sourceConfig: any): void {
    this.hasConfiguredSources = true;
    this.configuredDataSource = sourceConfig.dataSource || '';
    this.configuredFiles = sourceConfig.files || [];
    this.configuredFolderPath = sourceConfig.folderPath || sourceConfig.path || '';
    this.configuredCmisConfig = sourceConfig.cmisConfig || null;
    this.configuredNuxeoConfig = sourceConfig.nuxeoConfig || null;
    this.configuredWebConfig = sourceConfig.webConfig || null;
    this.configuredWikipediaConfig = sourceConfig.wikipediaConfig || null;
    this.configuredYoutubeConfig = sourceConfig.youtubeConfig || null;
    this.configuredCloudConfig = sourceConfig.cloudConfig || null;
    this.configuredEnterpriseConfig = sourceConfig.enterpriseConfig || null;
    this.configuredAlfrescoConfig = this.withAcaTicket(sourceConfig.alfrescoConfig);
    this.configurationTimestamp = Date.now();
  }

  /**
   * Substitute the signed-in user's ACA ticket for whatever credentials the source form
   * collected. In ACA the user has already authenticated, so asking again would be both
   * redundant and the thing this rewrite exists to remove.
   */
  private withAcaTicket(alfrescoConfig: any): any {
    if (!alfrescoConfig) {
      return null;
    }
    const ticket = findEcmTicket();
    if (!ticket) {
      return alfrescoConfig;
    }
    const { username, password, ...rest } = alfrescoConfig;
    return {
      ...rest,
      url: alfrescoConfig.url || this.fgConfig.alfrescoBaseUrl,
      auth_method: 'ticket',
      ticket
    };
  }

  /**
   * A row's ✕ on the Processing tab: drop that node from the selection (rows are the
   * nodeDetails, in order). A plain path source from the OTHER SOURCES tab has one row, which is
   * hidden instead, as in the standalone app.
   */
  removeRepositoryFile(index: number): void {
    const cfg = this.configuredAlfrescoConfig;
    const nodes: any[] = this.configuredDataSource === 'alfresco' ? cfg?.nodeDetails || [] : [];
    if (!nodes.length) {
      this.repositoryItemsHidden = true;
      return;
    }
    const removed = nodes[index];
    const nodeDetails = nodes.filter((_, i) => i !== index);
    if (!nodeDetails.length) {
      this.hasConfiguredSources = false;
      this.configuredDataSource = '';
      this.configuredFolderPath = '';
      this.configuredAlfrescoConfig = null;
      return;
    }
    const path = nodeDetails.length === 1
      ? nodeDetails[0].path
      : this.commonParent(nodeDetails.map((n) => n.path));
    this.configuredFolderPath = path;
    this.configuredAlfrescoConfig = {
      ...cfg,
      path,
      nodeDetails,
      nodeIds: (cfg.nodeIds || []).filter((id: string) => id !== removed?.id),
    };
  }

  removeUploadFile(index: number): void {
    this.configuredFiles = this.configuredFiles.filter((_, i) => i !== index);
  }
}

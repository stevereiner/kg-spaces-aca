import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexibleGraphragUiModule } from '@flexible-graphrag/angular-ui';
import { findEcmTicket } from '../../services/ecm-ticket.util';
import { AcaSelectionService } from '../../services/aca-selection.service';
import { FlexibleGraphragConfigService } from '@flexible-graphrag/angular-ui';
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
export class KgSpacesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly selection = inject(AcaSelectionService);
  private readonly fgConfig = inject(FlexibleGraphragConfigService);
  private readonly appConfig = inject(AppConfigService);

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

  /**
   * Pick up a selection handed over by the toolbar button or context menu, which navigate to
   * /kg-spaces?tab=processing&nodeIds=... The ids are resolved to full nodeDetails because the
   * backend keys off paths, not ids.
   */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const nodeIds = (params.get('nodeIds') || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!nodeIds.length) {
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

  removeRepositoryFile(_index: number): void {
    /* repository items are contributed by ACA's own selection, not removed here yet */
  }

  removeUploadFile(index: number): void {
    this.configuredFiles = this.configuredFiles.filter((_, i) => i !== index);
  }
}

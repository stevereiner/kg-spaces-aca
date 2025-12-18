import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '@alfresco/adf-core';
import { CredentialStorageService } from '../../services/credential-storage.service';

@Component({
  selector: 'aca-kg-spaces',
  templateUrl: './kg-spaces.component.html',
  styleUrls: ['./kg-spaces.component.scss'],
  standalone: false
})
export class KgSpacesComponent implements OnInit {
  selectedTabIndex = 0;

  // Source configuration state
  hasConfiguredSources = false;
  configuredDataSource = '';
  configuredFiles: File[] = [];
  configuredFolderPath = '';
  configurationTimestamp = 0;

  // Repository-specific configuration
  configuredCmisConfig: any = null;
  configuredAlfrescoConfig: any = null;
  configuredWebConfig: any = null;
  configuredWikipediaConfig: any = null;
  configuredYoutubeConfig: any = null;
  configuredCloudConfig: any = null;
  configuredEnterpriseConfig: any = null;

  repositoryItemsHidden = false;

  private authService = inject(AuthenticationService);
  private credentialStorage = inject(CredentialStorageService);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Check for tab parameter in query string
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tabMap: { [key: string]: number } = {
          'alfresco': 0,
          'processing': 1,
          'search': 2,
          'query': 3
        };
        this.selectedTabIndex = tabMap[params['tab']] || 0;
      }

      // Check for pre-selected nodeId(s) or path from context menu/toolbar
      if (params['nodeIds'] || params['nodeId'] || params['path']) {
        const nodeIds = params['nodeIds'] ? params['nodeIds'].split(',') : (params['nodeId'] ? [params['nodeId']] : []);
        const nodeNames = params['nodeNames'] ? params['nodeNames'].split(',') : [];
        const path = params['path'];
        const name = params['name'];
        const isFile = params['isFile']; // Whether it's a file (for single selection - legacy support)
        const isFiles = params['isFiles']; // Array of isFile values for each node (for multiple selections)

        console.log('[KG Spaces] Pre-selected node(s) from toolbar/context menu:', { nodeIds, nodeNames, path, name, isFile, isFiles });

        // Pre-configure Alfresco source with these nodes
        // Build display path based on selection
        let displayPath: string;
        if (nodeIds.length === 1 && nodeNames.length === 1 && !name.includes('items')) {
          // Single selection: show full path
          displayPath = path && nodeNames[0] ? `${path}/${nodeNames[0]}` : `/${nodeNames[0] || name}`;
        } else if (nodeNames.length > 1) {
          // Multiple selection: show all names
          displayPath = nodeNames.join(', ');
        } else {
          // Fallback
          displayPath = name || path || '/';
        }

        this.configuredFolderPath = displayPath;

        // If we're on the processing tab and have nodes, auto-configure
        if (this.selectedTabIndex === 1 && nodeIds.length > 0) {
          this.hasConfiguredSources = true;
          this.configuredDataSource = 'alfresco';

          // Build nodeDetails array for backend with full Alfresco paths
          const isFilesArray = isFiles ? isFiles.split(',') : [];
          const nodeDetails = nodeIds.map((id: string, index: number) => {
            const itemName = nodeNames[index] || `Item ${index + 1}`;
            const parentPath = path || '/';

            // Determine if this node is a file or folder
            // For multiple selections, use isFiles array; for single selection, use isFile (legacy support)
            let isFileValue: boolean;
            if (nodeIds.length === 1) {
              // Single selection: use isFile parameter (legacy) or isFiles array
              isFileValue = isFilesArray.length > 0 ? (isFilesArray[0] === 'true') : (isFile === 'true');
            } else {
              // Multiple selections: use isFiles array
              isFileValue = isFilesArray.length > index ? (isFilesArray[index] === 'true') : true; // Default to true if missing
            }

            let fullPath: string;
            if (nodeIds.length === 1 && !isFileValue) {
              // Single folder: the path already includes the folder name from the parent
              // e.g., path = "/Company Home/Shared/test1", name = "test2"
              // Full path should be: /Company Home/Shared/test1/test2
              fullPath = parentPath === '/' ? `/${itemName}` : `${parentPath}/${itemName}`;
            } else {
              // File or multiple selection: build full path normally
              fullPath = parentPath === '/' ? `/${itemName}` : `${parentPath}/${itemName}`;
            }

            return {
              id: id,
              name: itemName,
              path: fullPath,  // Full Alfresco path including /Company Home
              isFile: isFileValue,
              isFolder: !isFileValue
            };
          });

          // For single selection, use full path; for multiple, use parent folder path
          let alfrescoPath: string;
          if (nodeIds.length === 1) {
            // Single selection: use full path from first nodeDetail
            alfrescoPath = nodeDetails[0].path;
          } else {
            // Multiple selections: use parent folder path
            alfrescoPath = path || '/';
          }

          // Get stored credentials or use defaults
          const username = this.authService.getUsername() || 'admin';
          let credentials = this.credentialStorage.getCredentialsForUser(username);

          // If no stored credentials, use defaults (will prompt on first configure)
          if (!credentials) {
            credentials = {
              username: username,
              password: '',  // Will be prompted when user clicks Configure
              url: 'http://localhost:8080'
            };
          }

          this.configuredAlfrescoConfig = {
            url: credentials.url || 'http://localhost:8080',
            username: credentials.username,
            password: credentials.password || '',  // Will prompt if empty
            path: alfrescoPath,  // Use full Alfresco path - full path for single file, folder for multiple
            nodeRefs: nodeIds,
            nodeDetails: nodeDetails  // Detailed node info for backend with full Alfresco paths
          };
          this.configurationTimestamp = Date.now();
        }
      }
    });
  }

  /**
   * Called when sources are configured (from Sources tab or Alfresco tab)
   */
  onSourcesConfigured(sourceConfig: any): void {
    console.log('[KG Spaces] Sources configured:', sourceConfig);

    this.hasConfiguredSources = true;
    this.configuredDataSource = sourceConfig.dataSource || 'alfresco';
    this.configuredFiles = sourceConfig.files || [];
    this.configuredFolderPath = sourceConfig.folderPath || sourceConfig.path || '';
    this.configurationTimestamp = Date.now();

    // Store data-source specific configuration
    this.configuredCmisConfig = sourceConfig.cmisConfig || null;
    this.configuredAlfrescoConfig = sourceConfig.alfrescoConfig || null;
    this.configuredWebConfig = sourceConfig.webConfig || null;
    this.configuredWikipediaConfig = sourceConfig.wikipediaConfig || null;
    this.configuredYoutubeConfig = sourceConfig.youtubeConfig || null;
    this.configuredCloudConfig = sourceConfig.cloudConfig || null;
    this.configuredEnterpriseConfig = sourceConfig.enterpriseConfig || null;

    // Auto-navigate to processing tab
    this.goToProcessing();
  }

  /**
   * Navigate to processing tab
   */
  goToProcessing(): void {
    this.selectedTabIndex = 1;
  }

  /**
   * Navigate back to sources tab
   */
  goToSources(): void {
    this.selectedTabIndex = 0;
  }

  /**
   * Remove repository files
   */
  removeRepositoryFile(_index: number): void {
    // Hide repository items in the processing tab
    this.repositoryItemsHidden = true;
    this.hasConfiguredSources = false;
  }

  /**
   * Remove upload files
   */
  removeUploadFile(index: number): void {
    this.configuredFiles = this.configuredFiles.filter((_, i) => i !== index);

    if (this.configuredFiles.length === 0) {
      this.hasConfiguredSources = false;
    }
  }
}


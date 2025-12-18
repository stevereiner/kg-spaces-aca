import { Component, EventEmitter, Output, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { PageComponent, ContentApiService } from '@alfresco/aca-shared';
import { NodeEntry, Node, PathElement } from '@alfresco/js-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentListPresetRef } from '@alfresco/adf-extensions';
import { SetCurrentFolderAction } from '@alfresco/aca-shared/store';
import { AuthenticationService } from '@alfresco/adf-core';
import { CredentialStorageService } from '../../services/credential-storage.service';

@Component({
  selector: 'aca-kg-alfresco-tab',
  templateUrl: './alfresco-tab.component.html',
  styleUrls: ['./alfresco-tab.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class AlfrescoTabComponent extends PageComponent implements OnInit {
  @Output() sourcesConfigured = new EventEmitter<any>();
  @Output() goToProcessing = new EventEmitter<void>();

  private authService = inject(AuthenticationService);
  private credentialStorage = inject(CredentialStorageService);

  override selectedRowItemsCount = 0;
  currentFolderId = '-my-';
  columns: DocumentListPresetRef[] = [];
  override title = 'Personal Files';

  constructor(private contentApi: ContentApiService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();

    // Use the same column configuration as Personal Files
    this.extensions.filesDocumentListPreset$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preset) => {
        this.columns = preset;
      });

    // Load initial node for breadcrumb
    this.loadNode(this.currentFolderId);
  }

  override onSelectedItemsCountChanged(count: number) {
    this.selectedRowItemsCount = count;
  }

  /**
   * Load node for breadcrumb navigation
   */
  private loadNode(nodeId: string) {
    this.contentApi
      .getNode(nodeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nodeEntry) => {
        if (nodeEntry?.entry?.isFolder) {
          this.updateCurrentNode(nodeEntry.entry);
        }
      });
  }

  /**
   * Update current node for breadcrumb
   */
  private async updateCurrentNode(node: Node) {
    if (node?.path?.elements) {
      const elements = node.path.elements;
      // Normalize path for Personal Files (remove Company Home/User Homes)
      if (elements.length > 1 && elements[1].name === 'User Homes') {
        // Keep the path but normalize it for display
        this.node = node;
      } else {
        this.node = node;
      }
    } else {
      this.node = node;
    }
    this.store.dispatch(new SetCurrentFolderAction(node));

    // Update canUpload based on node permissions
    if (this.content) {
      this.canUpload = this.content.canUploadContent(node);
    }
  }

  /**
   * Handle breadcrumb navigation
   */
  onBreadcrumbNavigate(route: PathElement) {
    this.documentList.resetNewFolderPagination();
    if (route.id) {
      this.currentFolderId = route.id;
      this.loadNode(route.id);
    }
  }

  /**
   * Navigate to folder on single click
   */
  navigateTo(node: NodeEntry) {
    if (node?.entry) {
      const { isFolder } = node.entry;

      if (isFolder) {
        let id: string;

        if (node.entry.nodeType === 'app:folderlink') {
          id = node.entry.properties['cm:destination'];
        } else {
          id = node.entry.id;
        }

        this.currentFolderId = id;
        this.documentList.resetNewFolderPagination();
        this.loadNode(id);
        return;
      }

      // For files, show preview - viewer should open in main app layout
      this.showPreview(node, { location: '/kg-spaces' });
    }
  }

  /**
   * Handle node click events (both single-click on name and double-click)
   */
  handleNodeClick(event: Event) {
    this.navigateTo((event as CustomEvent).detail?.node);
  }

  /**
   * Check if current selection can be processed
   * - One or more files only, OR
   * - A single folder
   * But NOT multiple folders or mixed files/folders
   *
   * COMMENTED OUT: Backend now supports multiple folders and mixed folder/doc selections
   */
  // canProcessSelection(): boolean {
  //   const selection = this.documentList?.selection;
  //   if (!selection || selection.length === 0) {
  //     return false;
  //   }

  //   // Single folder is OK
  //   if (selection.length === 1 && selection[0]?.entry?.isFolder) {
  //     return true;
  //   }

  //   // Multiple files (no folders) is OK
  //   const allFiles = selection.every((node: any) => node.entry?.isFile === true);
  //   return allFiles;
  // }

  /**
   * Simplified check - just verify selection is not empty
   * Backend now supports multiple folders and mixed selections
   */
  canProcessSelection(): boolean {
    const selection = this.documentList?.selection;
    return selection && selection.length > 0;
  }

  /**
   * Configure selected nodes for processing
   */
  configureSelection(): void {
    const selection = this.documentList?.selection;
    if (!selection || selection.length === 0) {
      return;
    }

    // Build array of node information with IDs, names, paths, and types
    const nodeDetails = selection.map((node: any) => {
      console.log('[Alfresco Tab] Node entry:', node.entry);
      const folderPath = node.entry.path?.name || '/';
      const fullPath = `${folderPath}/${node.entry.name}`;
      return {
        id: node.entry.id,
        name: node.entry.name,
        path: fullPath,  // Full Alfresco path including /Company Home
        isFile: node.entry.isFile === true,
        isFolder: node.entry.isFolder === true
      };
    });

    const nodeRefs = nodeDetails.map(n => n.id);
    const firstNode = selection[0]?.entry;

    // For display and backend path
    let displayPath: string;
    let fileName: string;
    let alfrescoPath: string;

    if (selection.length === 1) {
      // Single selection
      fileName = firstNode?.name || '';
      const folderPath = firstNode?.path?.name || '/';
      const fullPath = `${folderPath}/${fileName}`;
      displayPath = fullPath;

      // Backend path: for both files and folders, use full Alfresco path with item name
      alfrescoPath = fullPath;
    } else {
      // Multiple selection: show all names
      fileName = nodeDetails.map(n => n.name).join(', ');
      displayPath = firstNode?.path?.name || '/';
      alfrescoPath = firstNode?.path?.name || '/';  // For multiple, use folder path
    }

    // Get current user's username from session
    const username = this.authService.getUsername() || 'admin';

    // Get stored credentials (captured from login form)
    let credentials = this.credentialStorage.getCredentialsForUser(username);

    // If no stored credentials, use defaults (credentials should have been captured at login)
    if (!credentials) {
      console.warn('[Alfresco Tab] No stored credentials found for user:', username);
      console.warn('[Alfresco Tab] Credentials should have been captured at login. Check login interceptor.');
      credentials = {
        username: username,
        password: '',  // Will be empty if not captured - backend may need to handle this
        url: 'http://localhost:8080'
      };
    } else {
      console.log('[Alfresco Tab] Using stored credentials for user:', username);
      console.log('[Alfresco Tab] Credentials URL:', credentials.url);
    }

    // Use stored credentials
    this.sourcesConfigured.emit({
      dataSource: 'alfresco',
      folderPath: displayPath,  // Keep full path for display
      path: displayPath,
      fileName: fileName,
      nodeDetails: nodeDetails,  // Pass detailed node information
      alfrescoConfig: {
        url: credentials.url || 'http://localhost:8080',
        username: credentials.username,
        password: credentials.password || '',  // Use captured password
        path: alfrescoPath,  // Use full Alfresco path for backend - with filename for files
        nodeRefs: nodeRefs,  // Array of node IDs
        nodeDetails: nodeDetails  // Detailed node info for backend with full Alfresco paths
      }
    });

    this.goToProcessing.emit();
  }
}


import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class KgSpacesActionService {
  constructor(private router: Router) {}

  /**
   * Navigate to KG Spaces processing tab with selected node pre-configured
   */
  processSelected(context: any): void {
    const selection = context?.selection;
    
    if (!selection || !selection.first) {
      console.warn('[KG Spaces] No selection found');
      return;
    }

    const node = selection.first.entry;
    const nodeId = node.id;
    const path = node.path?.name || node.name;
    const name = node.name;

    console.log('[KG Spaces] Processing selected node:', { nodeId, path, name, node });

    // Navigate to KG Spaces processing tab with node info
    this.router.navigate(['/kg-spaces'], {
      queryParams: {
        tab: 'processing',
        nodeId: nodeId,
        path: path,
        name: name
      }
    });
  }
}


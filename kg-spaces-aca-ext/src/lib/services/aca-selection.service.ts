import { Injectable, inject } from '@angular/core';
import { AlfrescoApiService } from '@alfresco/adf-content-services';
import { NodesApi } from '@alfresco/js-api';
import { Observable, from } from 'rxjs';

export interface KgNodeDetail {
  id: string;
  name: string;
  path: string;
  isFile: boolean;
  isFolder: boolean;
}

/**
 * Turns an ACA selection (node ids carried on the KG Spaces URL) into the `nodeDetails` the
 * backend needs.
 *
 * The ids alone are not enough: the backend's Alfresco source keys off `nodeDetails`, and each
 * entry requires a repository `path`. ACA's document-list selection does not reliably carry
 * one, so each node is read back with `include=path`.
 *
 * This goes through js-api's NodesApi (the same route ACA itself uses) rather than a raw
 * HttpClient call to a relative URL: ADF's authentication is applied by the js-api instance,
 * and a hand-rolled relative request is not guaranteed to pick it up.
 */
@Injectable({ providedIn: 'root' })
export class AcaSelectionService {
  private readonly apiService = inject(AlfrescoApiService);
  private nodesApiInstance: NodesApi | null = null;

  private get nodesApi(): NodesApi {
    if (!this.nodesApiInstance) {
      this.nodesApiInstance = new NodesApi(this.apiService.getInstance());
    }
    return this.nodesApiInstance;
  }

  resolveNodeDetails(nodeIds: string[]): Observable<KgNodeDetail[]> {
    return from(this.resolveAll(nodeIds));
  }

  private async resolveAll(nodeIds: string[]): Promise<KgNodeDetail[]> {
    const details: KgNodeDetail[] = [];
    for (const id of nodeIds) {
      try {
        const res: any = await this.nodesApi.getNode(id, { include: ['path'] });
        const entry = res?.entry;
        if (!entry) {
          console.warn('[KG Spaces] node returned no entry', id);
          continue;
        }
        // Alfresco reports the PARENT path in path.name; the node's own path is that plus its
        // name. Company Home is the ingest root, so strip it to match the paths the rest of
        // Flexible GraphRAG uses (e.g. /Shared/GraphRAG/doc.txt).
        const parent = (entry.path?.name || '').replace(/^\/Company Home/, '') || '';
        details.push({
          id: entry.id,
          name: entry.name,
          path: `${parent}/${entry.name}`.replace(/\/+/g, '/'),
          isFile: !!entry.isFile,
          isFolder: !!entry.isFolder
        });
      } catch (err) {
        // Never swallow this silently: an unresolved node is the difference between the
        // Processing tab showing the selection and showing "no data sources configured",
        // and without a message that looks like the extension doing nothing at all.
        console.error('[KG Spaces] could not resolve node', id, err);
      }
    }
    return details;
  }
}

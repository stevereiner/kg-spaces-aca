import { InjectionToken } from '@angular/core';

export interface FlexibleGraphragConfig {
  apiUrl: string;
  cmisBaseUrl?: string;
  alfrescoBaseUrl?: string;
}

export const FLEXIBLE_GRAPHRAG_CONFIG = new InjectionToken<FlexibleGraphragConfig>(
  'FLEXIBLE_GRAPHRAG_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({
      apiUrl: '/api',
      cmisBaseUrl: 'http://localhost:8080',
      alfrescoBaseUrl: 'http://localhost:8080'
    })
  }
);


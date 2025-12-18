export interface IngestRequest {
  source_type: string;
  source_config?: any;
  files?: File[];
  folder_path?: string;
  cmis_config?: CmisConfig;
  alfresco_config?: AlfrescoConfig;
  web_config?: WebConfig;
  cloud_config?: CloudConfig;
}

export interface CmisConfig {
  url: string;
  username: string;
  password: string;
  repository_id?: string;
  folder_path?: string;
}

export interface AlfrescoConfig {
  url: string;
  username: string;
  password: string;
  site_id?: string;
  folder_path?: string;
  node_refs?: string[];
}

export interface WebConfig {
  urls: string[];
  max_depth?: number;
}

export interface CloudConfig {
  provider: string;
  bucket?: string;
  credentials?: any;
}

export interface QueryRequest {
  query: string;
  search_type?: 'local' | 'global' | 'hybrid';
  top_k?: number;
}

export interface AsyncProcessingResponse {
  processing_id: string;
  status: string;
  message: string;
}

export interface ProcessingStatusResponse {
  processing_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  result?: any;
  error?: string;
}

export interface ApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: string;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata?: any;
}

export interface QueryResult {
  answer: string;
  sources: SearchResult[];
  context?: string;
}


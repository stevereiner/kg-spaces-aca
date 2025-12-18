import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IngestRequest,
  QueryRequest,
  ApiResponse,
  AsyncProcessingResponse,
  ProcessingStatusResponse
} from '../models/graphrag.models';

@Injectable({
  providedIn: 'root'
})
export class GraphRagService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Ingest documents from various sources
   */
  ingestDocuments(request: IngestRequest): Observable<AsyncProcessingResponse> {
    return this.http.post<AsyncProcessingResponse>(
      `${this.apiUrl}/ingest`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get processing status
   */
  getProcessingStatus(processingId: string): Observable<ProcessingStatusResponse> {
    return this.http.get<ProcessingStatusResponse>(
      `${this.apiUrl}/processing-status/${processingId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cancel processing
   */
  cancelProcessing(processingId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/cancel-processing/${processingId}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Search the knowledge graph
   */
  search(request: QueryRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/search`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Query the knowledge graph with AI
   */
  query(request: QueryRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/query`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get system status
   */
  getStatus(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `${this.apiUrl}/status`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Upload files
   */
  uploadFiles(formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/upload`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.detail || error.message || 'Server error';
    }
    console.error('GraphRAG API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}


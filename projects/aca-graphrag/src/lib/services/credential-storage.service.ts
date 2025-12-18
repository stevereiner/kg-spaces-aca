import { Injectable } from '@angular/core';

export interface AlfrescoCredentials {
  username: string;
  password: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CredentialStorageService {
  private readonly STORAGE_KEY = 'kg-spaces:alfresco-credentials';
  private readonly SESSION_KEY = 'kg-spaces:alfresco-credentials-session'; // Legacy key for migration

  /**
   * Store credentials in localStorage (persists across browser sessions)
   * Also store in sessionStorage as backup
   * Note: This is not encrypted - for production, consider encryption
   */
  storeCredentials(credentials: AlfrescoCredentials): void {
    try {
      // Store in localStorage for persistence across sessions
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));
      console.log('[CredentialStorage] Credentials stored in localStorage for user:', credentials.username);

      // Also store in sessionStorage as backup
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('[CredentialStorage] Failed to store credentials:', error);
      // Fallback to sessionStorage if localStorage fails (e.g., private browsing)
      try {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(credentials));
        console.log('[CredentialStorage] Fallback: stored in sessionStorage only');
      } catch (fallbackError) {
        console.error('[CredentialStorage] Failed to store in sessionStorage as fallback:', fallbackError);
      }
    }
  }

  /**
   * Retrieve stored credentials from localStorage (with sessionStorage fallback)
   */
  getCredentials(): AlfrescoCredentials | null {
    try {
      // First try localStorage (persistent storage)
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AlfrescoCredentials;
      }

      // Fallback to sessionStorage (for migration or if localStorage was cleared)
      const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionStored) {
        const credentials = JSON.parse(sessionStored) as AlfrescoCredentials;
        // Migrate to localStorage
        this.storeCredentials(credentials);
        return credentials;
      }
    } catch (error) {
      console.error('[CredentialStorage] Failed to retrieve credentials:', error);
    }
    return null;
  }

  /**
   * Check if credentials are stored
   */
  hasCredentials(): boolean {
    return this.getCredentials() !== null;
  }

  /**
   * Clear stored credentials from both localStorage and sessionStorage
   */
  clearCredentials(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      console.log('[CredentialStorage] Credentials cleared from both storage locations');
    } catch (error) {
      console.error('[CredentialStorage] Failed to clear credentials:', error);
    }
  }

  /**
   * Get credentials for a specific username
   * Returns stored credentials if username matches, null otherwise
   */
  getCredentialsForUser(username: string): AlfrescoCredentials | null {
    const credentials = this.getCredentials();
    if (credentials && credentials.username === username) {
      return credentials;
    }
    return null;
  }
}

import { Injectable, inject } from '@angular/core';
import { AuthenticationService, AppConfigService } from '@alfresco/adf-core';
import { CredentialStorageService } from './credential-storage.service';

/**
 * Service to check and handle credentials when user is already authenticated
 * This handles the case where user has a browser session but credentials weren't captured
 */
@Injectable({
  providedIn: 'root'
})
export class AuthCredentialCheckerService {
  private authService = inject(AuthenticationService);
  private appConfig = inject(AppConfigService);
  private credentialStorage = inject(CredentialStorageService);

  /**
   * Check if user is authenticated and ensure credentials are stored
   * This should be called on app initialization
   *
   * Note: If user is already authenticated via browser session, we cannot retrieve
   * the password for security reasons. The user will need to log out and log back in
   * to capture credentials, OR we can try to use the authentication ticket if available.
   */
  checkAndStoreCredentials(): void {
    // Use a small delay to ensure authentication service is fully initialized
    setTimeout(() => {
      // Check if user is already authenticated
      if (this.authService.isLoggedIn()) {
        const username = this.authService.getUsername();

        if (username) {
          console.log('[Auth Credential Checker] User is already authenticated:', username);

          // Check if credentials are already stored for this user
          const existingCredentials = this.credentialStorage.getCredentialsForUser(username);

          if (!existingCredentials) {
            console.warn('[Auth Credential Checker] ⚠️ User is authenticated but credentials are not stored');
            console.warn('[Auth Credential Checker] This happens when user has an existing browser session');
            console.warn('[Auth Credential Checker] Checking localStorage for previously stored credentials...');

            // Check if credentials exist in localStorage (from previous session)
            // Since we now use localStorage, credentials should persist across sessions
            const allStored = this.credentialStorage.getCredentials();
            if (allStored && allStored.username === username) {
              console.log('[Auth Credential Checker] ✓ Found credentials in localStorage from previous session');
              console.log('[Auth Credential Checker] Credentials are available for backend use');
            } else {
              console.warn('[Auth Credential Checker] No credentials found in localStorage either');
              console.warn('[Auth Credential Checker] User should log out and log back in to capture credentials for backend');

              // Try to get authentication ticket from Alfresco API
              try {
                const alfrescoApi = (this.authService as any).alfrescoApi;
                if (alfrescoApi && alfrescoApi.getTicket) {
                  const ticket = alfrescoApi.getTicket();
                  if (ticket) {
                    console.log('[Auth Credential Checker] Found authentication ticket, but password still needed for backend');
                  }
                }
              } catch (error) {
                console.debug('[Auth Credential Checker] Could not access authentication ticket:', error);
              }

              // Log URL for reference
              const url = this.getAlfrescoUrl();
              console.log('[Auth Credential Checker] Username:', username, 'URL:', url);
            }
          } else {
            console.log('[Auth Credential Checker] ✓ Credentials already stored for user:', username);
          }
        }
      } else {
        console.log('[Auth Credential Checker] User is not authenticated - credentials will be captured on login');
      }
    }, 500); // Delay to ensure auth service is ready
  }

  /**
   * Subscribe to login and logout events
   * - On login: Check if credentials are stored (they should be captured by custom login component)
   * - On logout: Clear stored credentials for security
   */
  setupLoginListener(): void {
    // Listen for login events
    this.authService.onLogin.subscribe(() => {
      const username = this.authService.getUsername();
      console.log('[Auth Credential Checker] Login event detected for user:', username);

      // Check if credentials are stored
      const existingCredentials = this.credentialStorage.getCredentialsForUser(username);
      if (!existingCredentials) {
        console.warn('[Auth Credential Checker] User logged in but credentials not stored');
        console.warn('[Auth Credential Checker] This may happen if login was via existing session');
        console.warn('[Auth Credential Checker] Credentials should be captured by custom login component on next login');
      } else {
        console.log('[Auth Credential Checker] ✓ Credentials found for logged-in user:', username);
      }
    });

    // Listen for logout events and clear credentials
    this.authService.onLogout.subscribe(() => {
      console.log('[Auth Credential Checker] Logout event detected - clearing stored credentials');
      this.credentialStorage.clearCredentials();
    });
  }

  private getAlfrescoUrl(): string {
    try {
      const ecmHost = this.appConfig.get<string>('ecmHost', '');
      if (ecmHost) {
        return ecmHost;
      }
      return window.location.origin;
    } catch (error) {
      console.warn('[Auth Credential Checker] Could not get Alfresco URL:', error);
      return window.location.origin;
    }
  }
}

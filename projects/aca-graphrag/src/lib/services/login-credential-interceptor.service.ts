import { Injectable, inject, APP_INITIALIZER } from '@angular/core';
import { AppConfigService } from '@alfresco/adf-core';
import { CredentialStorageService } from './credential-storage.service';

/**
 * Service that intercepts login form submissions to capture credentials
 * This extends ACA functionality without modifying core ACA files
 */
@Injectable({
  providedIn: 'root'
})
export class LoginCredentialInterceptorService {
  private credentialStorage = inject(CredentialStorageService);
  private appConfig = inject(AppConfigService);
  private initialized = false;

  /**
   * Initialize the interceptor to capture login credentials
   * This should be called during app initialization
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Wait for DOM to be ready, then set up form interception
    if (typeof document !== 'undefined') {
      console.log('[KG Spaces] Login credential interceptor initializing...');

      // Use MutationObserver to watch for login form
      const observer = new MutationObserver(() => {
        this.setupFormInterception();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also try immediately in case form is already present
      setTimeout(() => {
        console.log('[KG Spaces] Attempting to setup form interception (100ms)');
        this.setupFormInterception();
      }, 100);
      setTimeout(() => {
        console.log('[KG Spaces] Attempting to setup form interception (500ms)');
        this.setupFormInterception();
      }, 500);
      setTimeout(() => {
        console.log('[KG Spaces] Attempting to setup form interception (1000ms)');
        this.setupFormInterception();
      }, 1000);

      this.initialized = true;
    }
  }

  private setupFormInterception(): void {
    // Try multiple selectors for username and password inputs
    const usernameSelectors = [
      '#username',
      'input[name="username"]',
      'input[type="text"][placeholder*="username" i]',
      'input[type="text"][placeholder*="user" i]',
      'input[type="email"]'
    ];

    const passwordSelectors = [
      '#password',
      'input[name="password"]',
      'input[type="password"]'
    ];

    // Find username input
    let usernameInput: HTMLInputElement | null = null;
    for (const selector of usernameSelectors) {
      usernameInput = document.querySelector(selector) as HTMLInputElement;
      if (usernameInput) {
        console.log('[KG Spaces] Found username input with selector:', selector);
        break;
      }
    }

    // Find password input
    let passwordInput: HTMLInputElement | null = null;
    for (const selector of passwordSelectors) {
      passwordInput = document.querySelector(selector) as HTMLInputElement;
      if (passwordInput) {
        console.log('[KG Spaces] Found password input with selector:', selector);
        break;
      }
    }

    if (usernameInput && passwordInput) {
      // Check if we've already added our listener
      if ((usernameInput as any).__kgSpacesCredentialCapture) {
        return;
      }

      console.log('[KG Spaces] Found username and password inputs directly');
      console.log('[KG Spaces] Username input:', usernameInput);
      console.log('[KG Spaces] Password input:', passwordInput);

      // Store references to capture values when login happens
      let lastUsername = '';
      let lastPassword = '';

      // Watch for input changes to capture values
      usernameInput.addEventListener('input', () => {
        lastUsername = usernameInput.value || '';
        console.log('[KG Spaces] Username input changed:', lastUsername);
      });

      passwordInput.addEventListener('input', () => {
        lastPassword = passwordInput.value || '';
        console.log('[KG Spaces] Password input changed (length):', lastPassword.length);
      });

      // Also watch for blur events (when user leaves the field)
      usernameInput.addEventListener('blur', () => {
        lastUsername = usernameInput.value || '';
      });

      passwordInput.addEventListener('blur', () => {
        lastPassword = passwordInput.value || '';
      });

      // Try to find and intercept the login button - try multiple selectors
      const buttonSelectors = [
        'button#login-button',
        'button[type="submit"]',
        'button.adf-login-button',
        'button.adf-button-primary',
        'button[aria-label*="login" i]',
        'button[aria-label*="sign" i]',
        'button'
      ];

      let submitButton: HTMLButtonElement | null = null;
      for (const selector of buttonSelectors) {
        const buttons = document.querySelectorAll(selector);
        for (const btn of Array.from(buttons)) {
          // Check if button is visible and likely the login button
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          if (text.includes('login') || text.includes('sign') ||
              ariaLabel.includes('login') || ariaLabel.includes('sign') ||
              selector === 'button[type="submit"]') {
            submitButton = btn as HTMLButtonElement;
            console.log('[KG Spaces] Found login button with selector:', selector);
            break;
          }
        }
        if (submitButton) break;
      }

      if (submitButton) {
        console.log('[KG Spaces] Found login button:', submitButton);
        submitButton.addEventListener('click', () => {
          // Capture values immediately on button click
          const username = usernameInput.value || lastUsername || '';
          const password = passwordInput.value || lastPassword || '';

          console.log('[KG Spaces] Login button clicked');
          console.log('[KG Spaces] Captured username:', username);
          console.log('[KG Spaces] Captured password length:', password.length);

          if (username && password) {
            const url = this.getAlfrescoUrl();
            console.log('[KG Spaces] Storing credentials from button click - username:', username, 'url:', url);

            this.credentialStorage.storeCredentials({
              username: username,
              password: password,
              url: url
            });
            console.log('[KG Spaces] Credentials captured and stored from login button click');
          } else {
            console.warn('[KG Spaces] Button clicked but username or password is empty');
            console.warn('[KG Spaces] Username input value:', usernameInput.value);
            console.warn('[KG Spaces] Password input value length:', passwordInput.value?.length || 0);
          }
        }, { capture: true });
      } else {
        console.warn('[KG Spaces] Login button not found');
      }

      // Mark inputs as processed
      (usernameInput as any).__kgSpacesCredentialCapture = true;
      (passwordInput as any).__kgSpacesCredentialCapture = true;
    }

    // Also try form-based approach as fallback
    const formSelectors = [
      'form[adf-login-form]',
      'form.adf-login-form',
      'form',
      '#login-form'
    ];

    for (const selector of formSelectors) {
      const form = document.querySelector(selector) as HTMLFormElement;
      if (form) {
        const formUsernameInput = form.querySelector('#username') as HTMLInputElement;
        const formPasswordInput = form.querySelector('#password') as HTMLInputElement;

        if (formUsernameInput && formPasswordInput) {
          // Check if we've already added our listener
          if ((form as any).__kgSpacesCredentialCapture) {
            continue;
          }

          console.log('[KG Spaces] Found login form with selector:', selector);
          console.log('[KG Spaces] Form element:', form);

          // Add submit listener to capture credentials
          form.addEventListener('submit', () => {
            const username = formUsernameInput.value || '';
            const password = formPasswordInput.value || '';

            console.log('[KG Spaces] Form submit detected, username:', username, 'password length:', password.length);

            if (username && password) {
              const url = this.getAlfrescoUrl();
              console.log('[KG Spaces] Storing credentials - username:', username, 'url:', url);

              // Store credentials for GraphRAG backend use
              this.credentialStorage.storeCredentials({
                username: username,
                password: password,
                url: url
              });
              console.log('[KG Spaces] Credentials captured and stored from login form');
            } else {
              console.warn('[KG Spaces] Form submitted but username or password is empty');
            }
          }, { capture: true });

          // Mark form as processed
          (form as any).__kgSpacesCredentialCapture = true;
          console.log('[KG Spaces] Form interception setup complete for selector:', selector);
          break;
        }
      }
    }
  }

  private getAlfrescoUrl(): string {
    // Get the resolved ecmHost from ACA's configuration
    // This handles dynamic templates like {protocol}//{hostname}{:port}
    const ecmHost = this.appConfig.get<string>('ecmHost', '');

    if (ecmHost) {
      // AppConfigService automatically resolves {protocol}, {hostname}, {:port} placeholders
      return ecmHost;
    }

    // Fallback: use window location if config not available
    // This shouldn't happen in normal operation
    console.warn('[KG Spaces] ecmHost not found in app config, using window.location.origin as fallback');
    return window.location.origin;
  }
}

/**
 * Factory function to initialize the login credential interceptor
 */
export function initializeLoginCredentialInterceptor(
  interceptor: LoginCredentialInterceptorService
): () => void {
  return () => {
    interceptor.initialize();
  };
}

/**
 * Provider for app initialization
 */
export const LOGIN_CREDENTIAL_INTERCEPTOR_INITIALIZER = {
  provide: APP_INITIALIZER,
  useFactory: initializeLoginCredentialInterceptor,
  deps: [LoginCredentialInterceptorService],
  multi: true
};

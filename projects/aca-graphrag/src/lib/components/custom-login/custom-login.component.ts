import { LoginComponent } from '@alfresco/adf-core';
import { Component, ViewChild, inject, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppSettingsService } from '@alfresco/aca-shared';
import { AppConfigService } from '@alfresco/adf-core';
import { CredentialStorageService } from '../../services/credential-storage.service';

@Component({
  selector: 'kg-custom-login',
  imports: [LoginComponent, TranslatePipe],
  templateUrl: './custom-login.component.html',
  styles: [
    `
      .adf-login {
        background-color: var(--theme-white-background);
      }
    `
  ],
  encapsulation: ViewEncapsulation.None
})
export class CustomLoginComponent implements AfterViewInit {
  @ViewChild(LoginComponent) loginComponent!: LoginComponent;

  settings = inject(AppSettingsService);
  private appConfig = inject(AppConfigService);
  private credentialStorage = inject(CredentialStorageService);

  ngAfterViewInit(): void {
    // Hook into the login component's form to capture credentials
    if (this.loginComponent) {
      // Access the form from the login component
      // The ADF LoginComponent has a form property we can access
      const form = (this.loginComponent as any).form;

      if (form) {
        // Watch for form submission
        form.valueChanges.subscribe(() => {
          // This will be called when form values change
          // We'll capture on actual submit
        });

        // Override the submit handler to capture credentials before login
        const originalSubmit = form.onSubmit;
        if (originalSubmit) {
          // Store credentials before the form submits
          const username = form.get('username')?.value || '';
          const password = form.get('password')?.value || '';

          if (username && password) {
            const url = this.getAlfrescoUrl();
            console.log('[Custom Login] Capturing credentials - username:', username, 'url:', url);

            this.credentialStorage.storeCredentials({
              username: username,
              password: password,
              url: url
            });
            console.log('[Custom Login] Credentials stored successfully');
          }
        }
      }

      // Alternative approach: Listen to the login component's success event
      // ADF LoginComponent emits a 'success' event when login succeeds
      // We'll use a different approach - intercept the form directly via DOM
      setTimeout(() => {
        this.setupCredentialCapture();
      }, 100);
    }
  }

  private setupCredentialCapture(): void {
    // Find the login form in the DOM
    const form = document.querySelector('form[adf-login-form]') as HTMLFormElement;
    if (!form) {
      // Try alternative selectors
      const forms = document.querySelectorAll('form');
      for (let i = 0; i < forms.length; i++) {
        const f = forms[i];
        if (f.querySelector('#username') && f.querySelector('#password')) {
          this.interceptForm(f);
          break;
        }
      }
    } else {
      this.interceptForm(form);
    }
  }

  private interceptForm(form: HTMLFormElement): void {
    // Get username and password inputs
    const usernameInput = form.querySelector('#username') as HTMLInputElement;
    const passwordInput = form.querySelector('#password') as HTMLInputElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    if (usernameInput && passwordInput) {
      // Store credentials when form is submitted
      const captureCredentials = () => {
        const username = usernameInput.value || '';
        const password = passwordInput.value || '';

        if (username && password) {
          const url = this.getAlfrescoUrl();
          console.log('[Custom Login] Capturing credentials on submit - username:', username, 'url:', url);

          this.credentialStorage.storeCredentials({
            username: username,
            password: password,
            url: url
          });
          console.log('[Custom Login] Credentials stored successfully');
        }
      };

      // Intercept form submission
      form.addEventListener('submit', () => {
        captureCredentials();
        // Let the form submit normally - don't prevent default
      }, { capture: true });

      // Also capture on button click as backup
      if (submitButton) {
        submitButton.addEventListener('click', () => {
          captureCredentials();
        }, { capture: true });
      }
    }
  }

  private getAlfrescoUrl(): string {
    try {
      // Get the resolved ecmHost from ACA's configuration
      // This handles dynamic templates like {protocol}//{hostname}{:port}
      // The proxy will handle routing to the actual backend (e.g., 4200 -> 8080)
      const ecmHost = this.appConfig.get<string>('ecmHost', '');

      if (ecmHost) {
        // AppConfigService automatically resolves {protocol}, {hostname}, {:port} placeholders
        // Use the resolved URL as-is - the proxy will handle backend routing
        return ecmHost;
      }

      // Fallback: use window location if config not available
      console.warn('[Custom Login] ecmHost not found in app config, using window.location.origin as fallback');
      return window.location.origin;
    } catch (error) {
      console.warn('[Custom Login] Could not get Alfresco URL from config:', error);
      return window.location.origin;
    }
  }
}

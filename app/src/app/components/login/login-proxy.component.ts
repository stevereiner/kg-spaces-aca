/*!
 * Copyright © 2005-2025 Hyland Software, Inc. and its affiliates. All rights reserved.
 *
 * Alfresco Example Content Application
 *
 * This file is part of the Alfresco Example Content Application.
 * If the software was purchased under a paid Alfresco license, the terms of
 * the paid license agreement will prevail. Otherwise, the software is
 * provided under the following open source license terms:
 *
 * The Alfresco Example Content Application is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Alfresco Example Content Application is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * from Hyland Software. If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, inject, ViewContainerRef, ViewChild, AfterViewInit, Type } from '@angular/core';
import { ExtensionService } from '@alfresco/adf-extensions';
import { AppLoginComponent } from './app-login.component';

@Component({
  selector: 'app-login-proxy',
  template: '<ng-container #loginContainer></ng-container>',
  standalone: true
})
export class LoginProxyComponent implements AfterViewInit {
  @ViewChild('loginContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

  private extensions = inject(ExtensionService);

  ngAfterViewInit(): void {
    // Try to get custom login component from extensions
    let LoginComponent: Type<any> = AppLoginComponent;

    try {
      const customComponent = this.extensions.getComponentById('app.components.login');
      if (customComponent) {
        console.log('[Login Proxy] Using custom login component from extension');
        LoginComponent = customComponent;
      } else {
        console.log('[Login Proxy] Using default login component');
      }
    } catch (error) {
      console.debug('[Login Proxy] ExtensionService error, using default:', error);
    }

    // Create and insert the component
    // Use setTimeout to ensure ViewContainerRef is fully initialized
    setTimeout(() => {
      if (this.container) {
        try {
          this.container.createComponent(LoginComponent);
          console.log('[Login Proxy] Component created successfully');
        } catch (error) {
          console.error('[Login Proxy] Error creating component:', error);
          // Fallback to default if custom component fails
          if (LoginComponent !== AppLoginComponent) {
            console.log('[Login Proxy] Falling back to default login component');
            this.container.createComponent(AppLoginComponent);
          }
        }
      } else {
        console.error('[Login Proxy] ViewContainerRef not available');
      }
    }, 0);
  }
}

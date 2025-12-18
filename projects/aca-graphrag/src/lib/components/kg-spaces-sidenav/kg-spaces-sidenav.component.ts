import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { IconComponent } from '@alfresco/adf-core';

@Component({
  selector: 'aca-kg-spaces-sidenav',
  standalone: true,
  imports: [CommonModule, MatButtonModule, TranslateModule, IconComponent],
  template: `
    <div class="kg-spaces-sidenav-container">
      <button
        mat-button
        class="aca-action-button aca-full-width"
        (click)="navigateToKgSpaces()"
        [attr.aria-label]="'KG Spaces' | translate"
        [attr.title]="'KG Spaces - Process and query documents with GraphRAG' | translate"
        data-automation-id="app.kg-spaces.navbar">
        <adf-icon value="hub" />
        <span class="action-button__label">{{ 'KG Spaces' | translate }}</span>
      </button>
    </div>
  `,
  styleUrls: [] // Empty array - styles moved to kg-spaces.component.scss
})
export class KgSpacesSidenavComponent {
  // This component is available for custom sidebar navigation if needed
  // Currently, KG Spaces navigation is configured via plugin.json as a standard navbar item
  // The styles for sidebar spacing are in kg-spaces.component.scss
  // Using inline template to avoid TypeScript file reference issues with ng-packagr

  constructor(private router: Router) {}

  navigateToKgSpaces(): void {
    this.router.navigate(['/kg-spaces']);
  }
}

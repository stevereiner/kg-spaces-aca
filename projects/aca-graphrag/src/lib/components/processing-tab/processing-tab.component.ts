import { Component, Input } from '@angular/core';

@Component({
  selector: 'aca-kg-processing-tab',
  template: `
    <div class="processing-tab">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Process Documents</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="!hasConfiguredSources">Please configure a source in the Alfresco tab first.</p>
          <p *ngIf="hasConfiguredSources">Processing UI coming soon...</p>
          <p *ngIf="hasConfiguredSources" class="config-info">
            Configuration: {{ alfrescoConfig | json }}
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .processing-tab {
      max-width: 1200px;
      margin: 0 auto;
    }
    .config-info {
      font-family: monospace;
      font-size: 0.875rem;
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `],
  standalone: false
})
export class ProcessingTabComponent {
  @Input() hasConfiguredSources = false;
  @Input() alfrescoConfig: any = null;
  @Input() configurationTimestamp = 0;
}


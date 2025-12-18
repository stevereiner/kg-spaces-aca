import { Component } from '@angular/core';

@Component({
  selector: 'aca-kg-query-tab',
  template: `
    <div class="query-tab">
      <mat-card>
        <mat-card-header>
          <mat-card-title>AI Query</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>AI Query UI coming soon...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .query-tab {
      max-width: 1200px;
      margin: 0 auto;
    }
  `],
  standalone: false
})
export class QueryTabComponent {}

